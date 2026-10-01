/*
   ╔════════════════════════════════════╗
   ║  BREAKER-ULTRA-MD - MULTI-SESSION ║
   ║  Developer: Matsken      ║
   ╚════════════════════════════════════╝
*/

module.exports = {

    //━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  KATABUMP CORE - DO NOT TOUCH
    //━━━━━━━━━━━━━━━━━━━━━━━━━━━
    MASTER_PASSWORD: process.env.MASTER_PASSWORD || "Breaker",
    DATABASE_URL: process.env.DATABASE_URL || "",
    MONGODB_URL: process.env.MONGODB_URL || process.env.DATABASE_URL || "",
    
    PORT: process.env.PORT || 3000,
    GITHUB_USERNAME: process.env.GITHUB_USERNAME || "matsken256-boop",

    // Session Code Settings
    ACCESS_CODE_LENGTH: 6,
    ACCESS_CODE_EXPIRY: 5 * 60 * 1000,

    //━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  MULTI-SESSION SYSTEM
    //━━━━━━━━━━━━━━━━━━━━━━━━━━━
    MULTI_SESSION: {
        enabled: true,
        allowPairForOthers: true,  // 
        maxSessions: 10,           // unlimited users
        sessionFolder: "./auth",   // where sessions save
        autoClearInactive: false
    },

    //━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  BREAKER BOT SETTINGS
    //━━━━━━━━━━━━━━━━━━━━━━━━━━━
    botName: "BREAKER-ULTRA-MD",
    botVersion: "2.7.0",
    ownerName: "Matsken",
    
    // Main Owner - Bot creator
    ownerNumber: "256769724124",
    ownerNumbers: ["256769724124"], //

    // Bot Behaviour
    prefix: ".",
    mode: "public", // public | private | self
    autoReact: true,
    autoRead: false,
    autoStatusSeen: true,
    autoBio: false,

    // Media
    botLogo: "./logo.jpg",
    thumb: "./logo.jpg",
    packName: "BREAKER-ULTRA-MD",
    author: "Matsken",

    // Messages
    mess: {
        owner: "*_Owner only! This is for my owner!_*",
        group: "*_Group only!_*",
        admin: "*_Admin only!_*",
        botAdmin: "*_Make me admin first!_*",
        done: "✅ *Done!*",
        wait: "⏳ *BREAKER is processing...*",
        sessionLimit: "*_Session limit reached!_*"
    }
};
