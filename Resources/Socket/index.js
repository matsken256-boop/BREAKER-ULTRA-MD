const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const axios = require('axios');

// ===== YOUR MEGAN KEY - FIXED HERE IN RESOURCES =====
const MEGAN_APIKEY = "megan_f6ef183d3b34ffee32a022e038f91847";
const MEGAN_BASE = "https://api.megan.my.id"; // Change if your Megan has different base URL

global.MEGAN_KEY = MEGAN_APIKEY;
global.MEGAN_BASE = MEGAN_BASE;

// Global AI function that uses YOUR MEGAN KEY
global.MEGAN_AI = async (prompt) => {
  try {
    // Try Megan API first with your key
    const { data } = await axios.get(`${MEGAN_BASE}/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${MEGAN_APIKEY}`, { timeout: 30000 });
    return data.data || data.result || data.answer || data.message;
  } catch (e) {
    // Fallback to Siputzx if Megan fails
    console.log("Megan failed, using fallback:", e.message);
    const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`, { timeout: 20000 });
    return data.data || data.result || "No answer";
  }
};

global.MEGAN_IMG = (prompt) => {
  return `${MEGAN_BASE}/api/ai/flux?prompt=${encodeURIComponent(prompt)}&apikey=${MEGAN_APIKEY}`;
};

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P().child({ level: "fatal" })),
    },
    logger: P({ level: "silent" }),
    browser: ["BREAKER-ULTRA-MD", "Chrome", "1.0.0"],
  });

  global.sock = sock;
  console.log("✅ BREAKER v2.7.0 - MEGAN KEY LOADED IN resources/socket/index.js");

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ BREAKER Connected - MEGAN AI Ready!');
    }
  });

  // Load handler - your old handler file