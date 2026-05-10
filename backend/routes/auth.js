const express = require('express');
const {
    signup,
    login,
    getMe,
    getHistory,
    getProUpgradeStatus,
    createProUpgradeRequest,
    clearAllHistory,
    forgotPassword, // 🆕 Import
    resetPassword,
    deleteMe   // 🆕 Import
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware'); // import middleware
const router = express.Router();

// ------------------- AUTH ROUTES -------------------
router.post('/signup', signup);
router.post('/login', login);

// 🆕 Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// ✅ Protected routes
router.get('/getme', verifyToken, getMe);
router.get('/getHistory', verifyToken, getHistory);
router.delete('/history/clear', verifyToken, clearAllHistory);
router.delete('/delete-me', verifyToken, deleteMe);


// ------------------- MANUAL PRO UPGRADE -------------------
router.get('/pro-upgrade/status', verifyToken, getProUpgradeStatus);
router.post('/pro-upgrade/request', verifyToken, createProUpgradeRequest);

module.exports = router;

