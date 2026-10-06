/**
 * BREAKER-ULTRA-MD - MULTI-SESSION
 * Developer: Matsken
 * Version: 2.7.0 BOX LOCKED
 */

module.exports = {
  BOT_NAME: "BREAKER-ULTRA-MD",
  BOT_VERSION: "2.7.0",
  SESSION_FOLDER: "./Sessions/breaker",

  MASTER_PASSWORD: process.env.MASTER_PASSWORD || "Breaker",
  DATABASE_URL: process.env.DATABASE_URL || "",
  MONGODB_URL: process.env.MONGODB_URL || process.env.DATABASE_URL || "",
  PORT: process.env.PORT || 3000,
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || "matsken256-boop",

  ACCESS_CODE_LENGTH: 6,
  ACCESS_CODE_EXPIRY: 5 * 60 * 1000,

  MULTI_SESSION: {
    enabled: true,
    allowPairForOthers: true,
    maxSessions: 10,
    sessionFolder: "./Sessions/breaker",
    autoClearInactive: false
  },

  botName: "BREAKER-ULTRA-MD",
  botVersion: "2.7.0",
  ownerName: "Matsken",
  ownerNumber: "256769724124",
  prefix: ".",
  mode: "public"
}