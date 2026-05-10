const APIKey = require("../models/APIKey");
const { encrypt } = require("../utils/keyEncryptor");
const logger = require("../utils/logger");
const { SINGLE_API } = require("../constants/smartMix");

function normalizeModelNames(input) {
    if (Array.isArray(input)) {
        const cleaned = input
            .map((v) => String(v || "").trim())
            .filter(Boolean);
        return Array.from(new Set(cleaned));
    }

    if (typeof input === "string") {
        const cleaned = input
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
        return Array.from(new Set(cleaned));
    }

    return [];
}

/**
 * GET ALL KEYS
 */
exports.getAllKeys = async (req, res) => {
    try {
        const keys = await APIKey.find();
        const masked = keys.map((k) => {
            const obj = k.toObject();
            delete obj.usedTokens;
            delete obj.dailyTokenLimit;

            return {
                ...obj,
                key: "********"
            };
        });

        logger("INFO", "Admin fetched API key list");
        res.json(masked);
    } catch (err) {
        logger("ERROR", "Failed to fetch API keys", { error: err.message });
        res.status(500).json({ message: "Failed to fetch API keys" });
    }
};

/**
 * CREATE KEY  ✅ FIXED
 */
exports.createKey = async (req, res) => {
    try {
        let {
            label,
            key,
            modelNames,
            weight,
            dailyLimit
        } = req.body;

        if (!key) {
            return res.status(400).json({
                message: "API key is required"
            });
        }

        // Single API mode: provider is fixed to configured provider.
        const provider = SINGLE_API.PROVIDER;

        // HARD GUARD (CRITICAL FIX)
        if (typeof key !== "string") {
            logger("ERROR", "Invalid API key type received", {
                provider,
                receivedType: typeof key,
                value: key
            });
            return res.status(400).json({
                message: "API key must be a string"
            });
        }

        key = key.trim();
        if (!key) {
            return res.status(400).json({
                message: "API key cannot be empty"
            });
        }

        const existingLabel = await APIKey.findOne({ provider, label });
        if (existingLabel) {
            return res.status(400).json({
                message: `A key with the label "${label}" already exists for provider "${provider}".`
            });
        }

        const encryptedKey = encrypt(key);
        if (!encryptedKey) {
            return res.status(500).json({
                message: "Failed to encrypt API key"
            });
        }

        const normalizedModelNames = normalizeModelNames(modelNames);

        const newKey = await APIKey.create({
            provider,
            label,
            modelNames: normalizedModelNames,
            key: encryptedKey,
            encrypted: true,
            weight,
            dailyLimit
        });

        logger("INFO", "API key created", { provider, label });
        res.status(201).json({
            message: "API key added successfully",
            key: newKey
        });

    } catch (err) {
        logger("ERROR", "Failed to create API key", { error: err.message });
        res.status(500).json({ message: "Failed to create API key" });
    }
};

/**
 * UPDATE KEY  ✅ FIXED
 */
exports.updateKey = async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body;

        // Single API mode: provider cannot be changed by API.
        delete update.provider;
        delete update.usedTokens;
        delete update.dailyTokenLimit;

        if (update.key) {
            // 🚨 HARD GUARD (CRITICAL FIX)
            if (typeof update.key !== "string") {
                logger("ERROR", "Invalid API key type on update", {
                    id,
                    receivedType: typeof update.key,
                    value: update.key
                });
                return res.status(400).json({
                    message: "API key must be a string"
                });
            }

            update.key = encrypt(update.key.trim());
            if (!update.key) {
                return res.status(500).json({
                    message: "Failed to encrypt API key"
                });
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, "modelNames")) {
            update.modelNames = normalizeModelNames(update.modelNames);
        }

        const updated = await APIKey.findByIdAndUpdate(id, update, { new: true });

        logger("INFO", "API key updated", { id });
        res.json({
            message: "API key updated successfully",
            key: updated
        });

    } catch (err) {
        logger("ERROR", "Failed to update API key", { error: err.message });
        res.status(500).json({ message: "Failed to update API key" });
    }
};

/**
 * DELETE KEY
 */
exports.deleteKey = async (req, res) => {
    try {
        await APIKey.findByIdAndDelete(req.params.id);

        logger("WARN", "API key deleted", { id: req.params.id });
        res.json({ message: "API key deleted" });
    } catch (err) {
        logger("ERROR", "Failed to delete API key", { error: err.message });
        res.status(500).json({ message: "Failed to delete API key" });
    }
};

/**
 * TOGGLE STATUS
 */
exports.toggleStatus = async (req, res) => {
    try {
        const key = await APIKey.findById(req.params.id);
        key.isActive = !key.isActive;
        await key.save();

        logger("INFO", "API key status toggled", {
            id: key._id,
            active: key.isActive
        });

        res.json({
            message: "Status updated",
            isActive: key.isActive
        });
    } catch (err) {
        logger("ERROR", "Failed to toggle key status", { error: err.message });
        res.status(500).json({ message: "Failed to toggle key" });
    }
};
