/**
 * Script to add GROQ API key to database
 * Usage: node scripts/addGroqKey.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const APIKey = require("../models/APIKey");
const { encrypt } = require("../utils/keyEncryptor");

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE";

async function addGroqKey() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not configured in .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Check if GROQ key already exists
    const existing = await APIKey.findOne({ provider: "groq" });
    if (existing) {
      console.log("⚠ GROQ API key already exists in database");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Encrypt the key
    const encryptedKey = encrypt(GROQ_API_KEY);

    // Create new API key record
    const newKey = new APIKey({
      provider: "groq",
      label: "Primary GROQ Key",
      key: encryptedKey,
      encrypted: true,
      weight: 1,
      isActive: true,
      dailyLimit: 10000,
      dailyTokenLimit: 1000000,
      modelNames: ["mixtral-8x7b-32768", "gemma-7b-it", "llama2-70b-4096"]
    });

    await newKey.save();
    console.log("✓ GROQ API key added successfully!");
    console.log(`  Provider: ${newKey.provider}`);
    console.log(`  Label: ${newKey.label}`);
    console.log(`  Encrypted: ${newKey.encrypted}`);
    console.log(`  Status: Active`);

    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  } catch (error) {
    console.error("✗ Error adding GROQ key:", error.message);
    process.exit(1);
  }
}

addGroqKey();
