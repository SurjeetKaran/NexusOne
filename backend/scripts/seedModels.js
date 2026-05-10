/**
 * seedModels.js
 * Run once to seed the AVAILABLE_MODELS system config in the DB.
 *
 * Usage:
 *   node scripts/seedModels.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const SystemConfig = require("../models/SystemConfig");

const MODELS = [
  { id: "nexusone",  name: "NexusAI"  },
  { id: "chatgpt",   name: "ChatGPT"  },
  { id: "gemini",    name: "Gemini"   },
  { id: "claude",    name: "Claude"   },
  { id: "deepseek",  name: "DeepSeek" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await SystemConfig.findOne({ key: "AVAILABLE_MODELS" });

  if (existing) {
    console.log("AVAILABLE_MODELS already exists:", existing.value);
    console.log("Overwriting with default 5 models...");
  }

  await SystemConfig.findOneAndUpdate(
    { key: "AVAILABLE_MODELS" },
    { value: MODELS },
    { upsert: true, new: true }
  );

  console.log("✅ AVAILABLE_MODELS seeded:", MODELS.map(m => m.name).join(", "));
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
