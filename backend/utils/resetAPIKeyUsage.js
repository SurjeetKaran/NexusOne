const cron = require("node-cron");
const APIKey = require("../models/APIKey");
const logger = require("../utils/logger");

module.exports = function () {
  cron.schedule("0 0 * * *", async () => {
    try {
      logger("INFO", "Starting daily API key & provider usage reset...");

      // Reset API key usage counters.
      await APIKey.updateMany({}, { usedRequests: 0, usedTokens: 0 });

      logger("INFO", "API key usage counters reset successfully");
    } catch (err) {
      logger("ERROR", "Failed to reset usage counters", {
        error: err.message
      });
    }
  });
};
