const log = require("../utils/logger");
const { buildFinalPrompt } = require("./promptBuilder");

const { callGroqProvider } = require("./providers/groqProvider");
const {
  GROQ_FALLBACK_MODEL,
  buildFallbackPrompt
} = require("./smartmix/modelRouting");

async function runSingleApiCall(prompt, requestedModel) {
  const finalPrompt = buildFallbackPrompt(prompt, requestedModel);
  return callGroqProvider(finalPrompt, GROQ_FALLBACK_MODEL);
}

async function smartMix(
  input,
  type = "study",
  history = [],
  activeModels = [],
  options = {}
) {
  if (!String(input || "").trim()) {
    const err = new Error("Input is required for SmartMix processing");
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(activeModels) || activeModels.length === 0) {
    const err = new Error("At least one active model is required");
    err.statusCode = 400;
    throw err;
  }

  log("INFO", "[SmartMix] Started", {
    type,
    historyLength: history.length,
    activeModels
  });

  let finalInput = input;
  if (history?.length > 0) {
    let combined = "Conversation History:\n";
    history.forEach((msg) => {
      combined += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
    });
    combined += `\nUser's New Question:\n${input}`;
    finalInput = combined;
  }

  const outputs = {};

  for (const model of activeModels) {
    let result;
    const normalizedModel = String(model).toLowerCase().trim();

    try {
      log("INFO", "[SmartMix] Single API route", {
        requestedModel: normalizedModel,
        provider: "groq",
        model: GROQ_FALLBACK_MODEL
      });

      const prompt = buildFinalPrompt({
        input: finalInput,
        mode: type,
        model: model
      });

      result = await callGroqProvider(prompt, GROQ_FALLBACK_MODEL, {
        signal: options.signal
      });
    } catch (err) {
      if (options.signal?.aborted || err?.name === "AbortError") {
        log("INFO", "[SmartMix] Terminated by user during provider call", {
          model
        });
        outputs[model] = {
          text: "",
          tokensUsed: 0
        };
        return { outputs, terminated: true };
      }

      log("ERROR", "[SmartMix] Failed", {
        model,
        error: err.message
      });

      result = {
        text: "AI model is temporarily unavailable.",
        tokensUsed: 0
      };
    }

    outputs[model] = {
      text: result.text || "",
      tokensUsed: result.tokensUsed || 0
    };

    if (result.terminated) {
      log("INFO", "[SmartMix] Terminated early by user", { model });
      return { outputs, terminated: true };
    }
  }

  log("INFO", "[SmartMix] Completed", {
    modelCount: Object.keys(outputs).length
  });

  return { outputs, terminated: false };
}

module.exports = { smartMix };
