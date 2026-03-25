// ============================================================
//  config.js  —  Load configuration from environment variables
//  Create a .env file in the root directory with your secrets
// ============================================================

module.exports = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL:   process.env.OPENAI_MODEL || "gpt-4o-mini",
  PORT:           process.env.PORT || 3001,
};
