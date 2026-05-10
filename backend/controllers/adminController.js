// controllers/adminController.js
const User = require("../models/User");
const QueryHistory = require("../models/QueryHistory");
const Plan = require("../models/Plan");

const APIKey = require("../models/APIKey");
const SystemConfig = require("../models/SystemConfig");
const ProUpgradeRequest = require("../models/ProUpgradeRequest");

const log = require("../utils/logger");

// ======================================================================
// ADMIN DASHBOARD (API key stats + system config + upgrade requests)
// ======================================================================
exports.getAdminDashboard = async (req, res) => {
  try {
    log("INFO", `Admin ${req.admin.email} requested dashboard data`);

    // -------------------------------------------------
    // 1️⃣ USER STATS
    // -------------------------------------------------
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ subscription: "Pro" });
    const superUsers = await User.countDocuments({ subscription: "Super" });

    const now = new Date();
    const start = req.query.start ? new Date(req.query.start) : new Date(0);
    const end = req.query.end ? new Date(req.query.end) : now;
    end.setHours(23, 59, 59, 999);

    // Fetch plan prices dynamically from DB, fallback to defaults
    const [proPlan, superPlan] = await Promise.all([
      Plan.findOne({ name: "Pro" }),
      Plan.findOne({ name: "Super" }),
    ]);
    const proPlanPrice = proPlan?.price ?? 299;
    const superPlanPrice = superPlan?.price ?? 499;

    const [revenueProUsers, revenueSuperUsers] = await Promise.all([
      User.countDocuments({ subscription: "Pro", subscribedAt: { $gte: start, $lte: end } }),
      User.countDocuments({ subscription: "Super", subscribedAt: { $gte: start, $lte: end } }),
    ]);

    const totalRevenue = (revenueProUsers * proPlanPrice) + (revenueSuperUsers * superPlanPrice);

    // Revenue chart — combine Pro + Super per day
    const revenueAgg = await User.aggregate([
      {
        $match: {
          subscription: { $in: ["Pro", "Super"] },
          subscribedAt: { $gte: start, $lte: end, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$subscribedAt" } },
            subscription: "$subscription"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Merge Pro + Super revenue per date
    const revenuByDate = {};
    for (const r of revenueAgg) {
      const date = r._id.date;
      const price = r._id.subscription === "Super" ? superPlanPrice : proPlanPrice;
      revenuByDate[date] = (revenuByDate[date] || 0) + r.count * price;
    }
    const revenueChart = Object.entries(revenuByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // -------------------------------------------------
    // 2️⃣ MODULE STATS
    // -------------------------------------------------
    const moduleStatsRaw = await QueryHistory.aggregate([
      { $group: { _id: "$moduleType", count: { $sum: 1 } } }
    ]);

    const moduleStats = moduleStatsRaw.map(m => ({
      module: m._id || "General",
      count: m.count
    }));

    // -------------------------------------------------
    // 3️⃣ MODEL USAGE STATS
    // -------------------------------------------------
    const modelStatsAgg = await QueryHistory.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.individualOutputs": { $exists: true } } },
      {
        $group: {
          _id: null,
          chatGPT: { $sum: { $cond: ["$messages.individualOutputs.chatGPT", 1, 0] } },
          claude: { $sum: { $cond: ["$messages.individualOutputs.claude", 1, 0] } },
          gemini: { $sum: { $cond: ["$messages.individualOutputs.gemini", 1, 0] } },
          groq: { $sum: { $cond: ["$messages.individualOutputs.groq", 1, 0] } }
        }
      }
    ]);

    const modelStats = modelStatsAgg[0] || { chatGPT: 0, claude: 0, gemini: 0, groq: 0 };

    // -------------------------------------------------
    // 4️⃣ PROVIDER USAGE STATS
    // -------------------------------------------------
    const providers = ["groq", "openai", "anthropic", "google"];
    const providerStats = {};

    for (const provider of providers) {
      const keys = await APIKey.find({ provider });
      const totalRequests = keys.reduce((a, b) => a + (b.usedRequests || 0), 0);
      const tokensUsed = keys.reduce((a, b) => a + (b.usedTokens || 0), 0);
      const activeKeys = keys.filter(k => k.isActive).length;
      const cooldowns = keys.filter(k => k.cooldownUntil && k.cooldownUntil > new Date()).length;
      const failedKeys = keys.filter(k => k.lastError && k.lastError !== "").length;

      providerStats[provider] = { totalRequests, tokensUsed, activeKeys, failedKeys, cooldowns };
    }

    // -------------------------------------------------
    // 5️⃣ RECENT QUERIES
    // -------------------------------------------------
    const recentQueries = await QueryHistory.find()
      .populate("userId", "name email subscription")
      .sort({ lastUpdated: -1 })
      .limit(50);

    const totalQueries = await QueryHistory.countDocuments();

    // -------------------------------------------------
    // 8️⃣ API KEY STATS (with health)
    // -------------------------------------------------
    const apiKeys = await APIKey.find().sort({ provider: 1 });

    const apiKeyStats = apiKeys.map(k => ({
      id: k._id,
      provider: k.provider,
      label: k.label,
      weight: k.weight,
      usedRequests: k.usedRequests,
      usedTokens: k.usedTokens,
      dailyLimit: k.dailyLimit,
      isActive: k.isActive,
      cooldownUntil: k.cooldownUntil,
      lastError: k.lastError,
      lastUsedAt: k.lastUsedAt,
      health:
        (k.cooldownUntil && k.cooldownUntil > new Date()) ? "cooldown" :
        (k.lastError && k.lastError !== "") ? "failing" : "healthy"
    }));

    // -------------------------------------------------
    // 9️⃣ SYSTEM CONFIG (dynamic env)
    // -------------------------------------------------
    const systemConfigList = await SystemConfig.find().sort({ key: 1 });

    // -------------------------------------------------
    // 🔟 PRO UPGRADE REQUEST COUNT
    // -------------------------------------------------
    const pendingProUpgradeRequests = await ProUpgradeRequest.countDocuments({
      status: "pending",
    });

    // -------------------------------------------------
    // 1️⃣1️⃣ FINAL RESPONSE
    // -------------------------------------------------
    const dashboardData = {
      userStats: {
        totalUsers,
        proUsers,
        superUsers,
        totalRevenue,
        totalQueries,
        pendingProUpgradeRequests
      },

      revenueChart,
      usersList: await User.find().sort({ createdAt: -1 }),

      moduleStats,
      modelStats,
      providerStats,
      recentQueries,

      apiKeys: apiKeyStats,

      systemConfig: systemConfigList,
    };

    log("INFO", "Admin dashboard data sent successfully");
    res.json(dashboardData);
  } catch (error) {
    log("ERROR", "Failed to load admin dashboard", { error: error.message });
    res.status(500).json({ msg: "Failed to fetch dashboard data" });
  }
};

// Remaining plan/plan-management functions follow (unchanged from your original)
exports.updateUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;

    log("INFO", `Admin updating plan for user ${id} → ${subscription}`);

    const update = { subscription };

    if (subscription === "Pro") {
      const now = new Date();
      update.subscribedAt = now;
      update.expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      update.trialStartDate = null;
      update.trialExpiryDate = null;
    } else if (subscription === "Trial") {
      const now = new Date();
      update.trialStartDate = now;
      update.trialExpiryDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      update.subscribedAt = null;
      update.expiryDate = null;
    } else {
      update.subscribedAt = null;
      update.expiryDate = null;
      update.trialStartDate = null;
      update.trialExpiryDate = null;
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true });

    if (!user) {
      log("WARN", "Attempted to update non-existent user", { id });
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      msg: "User subscription updated",
      user
    });

  } catch (error) {
    log("ERROR", "Failed to update user plan", { error: error.message });
    res.status(500).json({ msg: "Failed to update subscription" });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, price, dailyQueryLimit, features } = req.body;

    if (await Plan.findOne({ name })) {
      log("WARN", "Duplicate plan creation attempted", { name });
      return res.status(400).json({ msg: "Plan already exists" });
    }

    const plan = await Plan.create({ name, price, dailyQueryLimit, features });

    log("INFO", "Plan created successfully", { name });
    res.status(201).json(plan);

  } catch (error) {
    log("ERROR", "Failed to create plan", { error: error.message });
    res.status(500).json({ msg: "Failed to create plan" });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      log("WARN", "Attempt to delete non-existent plan", { id: req.params.id });
      return res.status(404).json({ msg: "Plan not found" });
    }

    log("INFO", "Plan deleted", { name: plan.name });
    res.json({ msg: "Plan deleted successfully" });

  } catch (error) {
    log("ERROR", "Failed to delete plan", { error: error.message });
    res.status(500).json({ msg: "Failed to delete plan" });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });

    log("INFO", "Plans fetched", {
      requestedBy: req.admin?.email || "public"
    });

    res.json(plans);

  } catch (error) {
    log("ERROR", "Failed to fetch plans", { error: error.message });
    res.status(500).json({ msg: "Failed to fetch plans" });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedPlan) {
      log("WARN", "Plan update attempted on non-existent plan", { id: req.params.id });
      return res.status(404).json({ msg: "Plan not found" });
    }

    log("INFO", "Plan updated", { name: updatedPlan.name });
    res.json(updatedPlan);

  } catch (error) {
    log("ERROR", "Failed to update plan", { error: error.message });
    res.status(500).json({ msg: "Failed to update plan" });
  }
};

