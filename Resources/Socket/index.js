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

// === REAL BOT SOCKET START ===
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

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ BOT CONNECTED & ONLINE');
        }
    });

    // THIS IS WHAT WAS MISSING - LISTEN FOR MESSAGES
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;
            if (msg.key.remoteJid === 'status@broadcast') return;
            
            // Call your main handler
            const mainsPath = path.join(__dirname, '../functions/mains.js');
            if (fs.existsSync(mainsPath)) {
                const mains = require(mainsPath);
                // Support both function export and default export
                if (typeof mains === 'function') {
                    await mains(sock, msg);
                } else if (mains.mains || mains.default) {
                    await (mains.mains || mains.default)(sock, msg);
                }
            } else {
                console.log("⚠️ mains.js not found at:", mainsPath);
            }
        } catch (err) {
            console.log("Message Error:", err.message);
        }
    });

    return sock;
}

module.exports = { startBot };

if (require.main === module) {
    startBot();
  }
