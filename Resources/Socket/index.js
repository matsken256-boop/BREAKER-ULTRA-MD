const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const P = require('pino');
const fs = require('fs');

async function start() {
  const sessionPath = path.join(__dirname, '..', 'Sessions');

  // Find first session folder inside Sessions
  let authFolder = sessionPath;
  if (fs.existsSync(sessionPath)) {
    const folders = fs.readdirSync(sessionPath).filter(f => fs.statSync(path.join(sessionPath, f)).isDirectory());
    if (folders.length > 0) {
      authFolder = path.join(sessionPath, folders[0]);
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['BREAKER-ULTRA-MD', 'Chrome', '2.7.0']
  });

  sock.ev.on('creds.update', saveCreds);

  // Load Events
  try {
    const eventsPath = path.join(__dirname, '..', 'Events', 'message.js');
    if (fs.existsSync(eventsPath)) {
      require(eventsPath)(sock);
    }
  } catch (e) {
    console.log('Events load error:', e);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Connection closed, reconnect:', shouldReconnect);
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('┌─⊷ ◇ BREAKER CONNECTED ◇\n│ ✅ Breaker-Ultra v2.7.0 Online\n│ 🌟 100% Breaker Branded\n└─⊷');
    }
  });
}

start();
module.exports = start;