const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('BREAKER-ULTRA-MD PAIRING READY'));

async function initBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  sock.ev.on('creds.update', saveCreds);

  // PAIRING CODE LOGIC
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER || "255xxxxxxxxx"; // PUT YOUR NUMBER HERE 255...
    await delay(3000);
    try {
      const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
      console.log(`\n\n========================\nYOUR PAIRING CODE: ${code}\n========================\n\nGo to WhatsApp > Linked Devices > Link with phone number > Enter this code\n`);
      app.get('/pair', (req, res) => res.send(`<h1>YOUR PAIRING CODE: ${code}</h1><p>Go to WhatsApp > Linked Devices > Link a device > Link with phone number instead > Enter this code</p>`));
    } catch (e) {
      console.log("Failed to get pairing code, check PHONE_NUMBER", e.message);
    }
  }

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'open') {
      console.log('✅ BOT CONNECTED TO WHATSAPP!');
      try {
        await delay(2000);
        await sock.sendMessage(sock.user.id, { text: "BOT CONNECTED ✅\n\n⚡ BREAKER-ULTRA-MD IS ONLINE ⚡" });
      } catch {}
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) initBot();
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
    for (const file of fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'))) {
      try {
        const fp = path.join(pluginsPath, file);
        delete require.cache[require.resolve(fp)];
        const plugin = require(fp);
        if (plugin.command && plugin.command.includes(cmdName)) await plugin.handler(msg, { conn: sock, args, text });
      } catch {}
    }
  });
}

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
initBot();
