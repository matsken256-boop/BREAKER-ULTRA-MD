const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

// === UNIFIED API KEY - MUST MATCH Utils/config.js ===
const MEGAN_APIKEY = "megan_fc148d34fe9b3a2";
const MEGAN_BASE = "https://megan-api.vercel.app";

global.MEGAN_KEY = MEGAN_APIKEY;
global.MEGAN_APIKEY = MEGAN_APIKEY;
global.MEGAN_BASE = MEGAN_BASE;
global.MEGAN_API = MEGAN_BASE;

// === AI TEXT - FIXED NOT TO CRASH BOT ===
global.MEGAN_AI = async (prompt) => {
  try {
    const res = await axios.get(`${MEGAN_BASE}/api/ai`, {
      params: { prompt: prompt, key: MEGAN_APIKEY },
      timeout: 15000
    });
    return res.data?.result || res.data?.response || res.data?.answer || res.data?.data || "No response";
  } catch (e) {
    console.log("MEGAN AI Error:", e.message);
    return "❌ AI Offline, try again later";
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
    console.log("MEGAN IMG Error:", e.message);
    return null;
  }
};

global.MEGAN_TMR = async (prompt) => {
  return await global.MEGAN_AI(prompt);
};

console.log("✅ MEGAN API LOADED:", MEGAN_BASE);

// Load config for fallback
let config = {}
try { config = require('../../settings') } catch { try { config = require('../../settings.js') } catch { config = {} } }
config.prefix = config.prefix || '.'
config.ownerName = config.ownerName || 'Matsken'
config.ownerNumber = config.ownerNumber || ['256766800757']
config.version = config.version || '2.7.0'

async function startBot() {
    const sessionPath = path.join(__dirname, '../../session');
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        browser: Browsers.ubuntu("Chrome"),
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        markOnlineOnConnect: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update