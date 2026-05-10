const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const log = require('../utils/logger');
const QueryHistory = require('../models/QueryHistory');
const Plan = require('../models/Plan');
const ProUpgradeRequest = require('../models/ProUpgradeRequest');

const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { getHistoryStartDate } = require('../utils/userAccessPolicy');

function getFrontendBaseUrl() {
  return global.SystemEnv?.FRONTEND_URL || process.env.FRONTEND_URL;
}

function getTrialDates() {
  const now = new Date();
  const expiry = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  return { now, expiry };
}

// ------------------- SIGNUP -------------------
exports.signup = async (req, res) => {
  const { name, email, password, selectedPlan } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Name, email, and password are required' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ msg: 'JWT secret not configured' });
    }

    const selectedPlanInput = String(selectedPlan || 'Free').trim().toLowerCase();
    const normalizedSelectedPlan =
      selectedPlanInput === 'trial' ? 'Trial' :
      selectedPlanInput === 'free' ? 'Free' : null;

    if (!normalizedSelectedPlan) {
      return res.status(400).json({
        msg: 'Invalid selectedPlan. Allowed values: Trial or Free.'
      });
    }

    log('INFO', `Signup attempt for email: ${email}, selectedPlan: ${normalizedSelectedPlan}`);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const userPayload = {
          name,
          email,
          password: hashedPassword,
          subscription: normalizedSelectedPlan
        };

        if (normalizedSelectedPlan === 'Trial') {
          const { now, expiry } = getTrialDates();
          userPayload.trialStartDate = now;
          userPayload.trialExpiryDate = expiry;
        }

        const user = new User(userPayload);
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        log('INFO', `Signup successful for email: ${email}`, { userId: user._id, subscription: user.subscription });

        res.json({
            token,
          role: "user",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (err) {
        log('ERROR', `Signup error for email: ${email}`, err.stack);
        res.status(500).json({ msg: 'Server error' });
    }
};

// ------------------- UNIFIED LOGIN -------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ msg: "JWT secret not configured" });
  }

  log("INFO", `Unified login attempt for: ${email}`);

  try {
    // ------------------------------------------------
    // Resolve ADMIN credentials (DB first, ENV fallback)
    // ------------------------------------------------
    const ADMIN_EMAIL =
      global.SystemEnv?.ADMIN_EMAIL || process.env.ADMIN_EMAIL;

    const ADMIN_PASSWORD =
      global.SystemEnv?.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    // ------------------------------------------
    // 1️⃣ CHECK ADMIN (Highest Priority)
    // ------------------------------------------
    if (ADMIN_EMAIL && email === ADMIN_EMAIL) {
      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        log("WARN", `Admin login failed (bad password): ${email}`);
        return res.status(401).json({ msg: "Invalid credentials" });
      }

      const token = jwt.sign(
        { email: ADMIN_EMAIL, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      log("INFO", `Admin logged in: ${ADMIN_EMAIL}`);

      return res.json({
        token,
        role: "admin",
        user: {
          email: ADMIN_EMAIL,
          name: "Super Admin",
        },
      });
    }

    // ------------------------------------------
    // 2️⃣ CHECK USER (Standard Users)
    // ------------------------------------------
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        log("WARN", `User login failed (bad password): ${email}`);
        return res.status(401).json({ msg: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      log("INFO", `User logged in: ${email}`);

      return res.json({
        token,
        role: "user",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          subscription: user.subscription,
          role: "user",
        },
      });
    }

    // ------------------------------------------
    // 3️⃣ NO MATCH FOUND
    // ------------------------------------------
    log("WARN", `Login failed (user not found): ${email}`);
    return res.status(404).json({ msg: "User not found" });

  } catch (err) {
    log("ERROR", `Login error for: ${email}`, err.stack);
    return res.status(500).json({ msg: "Server error" });
  }
};


// ------------------- GET LOGGED-IN USER -------------------
exports.getMe = async (req, res) => {
    try {
    log('INFO', `GetMe requested by user ${req.user?._id || 'unknown'}`);
        const userId = req.user._id; // populated by auth middleware
        const user = await User.findById(userId).select(
          '_id name email subscription dailyChatCount dailyQueryCount createdAt updatedAt'
        );

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
          user: {
            ...user.toObject(),
            role: 'user'
          }
        });
    } catch (err) {
        log('ERROR', 'GetMe failed', err.stack, { userId: req.user?._id });
        res.status(500).json({ msg: 'Server error' });
    }
};

