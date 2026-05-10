// routes/admin.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const apiKeyController = require("../controllers/apiKeyController");
const systemConfigController = require("../controllers/systemConfigController");
const APIKey = require("../models/APIKey");
const { SINGLE_API } = require("../constants/smartMix");

const { 
  verifyAdminToken,
  verifyOwnerAdminOnly 
} = require("../middleware/authMiddleware");

const log = require("../utils/logger");

// Admin-only guard middleware
const adminOnly = (req, res, next) => {
  if (!req.admin) {
    log("WARN", "Unauthorized access attempt to admin route");
    return res.status(403).json({ msg: "Admin access only" });
  }
  next();
};

// Public routes
router.get("/plan", (req, res, next) => {
  log("INFO", "Public route accessed: GET /plan");
  next();
}, adminController.getPlans);

// Dashboard
router.get(
  "/dashboard",
  verifyAdminToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: GET /dashboard by ${req.admin.email}`);
    next();
  },
  adminController.getAdminDashboard
);

// Update user plan
router.patch(
  "/user/:id",
  verifyAdminToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: PATCH /user/${req.params.id} by ${req.admin.email}`);
    next();
  },
  adminController.updateUserPlan
);

// Pro upgrade requests (manual payment review)
router.get(
  "/pro-upgrade-requests",
  verifyAdminToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: GET /pro-upgrade-requests by ${req.admin.email}`);
    next();
  },
  adminController.listProUpgradeRequests
);

router.patch(
  "/pro-upgrade-requests/:id/review",
  verifyAdminToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: PATCH /pro-upgrade-requests/${req.params.id}/review by ${req.admin.email}`);
    next();
  },
  adminController.reviewProUpgradeRequest
);

// Plan management
router.post(
  "/plan",
  verifyAdminToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: POST /plan by ${req.admin.email}`);
    next();
  },
  adminController.createPlan
);

router.delete(
  "/plan/:id",
  verifyAdminToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: DELETE /plan/${req.params.id} by ${req.admin.email}`);
    next();
  },
  adminController.deletePlan
);

router.patch(
  "/plan/:id",
  verifyAdminToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: PATCH /plan/${req.params.id} by ${req.admin.email}`);
    next();
  },
  adminController.updatePlan
);

// API Key management (owner only)
router.get(
  "/api-keys",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: GET /api-keys`);
    next();
  },
  apiKeyController.getAllKeys
);

router.post(
  "/api-keys",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: POST /api-keys`);
    next();
  },
  apiKeyController.createKey
);

router.put(
  "/api-keys/:id",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: PUT /api-keys/${req.params.id}`);
    next();
  },
  apiKeyController.updateKey
);

router.delete(
  "/api-keys/:id",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: DELETE /api-keys/${req.params.id}`);
    next();
  },
  apiKeyController.deleteKey
);

router.patch(
  "/api-keys/:id/toggle",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: PATCH /api-keys/${req.params.id}/toggle`);
    next();
  },
  apiKeyController.toggleStatus
);

router.get(
  "/user-full-usage/:userId",
  verifyOwnerAdminOnly,
  adminController.getFullUserUsageDashboard
);

// ---------------------------
// Provider Registry (owner only)
// ---------------------------
router.get(
  "/providers",
  verifyOwnerAdminOnly,
  async (req, res) => {
    try {
      const keyCount = await APIKey.countDocuments({
        isActive: true,
        provider: SINGLE_API.PROVIDER
      });

      const providers = [{
        name: SINGLE_API.PROVIDER,
        isActive: true,
        keyCount
      }];

      log("INFO", "Providers resolved from API keys", { providers });

      res.json(providers);
    } catch (err) {
      log("ERROR", "Failed to fetch providers from API keys", {
        error: err.message
      });
      res.status(500).json({ msg: "Failed to fetch providers" });
    }
  }
);





// ---------------------------
// System Config (dynamic .env) - owner only
// ---------------------------
router.get(
  "/system-config",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: GET /system-config`);
    next();
  },
  systemConfigController.getSystemConfig
);

router.post(
  "/system-config",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: POST /system-config`);
    next();
  },
  systemConfigController.saveSystemConfig
);

router.delete(
  "/system-config/:key",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: DELETE /system-config/${req.params.key}`);
    next();
  },
  systemConfigController.deleteSystemConfig
);

router.get(
  "/system/models",
  systemConfigController.getAvailableModels
);


// Export router
module.exports = router;
