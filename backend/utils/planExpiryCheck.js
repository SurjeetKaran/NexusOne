const cron = require("node-cron");
const User = require("../models/User");
const log = require("./logger");

/**
 * Schedule a daily job to downgrade expired Trial/Pro users.
 * Runs every day at 00:10 server time
 */
const schedulePlanExpiryCheck = () => {
  cron.schedule("10 0 * * *", async () => {
    try {
      const now = new Date();

      const expiredTrialResult = await User.updateMany(
        {
          subscription: "Trial",
          trialExpiryDate: { $lte: now },
        },
        {
          $set: { subscription: "Free" },
          $unset: { trialStartDate: 1, trialExpiryDate: 1 }
        }
      );

      const expiredProResult = await User.updateMany(
        {
          subscription: "Pro",
          expiryDate: { $lte: now },
        },
        {
          $set: { subscription: "Free" },
          $unset: { subscribedAt: 1, expiryDate: 1 }
        }
      );

      log("INFO", "Plan expiry check completed for Users.", {
        trialDowngraded: expiredTrialResult.modifiedCount,
        proDowngraded: expiredProResult.modifiedCount,
      });

    } catch (err) {
      log("ERROR", "Failed to process plan expiry check", err.stack);
    }
  });

  log("INFO", "Plan expiry cron job scheduled at 00:10 every day");
};

module.exports = schedulePlanExpiryCheck;
