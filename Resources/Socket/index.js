const { default: makeASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');

global.RENZ_APIKEY =r_3875b2315c35b921ef87da32 "YOUR_RENZ_APIKEY_HERE";
// Example: global.RENZ_APIKEY = "renz_xxxxxxxxxxxx";
// Get your key from: https://api.renz.my.id
// ====================================================

async function startBot(sessionId) {
  if (!sessionId) sessionId = (process.env.OWNER_NUMBER || "BREAKER-ULTRA").replace(/[^0-9]/g, "");
  
  const sessionPath = path.join(__dirname, '..', '..', 'Sessions', sessionId);
  
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
  
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  
  const sock = makeASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
    },
    browser: ['BREAKER-ULTRA MD', 'Chrome', '1.0.0']
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(sessionId.replace(/[^0-9]/g, ''));
        console.log(`\nPAIR CODE for ${sessionId}: ${code}\n`);
      } catch (e) { 
        console.log(`Pair error: ${e.message}`); 
      }
    }, 3000);
  }