// ------------------- FULL USER USAGE DASHBOARD (MASTER ANALYTICS) -------------------
exports.getFullUserUsageDashboard = async (req, res) => {
  try {
    const userId = req.params.userId;
    log("INFO", `Full user usage requested for user ${userId} by ${req.admin?.email || req.user?.email || 'unknown'}`);

    // 1️⃣ FETCH USER
    const user = await User.findById(userId).select(
      "_id name email subscription subscribedAt expiryDate createdAt"
    );

    if (!user) return res.status(404).json({ msg: "User not found" });

    // 2️⃣ FETCH ALL QUERIES
    const queryList = await QueryHistory.find({ userId }).sort({ lastUpdated: -1 });

    const totalQueries = queryList.length;

    // INITIALIZE ANALYTICS STORAGE
    const moduleUsage = {};   // moduleType → count
    const modelUsage = { chatGPT: 0, claude: 0, gemini: 0, groq: 0 };
    const providerUsage = { groq: 0, openai: 0, anthropic: 0, google: 0 };

    const queryTokenReports = []; // per-query breakdown

    // 3️⃣ PROCESS EACH QUERY
    for (const q of queryList) {
      // Module stats
      moduleUsage[q.moduleType] = (moduleUsage[q.moduleType] || 0) + 1;

      let totalTokens = 0;
      let perModel = { chatGPT: 0, claude: 0, gemini: 0, groq: 0 };
      let perProvider = { groq: 0, openai: 0, anthropic: 0, google: 0 };

      const formattedMessages = [];

      for (const msg of q.messages) {
        const preview = msg.content ? msg.content.slice(0, 200) : null;

        if (msg.tokenUsage) {
          // Support two tokenUsage shapes:
          // 1) New aggregated shape saved by SmartMix controller:
          //    { total: Number, modelTokens: { chatGPT: N, ... }, providerTokens: { openai: N, ... } }
          // 2) Older per-message shape:
          //    { model: 'chatGPT', provider: 'openai', tokens: N }

          // Shape (1)
          if (typeof msg.tokenUsage.total === 'number' || msg.tokenUsage.modelTokens || msg.tokenUsage.providerTokens) {
            const tokens = msg.tokenUsage.total || 0;
            totalTokens += tokens;

            const mTokens = msg.tokenUsage.modelTokens || {};
            for (const mk of Object.keys(mTokens)) {
              const val = mTokens[mk] || 0;
              if (perModel[mk] !== undefined) perModel[mk] += val;
              if (modelUsage[mk] !== undefined) modelUsage[mk] += val;
            }

            const pTokens = msg.tokenUsage.providerTokens || {};
            for (const pk of Object.keys(pTokens)) {
              const val = pTokens[pk] || 0;
              if (perProvider[pk] !== undefined) perProvider[pk] += val;
              if (providerUsage[pk] !== undefined) providerUsage[pk] += val;
            }

            // If model-level tokens weren't provided, but individualOutputs exist,
            // derive per-model tokens from `individualOutputs` (avoid changing totalTokens
            // since it's already accounted for above).
            if ((!msg.tokenUsage.modelTokens || Object.keys(msg.tokenUsage.modelTokens).length === 0) && msg.individualOutputs && typeof msg.individualOutputs === 'object') {
              for (const mk of Object.keys(msg.individualOutputs)) {
                const out = msg.individualOutputs[mk] || {};
                const val = out.tokensUsed || out.totalTokens || out.tokens || 0;
                if (val) {
                  if (perModel[mk] !== undefined) perModel[mk] += val;
                  if (modelUsage[mk] !== undefined) modelUsage[mk] += val;
                }
              }
            }

          // Shape (2)
          } else if (msg.tokenUsage.tokens || msg.tokenUsage.model || msg.tokenUsage.provider) {
            const model = msg.tokenUsage.model;
            const provider = msg.tokenUsage.provider;
            const tokens = msg.tokenUsage.tokens || 0;

            totalTokens += tokens;

            if (perModel[model] !== undefined) perModel[model] += tokens;
            if (perProvider[provider] !== undefined) perProvider[provider] += tokens;

            // Add to global totals
            if (modelUsage[model] !== undefined) modelUsage[model] += tokens;
            if (providerUsage[provider] !== undefined) providerUsage[provider] += tokens;
          }
        }

        formattedMessages.push({
          role: msg.role,
          contentPreview: preview,
          tokenUsage: msg.tokenUsage || null,
          individualOutputs: msg.individualOutputs || null,
        });
      }

      queryTokenReports.push({
        queryId: q._id,
        title: q.title,
        moduleType: q.moduleType,
        createdAt: q.createdAt,
        updatedAt: q.lastUpdated,
        totalTokens,
        modelTokens: perModel,
        providerTokens: perProvider,
        messages: formattedMessages,
      });
    }

    // 4️⃣ TOP-LEVEL SUMMARY
    const summary = {
      totalQueries,
      totalTokensUsed: Object.values(providerUsage).reduce((a, b) => a + b, 0),
      modelUsage,
      providerUsage,
      moduleUsage,
    };

    // 5️⃣ RECENT CONVERSATIONS (LIST ONLY)
    const recentConversations = queryList.slice(0, 20).map((q) => ({
      id: q._id,
      title: q.title,
      moduleType: q.moduleType,
      date: q.lastUpdated,
    }));

    // 6️⃣ FINAL RESPONSE
    res.json({
      user,
      summary,
      recentConversations,
      detailedQueries: queryTokenReports,
    });

  } catch (err) {
    log("ERROR", "Full user usage dashboard failed", err);
    res.status(500).json({ msg: "Failed to load user usage dashboard" });
  }
};

