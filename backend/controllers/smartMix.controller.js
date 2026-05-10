const log = require("../utils/logger");
const mongoose = require("mongoose");
const QueryHistory = require("../models/QueryHistory");
const { smartMix } = require("../services/smartMix.service");
const {
	registerGeneration,
	getGeneration,
	removeGeneration
} = require("../utils/generationManager");

function generateTitleFromInput(input) {
	return input
		.replace(/\n/g, " ")
		.trim()
		.slice(0, 60) + (input.length > 60 ? "..." : "");
}

exports.processSmartMix = async (req, res) => {
	const generationId = String(req.body.generationId || "").trim() || new mongoose.Types.ObjectId().toString();
	const abortController = new AbortController();
	registerGeneration(generationId, {
		controller: abortController,
		userId: String(req.user._id)
	});

	const cleanup = () => {
		removeGeneration(generationId);
	};

	req.on("close", () => {
		if (!res.writableEnded && !abortController.signal.aborted) {
			abortController.abort();
		}
	});

	try {
		const { input, conversationId } = req.body;
		if (!String(input || "").trim()) {
			return res.status(400).json({
				msg: "Input text is required to process SmartMix."
			});
		}

		const mode = req.normalizedMode;
		const activeModels = req.normalizedActiveModels || [];
		const usageCost = req.usageCost || 1;
		const userId = req.user._id;

		const isNewChat = !conversationId;

		log("INFO", "[Controller] SmartMix request", {
			user: req.user.email,
			newChat: isNewChat,
			activeModels
		});

		let conversation = req.conversation;

		if (!conversation) {
			conversation = new QueryHistory({
				userId,
				moduleType: mode,
				allowedModels: activeModels,
				messageCount: 0,
				messages: []
			});
		} else if (!Array.isArray(conversation.allowedModels) || conversation.allowedModels.length === 0) {
			// Backfill for legacy conversations created before allowedModels existed.
			conversation.allowedModels = activeModels;
		}

		conversation.messages.push({
			role: "user",
			content: input,
			timestamp: new Date()
		});

		if (isNewChat && conversation.messages.length === 1) {
			conversation.title = generateTitleFromInput(input);
		}

		const outputs = await smartMix(
			input,
			mode,
			conversation.messages,
			activeModels,
			{ signal: abortController.signal }
		);

		const responseOutputs = outputs?.outputs || {};
		const wasTerminated = Boolean(outputs?.terminated);

		const hasUsableOutput = Object.values(responseOutputs || {}).some((out) => {
			if (typeof out === "string") {
				return String(out).trim().length > 0;
			}
			return String(out?.text || "").trim().length > 0;
		});

		if (!hasUsableOutput && !wasTerminated) {
			const noOutputErr = new Error("No output generated. Message was not counted.");
			noOutputErr.statusCode = 502;
			throw noOutputErr;
		}

		if (hasUsableOutput || wasTerminated) {
			const firstOutput = Object.values(responseOutputs)[0];
			conversation.messages.push({
				role: "assistant",
				content: firstOutput?.text || (wasTerminated ? "Generation stopped." : "AI Response"),
				individualOutputs: responseOutputs,
				timestamp: new Date(),
				wasTerminated
			});
		}

		if (hasUsableOutput || wasTerminated) {
			conversation.messageCount = (conversation.messageCount || 0) + usageCost;
			req.user.dailyQueryCount = (req.user.dailyQueryCount || 0) + usageCost;
			if (isNewChat) {
				req.user.dailyChatCount = (req.user.dailyChatCount || 0) + 1;
			}
		}
		conversation.lastUpdated = new Date();

		await conversation.save();
		await req.user.save();

		return res.json({
			conversationId: conversation._id,
			outputs: responseOutputs,
			terminated: wasTerminated,
			generationId
		});
	} catch (err) {
		log("ERROR", "[Controller] SmartMix failed", {
			error: err.message,
			stack: err.stack
		});

		if (err.statusCode && Number.isInteger(err.statusCode)) {
			return res.status(err.statusCode).json({
				msg: err.message
			});
		}

		return res.status(500).json({
			msg: "SmartMix failed due to an internal error. Please try again."
		});
	} finally {
		cleanup();
	}
};

exports.terminateSmartMix = async (req, res) => {
	try {
		const generationId = String(req.body.generationId || "").trim();
		if (!generationId) {
			return res.status(400).json({ msg: "generationId is required." });
		}

		const generation = getGeneration(generationId);
		if (!generation) {
			return res.status(404).json({ msg: "No active generation found." });
		}

		if (String(generation.userId) !== String(req.user._id)) {
			return res.status(403).json({ msg: "You are not allowed to stop this generation." });
		}

		if (!generation.controller.signal.aborted) {
			generation.controller.abort();
		}

		return res.json({ msg: "Generation termination requested.", generationId });
	} catch (err) {
		log("ERROR", "Terminate SmartMix failed", err);
		return res.status(500).json({ msg: "Failed to stop the current generation." });
	}
};

exports.getConversationById = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ msg: "Invalid conversation ID format." });
		}

		const conversation = await QueryHistory.findOne({
			_id: req.params.id,
			userId: req.user._id
		});

		if (!conversation) {
			return res.status(404).json({ msg: "Conversation not found" });
		}

		res.json({ conversation });
	} catch (err) {
		log("ERROR", "Get conversation failed", err);
		res.status(500).json({ msg: "Failed to fetch conversation. Please try again." });
	}
};

exports.deleteConversationById = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ msg: "Invalid conversation ID format." });
		}

		const deleted = await QueryHistory.findOneAndDelete({
			_id: req.params.id,
			userId: req.user._id
		});

		if (!deleted) {
			return res.status(404).json({
				msg: "Conversation not found or unauthorized"
			});
		}

		res.json({
			msg: "Conversation deleted successfully",
			id: req.params.id
		});
	} catch (err) {
		log("ERROR", "Delete conversation failed", err);
		res.status(500).json({ msg: "Failed to delete conversation. Please try again." });
	}
};

exports.persistPartialAssistantOutput = async (req, res) => {
	try {
		const { conversationId, content, individualOutputs } = req.body || {};

		if (!mongoose.Types.ObjectId.isValid(conversationId)) {
			return res.status(400).json({ msg: "Invalid conversation ID format." });
		}

		const conversation = await QueryHistory.findOne({
			_id: conversationId,
			userId: req.user._id
		});

		if (!conversation) {
			return res.status(404).json({ msg: "Conversation not found" });
		}

		let targetIndex = -1;
		for (let i = conversation.messages.length - 1; i >= 0; i--) {
			if (conversation.messages[i]?.role === "assistant") {
				targetIndex = i;
				break;
			}
		}

		if (targetIndex === -1) {
			return res.status(400).json({ msg: "No assistant message found to update." });
		}

		const safeOutputs = (individualOutputs && typeof individualOutputs === "object") ? individualOutputs : {};
		const firstOutput = Object.values(safeOutputs)[0];
		const fallbackContent = typeof firstOutput?.text === "string" ? firstOutput.text : "Generation stopped.";

		conversation.messages[targetIndex].content = String(content || fallbackContent || "Generation stopped.");
		conversation.messages[targetIndex].individualOutputs = safeOutputs;
		conversation.messages[targetIndex].wasTerminated = true;
		conversation.lastUpdated = new Date();

		await conversation.save();

		return res.json({ msg: "Partial output saved.", conversationId });
	} catch (err) {
		log("ERROR", "Persist partial assistant output failed", err);
		return res.status(500).json({ msg: "Failed to save partial output." });
	}
};
