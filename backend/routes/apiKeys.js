const express = require("express");
const router = express.Router();

const apiKeyController = require("../controllers/apiKeyController");
const { verifyOwnerAdminOnly } = require("../middleware/authMiddleware");

router.get("/", verifyOwnerAdminOnly, apiKeyController.getAllKeys);
router.post("/", verifyOwnerAdminOnly, apiKeyController.createKey);
router.put("/:id", verifyOwnerAdminOnly, apiKeyController.updateKey);
router.delete("/:id", verifyOwnerAdminOnly, apiKeyController.deleteKey);
router.patch("/:id/toggle", verifyOwnerAdminOnly, apiKeyController.toggleStatus);


module.exports = router;
