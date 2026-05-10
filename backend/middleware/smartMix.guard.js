const QueryHistory = require("../models/QueryHistory");
const mongoose = require("mongoose");
const log = require("../utils/logger");
const {
	ALLOWED_MODES,
	getAccessPolicy,
	getMessageCost,
	getModelSelectionLimit,
	isModeAllowed,
} = require("../utils/userAccessPolicy");

function normalizeModels(activeModels) {
	if (!Array.isArray(activeModels)) return [];

	const unique = new Set();
	for (const model of activeModels) {
		const normalized = String(model || "").trim();
		if (normalized) unique.add(normalized);
	}

	return Array.from(unique);
}

module.exports = async function smartMixGuard(req, res, next) {
	try {
		const { conversationId, type } = req.body;
		const user = req.user;
		const activeModels = normalizeModels(req.body.activeModels);
		const normalizedMode = String(type || "").trim().toLowerCase();

		if (activeModels.length === 0) {
			return res.status(400).json({ msg: "No models provided" });
		}

		const accessPolicy = getAccessPolicy(user);
		const maxSelectableModels = getModelSelectionLimit(user.subscription);
		if (
			Number.isFinite(maxSelectableModels) &&
			activeModels.length > maxSelectableModels
		) {
			return res.status(403).json({
				msg:
					maxSelectableModels === 1
						? "Free plan allows only 1 model per chat."
						: `Pro plan allows up to ${maxSelectableModels} models at chat start.`,
			});
		}

		const usageCost = getMessageCost(user.subscription, activeModels.length);
		const isNewChat = !conversationId;

		if (
			isNewChat &&
			Number.isFinite(accessPolicy.dailyNewChatLimit) &&
			(user.dailyChatCount || 0) >= accessPolicy.dailyNewChatLimit
		) {
			log("WARN", "Daily new chat limit blocked", {
				user: user.email,
				dailyChatCount: user.dailyChatCount || 0,
				limit: accessPolicy.dailyNewChatLimit,
			});

			return res.status(403).json({
				msg: "Daily new chat limit reached for your plan.",
			});
		}

		let effectiveMode = normalizedMode;

		if (isNewChat && !isModeAllowed(normalizedMode)) {
			return res.status(400).json({
				msg: `Invalid mode. Allowed modes: ${ALLOWED_MODES.join(", ")}`,
			});
		}

		if (!isNewChat) {
			if (!mongoose.Types.ObjectId.isValid(conversationId)) {
				return res.status(400).json({
					msg: "Invalid conversation ID format.",
				});
			}

			const conversation = await QueryHistory.findOne({
				_id: conversationId,
				userId: user._id
			});

			if (!conversation) {
				log("WARN", "Unauthorized conversation access", {
					user: user.email,
					conversationId
				});

				return res.status(404).json({
					msg: "Conversation not found or unauthorized"
				});
			}

			const lockedMode = String(conversation.moduleType || "").toLowerCase();

			if (!isModeAllowed(lockedMode)) {
				return res.status(403).json({
					msg: "This conversation uses an unsupported mode. Start a new chat.",
				});
			}

			if (normalizedMode && !isModeAllowed(normalizedMode)) {
				return res.status(400).json({
					msg: `Invalid mode. Allowed modes: ${ALLOWED_MODES.join(", ")}`,
				});
			}

			effectiveMode = normalizedMode || lockedMode;

			if (effectiveMode !== lockedMode) {
				return res.status(403).json({
					msg: "Mode is locked for this conversation and cannot be changed.",
				});
			}

			if (
				user.subscription === "Free" &&
				Array.isArray(conversation.allowedModels) &&
				conversation.allowedModels.length > 1
			) {
				return res.status(403).json({
					msg: "This chat used multiple models. Upgrade to continue.",
				});
			}

			if (Array.isArray(conversation.allowedModels) && conversation.allowedModels.length > 0) {
				const hasUnauthorizedModel = activeModels.some(
					(model) => !conversation.allowedModels.includes(model)
				);

				if (hasUnauthorizedModel) {
					return res.status(403).json({
						msg: "Selected models are not allowed for this conversation.",
					});
				}
			}

			const currentMessageCount =
				typeof conversation.messageCount === "number"
					? conversation.messageCount
					: conversation.messages.filter((m) => m.role === "user").length;

			const projectedConversationCount = currentMessageCount + usageCost;

			if (
				Number.isFinite(accessPolicy.conversationMessageLimit) &&
				projectedConversationCount > accessPolicy.conversationMessageLimit
			) {
				log("WARN", "Conversation message limit blocked", {
					user: user.email,
					conversationId,
					currentMessageCount,
					usageCost,
					projectedConversationCount,
					limit: accessPolicy.conversationMessageLimit,
				});

				return res.status(403).json({
					msg: "Conversation message limit reached for your plan.",
				});
			}

			req.conversation = conversation;
		}

		req.normalizedMode = effectiveMode;
		req.normalizedActiveModels = activeModels;
		req.usageCost = usageCost;

		next();
	} catch (err) {
		log("ERROR", "SmartMix guard failed", {
			error: err.message,
			stack: err.stack
		});

		return res.status(500).json({
			msg: "Request blocked due to validation error",
			error: err.message
		});
	}
};
