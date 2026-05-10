const APIKey = require("../models/APIKey");
const { decrypt } = require("./keyEncryptor");
const logger = require("../utils/logger");
const { SINGLE_API } = require("../constants/smartMix");

async function selectKey(provider) {
    // Single API mode: always use configured provider.
    provider = SINGLE_API.PROVIDER;

    const strategy =
        (global.SystemEnv?.API_KEY_SELECTION_STRATEGY || process.env.API_KEY_SELECTION_STRATEGY || "weighted")
            .toLowerCase()
            .trim();

    let keys = await APIKey.find({
        provider,
        isActive: true,
        cooldownUntil: { $lte: new Date() }
    });

    if (!keys.length) {
        logger("ERROR", "No active API keys available", { provider });
        throw new Error("No API keys available for provider " + provider);
    }

    // 🔥 FILTER BY BOTH REQUEST & TOKEN LIMITS
    keys = keys.filter(k =>
        k.usedRequests < k.dailyLimit &&
        k.usedTokens < k.dailyTokenLimit
    );

    if (!keys.length) {
        logger("ERROR", "All API keys exceeded daily limits", { provider });
        throw new Error("All API keys exceeded daily limits");
    }

    let selected;

    if (strategy === "weighted") {
        const pool = [];
        keys.forEach(k => {
            for (let i = 0; i < k.weight; i++) pool.push(k);
        });
        selected = pool[Math.floor(Math.random() * pool.length)];
    }

    if (strategy === "round_robin") {
        selected = keys.sort(
            (a, b) => (a.lastUsedAt || 0) - (b.lastUsedAt || 0)
        )[0];
    }

    if (strategy === "failover") {
        selected = keys[0];
    }

    if (!selected) {
        selected = keys[0];
    }

    logger("INFO", "API key selected", {
        provider,
        keyId: selected._id,
        label: selected.label,
        strategy
    });

    selected.lastUsedAt = new Date();
    await selected.save();

    return {
        ...selected.toObject(),
        key: decrypt(selected.key)
    };
}

async function updateKeyUsage(keyId, usedTokens = 0) {
    await APIKey.findByIdAndUpdate(keyId, {
        $inc: { usedRequests: 1, usedTokens }
    });

    logger("INFO", "API key usage updated", {
        keyId,
        tokens: usedTokens
    });
}

async function markKeyFailed(keyId, errorMessage) {
    const cooldownMinutes = Number(
        global.SystemEnv?.API_KEY_COOLDOWN_MINUTES ||
        process.env.API_KEY_COOLDOWN_MINUTES ||
        10
    );

    await APIKey.findByIdAndUpdate(keyId, {
        cooldownUntil: new Date(Date.now() + cooldownMinutes * 60000),
        lastError: errorMessage
    });

    logger("WARN", "API key marked failed & cooldown applied", {
        keyId,
        cooldownMinutes,
        error: errorMessage
    });
}

module.exports = {
    selectKey,
    updateKeyUsage,
    markKeyFailed
};

