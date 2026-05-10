const cron = require("node-cron");
const User = require("../models/User");
const log = require("./logger");

/**
 * Schedule a daily job to reset users' daily counters to 0
 * Runs every day at 00:00 server time
 */
const scheduleDailyQueryReset = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      // --- Reset all users with any daily usage ---
      const resultUsers = await User.updateMany(
        {
          $or: [
            { dailyQueryCount: { $gt: 0 } },
            { dailyChatCount: { $gt: 0 } }
          ]
        },
        { $set: { dailyQueryCount: 0, dailyChatCount: 0 } }
      );
      log(
        "INFO",
        `Daily counters reset for users. Modified ${resultUsers.modifiedCount} users.`
      );
    } catch (err) {
      log("ERROR", "Failed to reset daily counters", err.stack);
    }
  });

  log("INFO", "Daily counters reset cron job scheduled at 00:00 every day");
};

module.exports = scheduleDailyQueryReset;

