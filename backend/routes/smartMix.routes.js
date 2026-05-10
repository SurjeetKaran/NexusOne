const express = require("express");
const router = express.Router();

const {
	processSmartMix,
	terminateSmartMix,
	getConversationById,
	deleteConversationById,
	persistPartialAssistantOutput
} = require("../controllers/smartMix.controller");
const { verifyToken } = require("../middleware/authMiddleware");
const smartMixGuard = require("../middleware/smartMix.guard");

router.post("/process", verifyToken, smartMixGuard, processSmartMix);
router.post("/terminate", verifyToken, terminateSmartMix);
router.post("/persist-partial", verifyToken, persistPartialAssistantOutput);
router.get("/history/:id", verifyToken, getConversationById);
router.delete("/history/:id", verifyToken, deleteConversationById);

module.exports = router;
