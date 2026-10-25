module.exports = {
  // === BOT INFO ===
  botName: "BREAKER-ULTRA MD",
  ownerName: "Matsken",
  ownerNumber: ["256760000000"], // Replace with real number OR keep but welcome will go to self
  // If you want fully public with no number, leave as is, bot will send welcome to self

  // === SETTINGS - FIXED FOR YOUR STRUCTURE ===
  prefix: ".", // MUST be string for your mains.js, not array. Your bot will reply to .menu
  prefixes: [".", "!", "/"], // extra prefixes if you want ! and / also work
  mode: "public",
  public: true,
  pmblock: false,

  // === API KEYS - YOURS KEPT ===
  apis: {
    megan: "https://megan-api.vercel.app"
  },
  apikeys: {
    megan: "megan_fc148d34fe9b3a2"
  },

  // === OTHER NEEDED ===
  sessionName: "session",
  author: "BREAKER-ULTRA MD",
  packname: "BREAKER",
  warnCount: 3,
  autoRead: false,
  autoStatusView: false,
};

// SAFE GLOBAL - won't crash if config fails
try {
  global.MEGAN_APIKEY = module.exports.apikeys.megan || "megan_fc148d34fe9b3a2";
  global.MEGAN_BASE = module.exports.apis.megan || "https://megan-api.vercel.app";
} catch {}