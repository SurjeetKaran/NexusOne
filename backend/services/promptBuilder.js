function rewriteWithNexusAI(input, mode) {
  const cleanInput = String(input || "").trim();
  const normalizedMode = String(mode || "").toLowerCase().trim();

  if (normalizedMode === "study") {
    return `Explain this topic clearly with:\n- a simple definition\n- practical examples\n- a step-by-step explanation\n- beginner-friendly language\n\nTopic: ${cleanInput}`;
  }

  if (normalizedMode === "content") {
    return `Create engaging, creative, and readable content about this topic. Use clear structure with short sections or bullets where helpful.\n\nTopic: ${cleanInput}`;
  }

  if (normalizedMode === "career") {
    return `Provide clear, actionable, and practical career or business guidance on this topic. Include:\n- a concise overview of the situation or opportunity\n- step-by-step action plan or roadmap\n- key considerations, risks, or things to watch out for\n- practical next steps the person can take today\n\nTopic: ${cleanInput}`;
  }

  return `Answer this user request clearly and helpfully.\n\nRequest: ${cleanInput}`;
}

function getModePrompt(mode) {
  const normalizedMode = String(mode || "").toLowerCase().trim();

  if (normalizedMode === "study") {
    return "Mode: study. Teach like an expert tutor. Keep explanations simple, structured, and step-by-step.";
  }

  if (normalizedMode === "content") {
    return "Mode: content. Write in an engaging, persuasive, and creative style. Use readable formatting with sections or bullets.";
  }

  if (normalizedMode === "career") {
    return "Mode: career. Act as an experienced career coach and business advisor. Give practical, honest, and actionable guidance. Be direct, structured, and motivating. Focus on real-world steps the user can take.";
  }

  return "Mode: general. Provide a clear and useful response.";
}

function getModelPrompt(model) {
  const normalizedModel = String(model || "").toLowerCase().trim();

  if (normalizedModel === "nexusone") {
    return "You are NexusOne, an advanced AI system. Provide the best possible answer with clarity, depth, creativity, and structured insight.";
  }

  if (normalizedModel === "chatgpt") {
    return "You are ChatGPT. Give clear, structured, balanced responses in a professional and easy-to-understand tone.";
  }

  if (normalizedModel === "gemini") {
    return "You are Gemini. Be concise but informative with a modern, slightly technical tone and well-organized output.";
  }

  if (normalizedModel === "claude") {
    return "You are Claude. Be thoughtful and detailed with human-like explanations, deep reasoning, and clarity.";
  }

  if (normalizedModel === "deepseek") {
    return "You are DeepSeek. Be analytical, logical, precise, and technical with a focus on reasoning accuracy.";
  }

  return "You are a helpful AI assistant. Provide a clear and useful response.";
}

function buildFinalPrompt({ input, mode, model }) {
  const rewrittenInput = rewriteWithNexusAI(input, mode);
  const modePrompt = getModePrompt(mode);
  const modelPrompt = getModelPrompt(model);

  return `${modelPrompt}\n\n${modePrompt}\n\n${rewrittenInput}\n\nUser Question:\n${String(input || "").trim()}`;
}

module.exports = {
  rewriteWithNexusAI,
  getModePrompt,
  getModelPrompt,
  buildFinalPrompt,
};
