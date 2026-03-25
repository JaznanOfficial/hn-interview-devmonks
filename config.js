// ============================================================
//  config.js  —  Load configuration from environment variables
//  Create a .env file in the root directory with your secrets
// ============================================================

module.exports = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "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",
  OPENAI_MODEL:   process.env.OPENAI_MODEL || "gpt-4o-mini",
  PORT:           process.env.PORT || 3001,
};
