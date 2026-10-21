module.exports = {
  // === BOT INFO ===
  botName: "BREAKER-ULTRA MD",
  ownerName: "BREAKER",
  ownerNumber: ["2567XXXXXXXX"], // <--- PUT YOUR NUMBER HERE e.g 256765123456
  
  // === SETTINGS - THIS FIXES NO-REPLY ===
  prefix: [".", "!", "/"], // bot will now reply to .menu !menu /menu
  mode: "public", // <--- IMPORTANT: public = everyone can use, private = only you
  public: true,
  pmblock: false,

  // === API KEYS - KEPT YOURS ===
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

global.MEGAN_APIKEY = "megan_fc148d34fe9b3a2";
global.MEGAN_BASE = "https://megan-api.vercel.app";