// ------------------- GET LOGGED-IN USER HISTORY -------------------
exports.getHistory = async (req, res) => {
    try {
    log('INFO', `GetHistory requested by user ${req.user?._id || 'unknown'}`);
        const userId = req.user._id;
        const user = await User.findById(userId).select('subscription');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const startDate = getHistoryStartDate({
          role: 'user',
          subscription: user.subscription
        });

        let queryFilter = { userId };
        if (startDate) {
          queryFilter = {
            ...queryFilter,
            $or: [
              { createdAt: { $gte: startDate } },
              {
                createdAt: { $exists: false },
                lastUpdated: { $gte: startDate }
              }
            ]
          };
        }

        // 2. Query conversations in policy time-window
        const conversations = await QueryHistory.find(queryFilter)
            .sort({ lastUpdated: -1 })
            .select('title moduleType lastUpdated')
            .lean();

        // 3. Format the list for the Frontend Sidebar
        const formattedHistory = conversations.map((chat) => ({
            id: chat._id,               // Frontend needs ID to load the full chat later
            title: chat.title,          // "What is water?..."
            moduleType: chat.moduleType,
            date: chat.lastUpdated      // To show "2 mins ago"
        }));

        res.json({ history: formattedHistory });

    } catch (err) {
        log('ERROR', 'GetHistory failed', err.stack, { userId: req.user?._id });
        res.status(500).json({ msg: 'Failed to fetch history' });
    }
};

// ------------------- DELETE ALL HISTORY -------------------
exports.clearAllHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete all conversations belonging to this user
        const result = await QueryHistory.deleteMany({ userId });

        log('INFO', `User ${userId} cleared all history. Deleted count: ${result.deletedCount}`);

        res.json({ msg: 'History cleared successfully', deletedCount: result.deletedCount });
    } catch (err) {
        log('ERROR', 'Clear history failed', err.stack, { userId: req.user?._id });
        res.status(500).json({ msg: 'Failed to clear history' });
    }
};

// ------------------- FORGOT PASSWORD -------------------
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  log('INFO', `Forgot Password request for: ${email}`);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      log('WARN', `Forgot Password: No account found for ${email}`);
      return res.status(404).json({ msg: 'Email could not be sent' });
    }

    // 4. Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expireTime = Date.now() + 10 * 60 * 1000;

    // 5. Save Token
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = expireTime;
    await user.save();

    // 6. Send Email
    const frontendBaseUrl = getFrontendBaseUrl();
    if (!frontendBaseUrl) {
      return res.status(500).json({ msg: 'FRONTEND_URL not configured' });
    }

    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Click here: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: email, // Use the requested email
        subject: 'AiSuite Password Reset',
        message
      });
      res.json({ success: true, data: 'Email sent' });
    } catch (err) {
      // Cleanup on fail
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ msg: 'Email could not be sent' });
    }

  } catch (err) {
    log('ERROR', 'Forgot Password Error', err.stack);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ------------------- RESET PASSWORD -------------------
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // 4. Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 5. Save New Password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, msg: "Password updated successfully. You can now login." });

  } catch (err) {
    log('ERROR', 'Reset Password Error', err.stack);
    res.status(500).json({ msg: 'Server error' });
  }
};


