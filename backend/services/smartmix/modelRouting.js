const { SMART_MIX_FALLBACK } = require("../../constants/smartMix");

const GROQ_FALLBACK_MODEL = SMART_MIX_FALLBACK.GROQ_MODEL;

function buildFallbackPrompt(modulePrompt, requestedModel) {
  return `Requested model label: ${requestedModel}\nExecution model: ${GROQ_FALLBACK_MODEL} (single API mode)\n\n${modulePrompt}`;
}

module.exports = {
  GROQ_FALLBACK_MODEL,
  buildFallbackPrompt
};
