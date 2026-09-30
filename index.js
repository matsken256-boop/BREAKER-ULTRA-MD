const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const os = require('os');
const settings = require('./settings');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || settings.PORT || 3000;
const HOST = '0.0.0.0';
app.use(express.json());

let pairingSocks = {};

function checkPassword(req, res, next) {
  const inputPass = req.query.password || req.headers['x-master-password'];
  if (!inputPass) {
    return res.send(`<html><body style="background:#0f172a;color:white;text-align:center;font-family:Arial;padding:50px"><h2>🔒 BREAKER-ULTRA MD Locked</h2><p>Enter Master Password</p><form action="/" method="get"><input type="password" name="password" placeholder="Master Password" style="padding:12px;border-radius:8px;border:none;margin:10px"/><br><button type="submit" style="padding:12px 25px;background:#25D366;color:white;border:none;border-radius:8px">Unlock</button></form></body></html>`);
  }
  if (inputPass!== settings.MASTER_PASSWORD) {
    return res.send('❌ Wrong Master Password! Check settings.js');
  }
  next();
}

async function getPublicIP() {
  try {
    if (process.env.SERVER_IP) return process.env.SERVER_IP;
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' &&!net.internal && net.address!== '127.0.0.1') {
          return net.address;
        }
      }
    }
    return null;
  } catch { return null; }
}

app.get('/', checkPassword, async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const fulllink = `${protocol}://${host}`;
  res.send(`<html><head><title>BREAKER-ULTRA MD</title><meta name="viewport" content="width=device-width"></head><style>body{font-family:Arial;background:#0f172a;color:white;text-align:center}.box{background:#1e293b;padding:25px;border-radius:15px;max-width:400px;margin:50px auto}.link{background:black;padding:12px;border-radius:8px;margin:15px 0;word-break:break-all}input{padding:12px;width:80%;border-radius:8px;border:none;margin:10px}button{padding:12px 25px;background:#25D366;color:white;border:none;border-radius:8px}</style><body><div class="box"><h2>⚡ BREAKER-ULTRA MD ⚡</h2><p>Web Login Active</p><div class="link">${fulllink}</div><p style="font-size:11px;opacity:0.6">Auto-detected link</p><form action="/pair" method="get"><input type="hidden" name="password" value="${req.query.password}"><input type="text" name="number" placeholder="2567XXXXXXX"><br><button type="submit">Get Pair Code</button></form></div></body></html>`);
});

app.get('/pair', checkPassword, async (req, res) => {
  let num = req.query.number? req.query.number.replace(/[^0-9]/g, '') : '';
  if (!num) return res.send('Add?number=2567XXXXXX');
  const sessionPath = path.join(__dirname, 'sessions', num);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }
  fs.mkdirSync(sessionPath, { recursive: true });
  try {
    if (pairingSocks[num]) { try { pairingSocks[num].end(); } catch {} }
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });
    pairingSocks[num] = sock;
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
      if (u.connection === 'open') {
        console.log('PAIRED SUCCESS: ' + num);
        delete pairingSocks[num];
      }
    });
    await delay(3000);
    if (!sock.authState.creds.registered) {
      let code = await sock.requestPairingCode(num);
      code = code.match(/.{1,4}/g).join('-') || code;
      res.send(`<html><body style="background:#0f172a;color:white;text-align:center;padding:50px;font-family:Arial"><h2>Your Code: ${code}</h2><p>Enter in WhatsApp within 15 seconds!</p><h1>${code}</h1></body></html>`);
      setTimeout(() => { try { sock.end(); } catch {} delete pairingSocks[num]; }, 90000);
    } else {
      res.send('Already paired! Restart server.');
    }
  } catch (e) {
    console.log(e);
    res.send('Error: ' + e.message);
  }
});

const sessionsDir = path.join(__dirname, 'sessions');
const pluginsDir = path.join(__dirname, 'plugins');
global.plugins = [];

function loadPlugins() {
  global.plugins = [];
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
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
  const { makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    logger: pino({ level: 'silent' }),
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });
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
    if (!m.message) return;
    if (m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text;
    if (!text) return;
    if (!text.startsWith('.')) return;
    const args = text.slice(1).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    m.chat = m.key.remoteJid;
    for (let plugin of global.plugins) {
      let names = [];
      if (plugin.name) names = [plugin.name.toLowerCase(),...(plugin.alias || [])];
      else if (plugin.command) names = plugin.command.map(c => c.toLowerCase());
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

app.listen(PORT, HOST, async () => {
  const ip = await getPublicIP();
  console.log(`Server on ${PORT}`);
  console.log(`Web Link: http://${ip || 'SERVER-IP'}:${PORT}`);
  await loadAllSessions();
});
