/**
 * Change the MASTER_PASSWORD to something secure
 * This password is required for:
 * - Pairing new sessions
 * - Accessing paired sessions via web
 */

module.exports = {
    // Web dashboard password - required to pair
    MASTER_PASSWORD: process.env.MASTER_PASSWORD || "BREAKER-MD-256",

    // Database - supports both Postgres and Mongo
    // Katabump will inject DATABASE_URL automatically
    DATABASE_URL: process.env.DATABASE_URL || "",

    // Also add Mongo URL support for your actual bot
    MONGODB_URL: process.env.MONGODB_URL || process.env.DATABASE_URL || "",

    // Session access code settings (don't change)
    ACCESS_CODE_LENGTH: 6,
    ACCESS_CODE_EXPIRY: 5 * 60 * 1000,

    // Server port (auto-set by hosting platform)
    PORT: process.env.PORT || 3000,

    // Your Github username (must have forked repo)
    GITHUB_USERNAME: process.env.GITHUB_USERNAME || "matsken256-boop",

    // --- BREAKER-ULTRA-MD CUSTOM SETTINGS ---
    botName: "BREAKER-ULTRA-MD",
    ownerName: "Matsken",
    ownerNumber: "256769724124",
    prefix: ".",
    botLogo: "./logo.jpg",
    thumb: "./logo.jpg",

    mess: {
        owner: "*Owner Only Command!*",
        group: "*Group Only!*",
        admin: "*Admin Only!*",
        botAdmin: "*Make me admin first!*",
        done: "✅ Done!",
        wait: "⏳ Processing..."
    }
};
