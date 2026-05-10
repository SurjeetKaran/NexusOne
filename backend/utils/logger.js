// utils/logger.js

/**
 * Global logging helper
 * Usage: log('INFO', 'message', optionalData)
 */

const LEVELS = new Set(["DEBUG", "INFO", "WARN", "ERROR"]);

function normalizeData(data) {
    if (data instanceof Error) {
        return {
            error: data.message,
            stack: data.stack,
            name: data.name,
        };
    }

    if (!data || typeof data !== "object") {
        return data;
    }

    const out = { ...data };
    for (const [key, value] of Object.entries(out)) {
        if (value instanceof Error) {
            out[key] = {
                message: value.message,
                stack: value.stack,
                name: value.name,
            };
        }
    }
    return out;
}

const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const normalizedLevel = String(level || "INFO").toUpperCase();
    const safeLevel = LEVELS.has(normalizedLevel) ? normalizedLevel : "INFO";
    const logMessage = `[${timestamp}] [${safeLevel}] ${message}`;
    const normalizedData = normalizeData(data);

    if (normalizedData === null || normalizedData === undefined) {
        console.log(logMessage);
        return;
    }

    console.log(logMessage, normalizedData);
};

module.exports = log;
