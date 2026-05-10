const { selectKey, updateKeyUsage, markKeyFailed } = require("../../utils/keyBalancer");
const log = require("../../utils/logger");

/**
 * Call Groq API
 * @param {string} prompt - The user prompt
 * @param {string} modelName - Model identifier (e.g., "mixtral-8x7b-32768")
 */
async function callGroqProvider(prompt, modelName, options = {}) {
  const { signal } = options;
  let keyData;
  
  try {
    keyData = await selectKey("groq");

    if (!keyData || !keyData.key) {
      throw new Error("No active provider key available for Groq");
    }

    log("INFO", "Calling Groq API", {
      model: modelName,
      keyLabel: keyData.label
    });

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keyData.key}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
          stream_options: {
            include_usage: true
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    if (!response.body || !response.body.getReader) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "No response";
      const tokensUsed =
        (data.usage?.prompt_tokens || 0) +
        (data.usage?.completion_tokens || 0);

      await updateKeyUsage(keyData._id, tokensUsed);

      log("INFO", "Groq API success", {
        model: modelName,
        tokensUsed
      });

      return {
        text,
        tokensUsed
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let tokensUsed = 0;
    let aborted = false;

    try {
      while (true) {
        if (signal?.aborted) {
          aborted = true;
          break;
        }

        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;

          const payloadText = line.slice(5).trim();
          if (!payloadText) continue;

          if (payloadText === "[DONE]") {
            buffer = "";
            break;
          }

          try {
            const payload = JSON.parse(payloadText);
            const delta = payload.choices?.[0]?.delta?.content || "";
            if (delta) text += delta;

            const usage = payload.usage;
            if (usage) {
              tokensUsed =
                (usage.prompt_tokens || 0) +
                (usage.completion_tokens || 0);
            }
          } catch (parseErr) {
            log("WARN", "Failed to parse Groq stream chunk", {
              model: modelName,
              error: parseErr.message
            });
          }
        }
      }
    } catch (streamErr) {
      if (signal?.aborted || streamErr.name === "AbortError") {
        aborted = true;
      } else {
        throw streamErr;
      }
    }

    try {
      await updateKeyUsage(keyData._id, tokensUsed);
    } catch (usageErr) {
      log("WARN", "Failed to update Groq key usage", {
        model: modelName,
        error: usageErr.message
      });
    }

    log("INFO", "Groq API success", {
      model: modelName,
      tokensUsed,
      aborted
    });

    return {
      text,
      tokensUsed,
      terminated: aborted
    };

  } catch (err) {
    // User-initiated terminate should not be treated as provider failure.
    if (signal?.aborted || err?.name === "AbortError") {
      log("INFO", "Groq request aborted by user", {
        model: modelName,
        hasSelectedKey: Boolean(keyData?._id)
      });
      return {
        text: "",
        tokensUsed: 0,
        terminated: true
      };
    }

    log("ERROR", "Groq API failed", {
      model: modelName,
      error: err.message,
      hasSelectedKey: Boolean(keyData?._id)
    });

    if (keyData) {
      await markKeyFailed(keyData._id, err.message);
    }

    throw err;
  }
}

module.exports = { callGroqProvider };
