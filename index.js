const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const HOST = '0.0.0.0';
app.use(express.json());

// AUTO DETECT IP - Works on any host
async function getPublicIP() {
  try {
    // Try to get from environment (Katabump, Pterodactyl)
    if (process.env.SERVER_IP) return process.env.SERVER_IP;
    if (process.env.PUBLIC_IP) return process.env.PUBLIC_IP;
    if (process.env.ALLOC_IP) return process.env.ALLOC_IP;

    // Try network interfaces
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' &&!net.internal) {
          if (net.address!== '127.0.0.1') return net.address;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

app.get('/', async (req, res) => {
  // Best method: use the host from the request itself - 100% auto
  const host = req.get('host'); // This auto-detects the real public link
  const protocol = req.protocol;
  const fullLink = `${protocol}://${host}`;

  res.send(`
    <html><head><title>BREAKER-ULTRA MD</title><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>body{font-family:Arial;background:#0f172a;color:white;text-align:center;padding:30px}
  .box{background:#1e293b;padding:25px;border-radius:15px;max-width:400px;margin:auto}
  .link{background:black;padding:12px;border-radius:8px;margin:15px 0;word-break:break-all;color:#25D366}
   input{padding:12px;width:80%;border-radius:8px;border:none;margin:10px}
   button{padding:12px 25px;background:#25D366;color:white;border:none;border-radius:8px;font-weight:bold}</style></head>
    <body><div class="box">
    <h2>⚡ BREAKER-ULTRA MD ⚡</h2>
    <p>Web Login Active</p>
    <div class="link">${fullLink}</div>
    <p style="font-size:11px;opacity:0.6">Auto-detected link - works on any deployment</p>
    <form action="/pair" method="get"><input name="number" placeholder="2567XXXXXXXX" required><br><button>Get Pairing Code</button></form>
    </div></body></html>
  `);
});
app.get('/pair', async (req, res) => {
  let num = req.query.number?.replace(/[^0-9]/g, '');
  if (!num) return res.send('Add?number=2567XXXXXX');
  const sessionPath = path.join(__dirname, 'sessions', num);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');

    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
      await new Promise(r => setTimeout(r, 2000));
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      res.send(`<html><body style='background:#0f172a;color:white;text-align:center'>${code}</body></html>`);
    } else {
      res.send('Already paired!');
    }
  } catch (e) {
    res.send('Error: ' + e.message);
  }
});
app.listen(PORT, HOST, async () => {
  const ip = await getPublicIP();
  const displayIp = ip || 'YOUR-SERVER-IP';

  console.log(`✅Loaded ${global.plugins? global.plugins.length : 3} plugins`);
  console.log(`Server on ${PORT}`);
  console.log(`⚡ BREAKER-ULTRA MD WEB LOGIN ⚡`);
  console.log(`🔗Web Link: http://${displayIp}:${PORT}`);
  console.log(`🔗Also open via your Katabump allocation link - Auto-detected!`);
});

const sessionsDir = path.join(__dirname, 'sessions');
const pluginsDir = path.join(__dirname, 'plugins');
global.plugins = [];

function loadPlugins() {
  global.plugins = [];
  if (!fs.existsSync(pluginsDir)) { fs.mkdirSync(pluginsDir, { recursive: true }); return; }
  const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
  for (let file of files) {
    try {
      delete require.cache[require.resolve(path.join(pluginsDir, file))];
      const plugin = require(path.join(pluginsDir, file));
      global.plugins.push(plugin);
    } catch {}
  }
}
loadPlugins();

async function startBot(sessionName) {
  const sessionPath = path.join(sessionsDir, sessionName);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), browser: ['BREAKER-ULTRA', 'Chrome', '1.0.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    if (u.connection === 'close') {
      const shouldReconnect = u.lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot(sessionName);
    } else if (u.connection === 'open') {
      console.log('Connected: ' + sessionName);
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
    if (!text.startsWith('.')) return;
    const args = text.slice(1).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    m.chat = m.key.remoteJid;
    for (let plugin of global.plugins) {
      let names = [];
      if (plugin.name) names = [plugin.name.toLowerCase(),...(plugin.alias||[]).map(a=>a.toLowerCase())];
      else if (plugin.command) names = plugin.command.map(c=>c.toLowerCase());
      if (names.includes(cmdName)) {
        try {
          if (plugin.run) await plugin.run(sock, m, { args });
          else if (plugin.handler) await plugin.handler(m, { sock, args });
        } catch (e) { console.log('Error ' + cmdName + ': ' + e); }
      }
    }
  });
}

async function loadAllSessions() {
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const folders = fs.readdirSync(sessionsDir);
  for (let num of folders) {
    const p = path.join(sessionsDir, num);
    if (fs.lstatSync(p).isDirectory() && fs.readdirSync(p).length > 0) {
      await startBot(num);
      await delay(1000);
    }
  }
}
loadAllSessions();
