const mongoose = require("mongoose");

const proUpgradeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planName: {
      type: String,
      default: "Pro",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentMethod: {
      type: String,
      default: "QR",
    },
    transactionRef: {
      type: String,
      required: true,
      trim: true,
    },
    payerName: {
      type: String,
      trim: true,
    },
    payerNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    paymentScreenshotUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "canceled"],
      default: "pending",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: String,
    reviewNote: String,
    approvedAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

proUpgradeRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ProUpgradeRequest", proUpgradeRequestSchema);