/*
╔════════════════════════════════════╗
║  BREAKER-ULTRA-MD - MULTI-SESSION ║
║  Developer: Matsken              ║
║  Version: 2.7.0 BOX LOCKED       ║
╚════════════════════════════════════╝
*/

module.exports = {
  // COMPAT KEYS FOR NEW INDEX.JS - ROOT LOCKED
  BOT_NAME: "BREAKER-ULTRA-MD",
  BOT_VERSION: "2.7.0",
  SESSION_FOLDER: "./Sessions/breaker",

  // ────────────────────────────────
  // KATABUMP CORE - DO NOT TOUCH
  // ────────────────────────────────
  MASTER_PASSWORD: process.env.MASTER_PASSWORD || "Breaker",
  DATABASE_URL: process.env.DATABASE_URL || "",
  MONGODB_URL: process.env.MONGODB_URL || process.env.DATABASE_URL || "",

  PORT: process.env.PORT || 3000,
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || "matsken256-boop",

  // Session Code Settings
  ACCESS_CODE_LENGTH: 6,
  ACCESS_CODE_EXPIRY: 5 * 60 * 1000,

  // ────────────────────────────────
  // MULTI-SESSION SYSTEM - FIXED
  // ────────────────────────────────
  MULTI_SESSION: {
    enabled: true,
    allowPairForOthers: true, // unlimited users
    maxSessions: 10,
    sessionFolder: "./Sessions/breaker", // FIXED from ./auth
    autoClearInactive: false
  },

  // ────────────────────────────────
  // BREAKER BOT SETTINGS
  // ────────────────────────────────
  botName: "BREAKER-ULTRA-MD",
  botVersion: "2.7.0",
  ownerName: "Matsken",

  // Main Owner - Bot creator
  ownerNumber