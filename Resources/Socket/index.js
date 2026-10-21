const { default: makeWASocket } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// === UNIFIED API KEY - MUST MATCH Utils/config.js ===
const MEGAN_APIKEY = "megan_fc148d34fe9b3a2";
const MEGAN_BASE = "https://megan-api.vercel.app";

global.MEGAN_KEY = MEGAN_APIKEY;
global.MEGAN_APIKEY = MEGAN_APIKEY;
global.MEGAN_BASE = MEGAN_BASE;
global.MEGAN_API = MEGAN_BASE;

// === AI TEXT ===
global.MEGAN_AI = async (prompt) => {
  try {
    const res = await axios.get(`${MEGAN_BASE}/api/ai`, {
      params: { prompt: prompt, key: MEGAN_APIKEY },
      timeout: 15000
    });
    return res.data?.result || res.data?.response || res.data?.answer || res.data?.data || "No response";
  } catch (e) {
    try {
      // Fallback to zenith free API
      const fallback = await axios.get(`https://api.zenith.org/api/ai?text=${encodeURIComponent(prompt)}`, { timeout: 10000 });
      return fallback.data?.result || fallback.data?.response || "AI Error";
    } catch (e2) {
      return `❌ AI Offline: ${e.message}`;
    }
  }
};

// === AI IMAGE ===
global.MEGAN_IMG = async (prompt) => {
  try {
    const res = await axios.get(`${MEGAN_BASE}/api/image`, {
      params: { prompt: prompt, key: MEGAN_APIKEY },
      timeout: 30000
    });
    return res.data?.result || res.data?.url || res.data?.image;
  } catch (e) {
    return null;
  }
};

// Keep other globals your bot expects
global.MEGAN_TMR = async (prompt) => {
  return await global.MEGAN_AI(prompt);
};

console.log("✅ MEGAN API LOADED:", MEGAN_BASE, "KEY:", MEGAN_APIKEY.slice(0,10)+"...");