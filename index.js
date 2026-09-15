const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('BREAKER-ULTRA-MD IS LIVE'));

let sentWelcome = false;

async function initBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'open') {
      console.log('✅ CONNECTED!');
      if (!sentWelcome) {
        try {
          await delay(3000);
          await sock.sendMessage(sock.user.id, { text: "BOT CONNECTED ✅ SUCCESSFULLY ✅\n\n⚡ BREAKER-ULTRA-MD IS NOW ONLINE ⚡" });
        } catch (e) {}
        sentWelcome = true;
      }
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(initBot, 3000);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (!text.startsWith('.')) return;
    const args = text.slice(1).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const pluginsPath = path.join(__dirname, 'resources', 'Plugins');
    if (!fs.existsSync(pluginsPath)) return;
    const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const fp = path.join(pluginsPath, file);
        delete require.cache[require.resolve(fp)];
        const plugin = require(fp);
        if (plugin.command && plugin.command.includes(cmdName)) {
          await plugin.handler(msg, { conn: sock, args, text });
        }
      } catch (e) {}
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${PORT}`);
});
initBot();
