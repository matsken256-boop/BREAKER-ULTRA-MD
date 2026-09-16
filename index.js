const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const settings = require('./settings');

const app = express();
const PORT = process.env.PORT || settings.PORT || 3000;
global.activeBots = {};
global.plugins = [];

app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
  https.get('https://api.ipify.org', (res) => {
    let ip = '';
    res.on('data', d => ip += d);
    res.on('end', () => {
      console.log(`\n ⚡ BREAKER-ULTRA MD WEB LOGIN ⚡`);
      console.log(` 🔗 Web Link: http://${ip.trim()}:${PORT} \n`);
    });
  }).on('error', () => {
      console.log(`\n ⚡ BREAKER-ULTRA MD WEB LOGIN ⚡`);
      console.log(` 🔗 Web Link: http://0.0.0.0:${PORT} \n`);
  });
});

// LOAD PLUGINS FROM resources/Plugins
const pluginsPath = path.join(__dirname, 'resources', 'Plugins');
if (fs.existsSync(pluginsPath)) {
  fs.readdirSync(pluginsPath).forEach(file => {
    if (file.endsWith('.js')) {
      try {
        const plugin = require(path.join(pluginsPath, file));
        global.plugins.push(plugin);
      } catch (e) { console.log(`Failed plugin ${file}:`, e.message); }
    }
  });
  console.log(`✅ Loaded ${global.plugins.length} plugins`);
}

async function startBot(number) {
  const sessionPath = path.join(__dirname, 'sessions', number);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['BREAKER-ULTRA', 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log(`✅ Connected: ${number}`);
      global.activeBots[number] = sock;

      // YOUR WELCOME MESSAGE - ONLY SENDS TO BOT ITSELF (PRIVATE CHAT)
      try {
        await sock.sendMessage(sock.user.id, { text: `⚡BREAKER -ULTRA MD ⚡ CONNECTED ✅ AND IS ACTIVE🟢` });
      } catch {}

    }
    if (connection === 'close') {
      delete global.activeBots[number];
      setTimeout(() => startBot(number), 3000);
    }
  });

  // UNIVERSAL PLUGIN HANDLER
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    if (m.key.fromMe) return;

    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    const prefix = ".";
    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    m.chat = m.key.remoteJid;

    for (let plugin of global.plugins) {
      let names = [];
      if (plugin.name) names = [plugin.name.toLowerCase(),...(plugin.alias || []).map(a => a.toLowerCase())];
      else if (plugin.command) names = plugin.command.map(c => c.toLowerCase());

      if (names.includes(cmdName)) {
        try {
          if (plugin.run) await plugin.run(sock, m, { prefix, botname: "BREAKER-ULTRA MD", args });
          else if (plugin.handler) await plugin.handler(m, { conn: sock, args, prefix });
        } catch (e) {
          console.log(`Error in ${cmdName}:`, e);
        }
      }
    }
  });

  return sock;
}

async function loadAllSessions() {
  const sessionsDir = path.join(__dirname, 'sessions');
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const folders = fs.readdirSync(sessionsDir);
  for (let num of folders) {
    if (fs.lstatSync(path.join(sessionsDir, num)).isDirectory()) {
      await startBot(num);
      await delay(1000);
    }
  }
}
loadAllSessions();

module.exports = { startBot };