// ------------------- MANUAL PRO UPGRADE STATUS -------------------
exports.getProUpgradeStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const proPlan = await Plan.findOne({ name: "Pro" }).lean();
    const latestRequest = await ProUpgradeRequest.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const qrCodeImageUrl =
      global.SystemEnv?.PRO_UPGRADE_QR_IMAGE_URL ||
      process.env.PRO_UPGRADE_QR_IMAGE_URL ||
      null;
    const upiId =
      global.SystemEnv?.PRO_UPGRADE_UPI_ID ||
      process.env.PRO_UPGRADE_UPI_ID ||
      "";
    const payeeName =
      global.SystemEnv?.PRO_UPGRADE_PAYEE_NAME ||
      process.env.PRO_UPGRADE_PAYEE_NAME ||
      "NexusOne";
    const paymentNote =
      global.SystemEnv?.PRO_UPGRADE_PAYMENT_NOTE ||
      process.env.PRO_UPGRADE_PAYMENT_NOTE ||
      "After payment, submit your transaction reference for manual approval.";

    res.json({
      subscription: req.user.subscription,
      proPlan: {
        name: proPlan?.name || "Pro",
        price: proPlan?.price ?? 299,
        currency: "INR",
        dailyQueryLimit: proPlan?.dailyQueryLimit ?? 0,
        features: proPlan?.features || [],
      },
      paymentInstructions: {
        qrCodeImageUrl,
        upiId,
        payeeName,
        paymentNote,
      },
      latestRequest: latestRequest
        ? {
            _id: latestRequest._id,
            status: latestRequest.status,
            transactionRef: latestRequest.transactionRef,
            payerName: latestRequest.payerName,
            payerNote: latestRequest.payerNote,
            amount: latestRequest.amount,
            requestedAt: latestRequest.requestedAt,
            reviewedAt: latestRequest.reviewedAt,
            reviewNote: latestRequest.reviewNote,
          }
        : null,
    });
  } catch (err) {
    log("ERROR", "Failed to fetch manual pro upgrade status", err);
    res.status(500).json({ msg: "Failed to fetch upgrade status" });
  }
};

// ------------------- CREATE MANUAL PRO UPGRADE REQUEST -------------------
exports.createProUpgradeRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    if (["Pro", "Super"].includes(req.user.subscription)) {
      return res.status(400).json({ msg: "You are already on a paid plan" });
    }

    const { transactionRef, payerName, payerNote, paymentScreenshotUrl } = req.body;

    if (!transactionRef || String(transactionRef).trim().length < 4) {
      return res.status(400).json({ msg: "Valid transaction reference is required" });
    }

    const existingPending = await ProUpgradeRequest.findOne({
      userId,
      status: "pending",
    });

    if (existingPending) {
      return res.status(409).json({
        msg: "You already have a pending upgrade request",
        request: existingPending,
      });
    }

    const proPlan = await Plan.findOne({ name: "Pro" }).lean();
    const amount = proPlan?.price ?? 299;

    const request = await ProUpgradeRequest.create({
      userId,
      planName: proPlan?.name || "Pro",
      amount,
      currency: "INR",
      paymentMethod: "QR",
      transactionRef: String(transactionRef).trim(),
      payerName: payerName ? String(payerName).trim() : undefined,
      payerNote: payerNote ? String(payerNote).trim() : undefined,
      paymentScreenshotUrl: paymentScreenshotUrl
        ? String(paymentScreenshotUrl).trim()
        : undefined,
      status: "pending",
      requestedAt: new Date(),
    });

    log("INFO", "Manual pro upgrade request created", {
      userId,
      requestId: request._id,
    });

    res.status(201).json({
      msg: "Upgrade request submitted. Admin will review your payment shortly.",
      request,
    });
  } catch (err) {
    log("ERROR", "Failed to create manual pro upgrade request", err);
    res.status(500).json({ msg: "Failed to submit upgrade request" });
  }
};

// ------------------- DELETE MY ACCOUNT -------------------
exports.deleteMe = async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    log('WARN', 'DeleteMe attempted without authenticated user');
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  log('INFO', `DeleteMe requested`, { userId });

  try {
    // 1️⃣ Check user exists
    const user = await User.findById(userId);
    if (!user) {
      log('WARN', 'DeleteMe failed: user not found', { userId });
      return res.status(404).json({ msg: 'User not found' });
    }

    // 🚫 Safety check (optional but recommended)
    if (user.email === process.env.ADMIN_EMAIL) {
      log('WARN', 'Attempt to delete admin account blocked', { userId });
      return res.status(403).json({ msg: 'Admin account cannot be deleted' });
    }

    // 2️⃣ Delete all chat history
    const historyResult = await QueryHistory.deleteMany({ userId });
    log('INFO', 'User chat history deleted', {
      userId,
      deletedCount: historyResult.deletedCount
    });

    // 3️⃣ Delete user account
    await User.findByIdAndDelete(userId);
    log('INFO', 'User account deleted successfully', { userId });

    // 4️⃣ Respond
    res.json({
      success: true,
      msg: 'Your account and all associated data have been permanently deleted.'
    });

  } catch (err) {
    log('ERROR', 'DeleteMe failed', err.stack, { userId });
    res.status(500).json({ msg: 'Failed to delete account' });
  }
};