// ------------------- LIST PRO UPGRADE REQUESTS -------------------
exports.listProUpgradeRequests = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : {};

    const requests = await ProUpgradeRequest.find(filter)
      .populate("userId", "name email subscription")
      .sort({ createdAt: -1 });

    const data = requests.map((r) => ({
      _id: r._id,
      status: r.status,
      planName: r.planName,
      amount: r.amount,
      currency: r.currency,
      paymentMethod: r.paymentMethod,
      transactionRef: r.transactionRef,
      payerName: r.payerName,
      payerNote: r.payerNote,
      paymentScreenshotUrl: r.paymentScreenshotUrl,
      requestedAt: r.requestedAt,
      reviewedAt: r.reviewedAt,
      reviewedBy: r.reviewedBy,
      reviewNote: r.reviewNote,
      user: r.userId
        ? {
            _id: r.userId._id,
            name: r.userId.name,
            email: r.userId.email,
            subscription: r.userId.subscription,
          }
        : null,
    }));

    res.json(data);
  } catch (error) {
    log("ERROR", "Failed to fetch pro upgrade requests", {
      error: error.message,
    });
    res.status(500).json({ msg: "Failed to fetch pro upgrade requests" });
  }
};

// ------------------- REVIEW PRO UPGRADE REQUEST -------------------
exports.reviewProUpgradeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewNote, durationDays } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ msg: "action must be approve or reject" });
    }

    const request = await ProUpgradeRequest.findById(id);
    if (!request) {
      return res.status(404).json({ msg: "Upgrade request not found" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ msg: "Only pending requests can be reviewed" });
    }

    request.reviewedAt = new Date();
    request.reviewedBy = req.admin?.email || "admin";
    request.reviewNote = reviewNote || "";

    if (action === "approve") {
      const user = await User.findById(request.userId);
      if (!user) {
        return res.status(404).json({ msg: "User not found for this request" });
      }

      const now = new Date();
      const validDays = Number(durationDays) > 0 ? Number(durationDays) : 30;
      const expiry = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

      user.subscription = "Pro";
      user.subscribedAt = now;
      user.expiryDate = expiry;
      await user.save();

      request.status = "approved";
      request.approvedAt = now;
      request.expiresAt = expiry;

      await request.save();

      log("INFO", "Pro upgrade request approved", {
        requestId: request._id,
        userId: request.userId,
        reviewedBy: request.reviewedBy,
      });

      return res.json({
        msg: "Upgrade request approved and user upgraded to Pro",
        request,
      });
    }

    request.status = "rejected";
    await request.save();

    log("INFO", "Pro upgrade request rejected", {
      requestId: request._id,
      userId: request.userId,
      reviewedBy: request.reviewedBy,
    });

    res.json({ msg: "Upgrade request rejected", request });
  } catch (error) {
    log("ERROR", "Failed to review pro upgrade request", {
      error: error.message,
    });
    res.status(500).json({ msg: "Failed to review upgrade request" });
  }
};

