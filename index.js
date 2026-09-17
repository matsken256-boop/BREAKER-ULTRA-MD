const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('MatsKen Bot is Running - Server Online ✅');
});

app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});

const sessionsDir = path.join(__dirname, 'sessions');
const pluginsDir = path.join(__dirname, 'plugins');

global.plugins = [];

function loadPlugins() {
  global.plugins = [];
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
    return;
  }
  const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
  for (let file of files) {
    try {
      delete require.cache[require.resolve(path.join(pluginsDir, file))];
      const plugin = require(path.join(pluginsDir, file));
      global.plugins.push(plugin);
    } catch (e) {
      console.log('Failed to load plugin ' + file + ':', e);
    }
  }
  console.log('Loaded ' + global.plugins.length + ' plugins');
}
loadPlugins();

async function startBot(sessionName) {
  const sessionPath = path.join(sessionsDir, sessionName);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['MatsKen Bot', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Connection closed, reconnecting: ' + shouldReconnect);
      if (shouldReconnect) {
        startBot(sessionName);
      }
    } else if (connection === 'open') {
      console.log('Bot connected: ' + sessionName);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
    if (!text) return;

    const prefix = '.';
    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    m.chat = m.key.remoteJid;

    for (let plugin of global.plugins) {
      let names = [];
      if (plugin.name) {
        names = [plugin.name.toLowerCase(),...(plugin.alias || []).map(a => a.toLowerCase())];
      } else if (plugin.command) {
        names = plugin.command.map(c => c.toLowerCase());
      }

      if (names.includes(cmdName)) {
        try {
          if (plugin.run) await plugin.run(sock, m, { prefix, body: text, args });
          else if (plugin.handler) await plugin.handler(m, { sock, prefix, args });
        } catch (e) {
          console.log('Error in ' + cmdName + ':', e);
        }
      }
    }
  });

  return sock;
}

async function loadAllSessions() {
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const folders = fs.readdirSync(sessionsDir);

  if (folders.length === 0) {
    console.log('No sessions found, waiting for new session...');
    // Keep process alive even with no sessions
    return;
  }

  for (let num of folders) {
    const fullPath = path.join(sessionsDir, num);
    if (fs.lstatSync(fullPath).isDirectory()) {
      console.log('Starting bot: ' + num);
      await startBot(num);
      await delay(1500);
    }
  }
}

loadAllSessions();

// Keep process alive
process.on('uncaughtException', (e) => {
  console.log('Uncaught:', e);
});

console.log('MatsKen Bot Starting...');
