const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, enum: ['Trial', 'Free', 'Pro', 'Super'], default: 'Free' },
  dailyChatCount: { type: Number, default: 0 },
  dailyQueryCount: { type: Number, default: 0 },
  
  // Subscription timing fields
  subscribedAt: { type: Date },
  expiryDate: { type: Date },
  trialStartDate: { type: Date },
  trialExpiryDate: { type: Date },

  // 🆕 Forgot Password Fields
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);



