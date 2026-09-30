const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const settings = require('./settings');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.use(express.json());

// ===== MONGODB CONNECTION =====
let isMongoConnected = false;
const MONGO_URL = settings.MONGODB_URL || settings.DATABASE_URL;

if (MONGO_URL) {
  mongoose.connect(MONGO_URL).then(() => {
    isMongoConnected = true;
    console.log('✅ MongoDB Connected - Sessions will be saved permanently');
  }).catch(e => console.log('Mongo Error: ' + e.message));
}

const sessionSchema = new mongoose.Schema({
  _id: String,
  creds: Object,
  keys: Object
});
const Session = mongoose.model('Session', sessionSchema);

async function useMongoAuthState(number) {
  let saved = null;
  if (isMongoConnected) {
    saved = await Session.findById(number);
  }
  const sessionPath = path.join(__dirname, 'sessions', number);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  if (saved) {
    return {
      state: { creds: saved.creds, keys: makeCacheableSignalKeyStore(saved.keys, pino({ level: 'silent' })) },
      saveCreds: async () => { },
      mongoSave: async (creds, keys) => {
        await Session.findByIdAndUpdate(number, { creds, keys }, { upsert: true });
      },
      fileState: null
    };
  } else {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    return {
      state,
      saveCreds,
      mongoSave: async (creds, keys) => {
        if (isMongoConnected) {
          await Session.findByIdAndUpdate(number, { creds, keys }, { upsert: true });
        }
      },
      fileState: { state, saveCreds }
    };
  }
}

// ===== PASSWORD LOCK =====
function checkPassword(req, res, next) {
  const inputPass = req.query.password || req.headers['x-master-password'] || req.body.password;
  if (!inputPass) {
    return res.send(`<html><body style="background:#0f172a;color:white;text-align:center;font-family:Arial;padding:50px">
      <h2>🔒 BREAKER-ULTRA MD Locked</h2>
      <p>Enter Master Password</p>
      <form method="get">
      <input type="password" name="password" placeholder="Master Password" style="padding:12px;width:80%;border-radius:8px;border:none;margin:10px"/>
      <br><button type="submit" style="padding:12px 25px;background:#25D366;color:white;border:none;border-radius:8px">Unlock</button>
      </form></body></html>`);
  }
  if (inputPass!== settings.MASTER_PASSWORD) {
    return res.send('❌ Wrong Master Password! Default is Breaker123');
  }
  next();
}

app.get('/', checkPassword, async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const fulllink = `${protocol}://${host}`;
  res.send(`<html><head><title>BREAKER-ULTRA MD</title><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:Arial;background:#0f172a;color:white;text-align:center}.box{background:#1e293b;padding:25px;border-radius:15px;max-width:400px;margin:15px auto}.link{background:black;padding:12px;border-radius:8px;margin:15px 0;word-break:break-all}input{padding:12px;width:80%;border-radius:8px;border:none;margin:10px}button{padding:12px 25px;background:#25D366;color:white;border:none;border-radius:8px}</style>
    <body><div class="box"><h2>⚡ BREAKER-ULTRA MD ⚡</h2><p>Web Login Active - MongoDB: ${isMongoConnected? '✅ Connected' : '❌ File Only'}</p><div class="link">${fulllink}?password=${req.query.password}</div>
    <form action="/pair" method="get"><input type="hidden" name="password" value="${req.query.password}"><input name="number" placeholder="2567XXXXXXX"><br><button type="submit">Get Pair Code</button></form>
    </div></body></html>`);
});

app.get('/pair', checkPassword, async (req, res) => {
  let num = req.query.number?.replace(/[^0-9]/g, '');
  if (!num) return res.send('Add?number=2567XXXXXXX');
  try {
    const auth = await useMongoAuthState(num);
    const sock = makeWASocket({
      auth: { creds: auth.state.creds, keys: auth.state.keys },
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });
    sock.ev.on('creds.update', async () => {
      const keys = sock.authState.keys;
      await auth.mongoSave(sock.authState.creds, {});
      if (auth.fileState) await auth.fileState.saveCreds();
    });
    if (!sock.authState.creds.registered) {
      await delay(2000);
      let code = await sock.requestPairingCode(num);
      code = code.match(/.{1,4}/g).join('-') || code;
      res.send(`<html><body style='background:#0f172a;color:white;text-align:center;padding:50px;font-family:Arial'><h2>Your Code: ${code}</h2><p>Enter in WhatsApp within 15 SECONDS! Linked Devices > Link with phone number</p></body></html>`);
    } else {
      res.send('Already paired! Bot will start soon.');
    }
  } catch (e) {
    res.send('Error: ' + e.message);
  }
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Server on ${PORT}`);
  console.log(`🔐 Master Password: ${settings.MASTER_PASSWORD}`);
  console.log(`🔗 MongoDB: ${MONGO_URL? 'Set' : 'Not Set - will use file only'}`);
});

const sessionsDir = path.join(__dirname, 'sessions');
const pluginsDir = path.join(__dirname, 'plugins');
global.plugins = [];
function loadPlugins() {
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
  const auth = await useMongoAuthState(sessionName);
  const sock = makeWASocket({ auth: auth.state, logger: pino({ level: 'silent' }), browser: ["Ubuntu", "Chrome", "20.0.04"] });
  sock.ev.on('creds.update', async () => {
    await auth.mongoSave(sock.authState.creds, sock.authState.keys);
    if (auth.fileState) await auth.fileState.saveCreds();
  });
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
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (!text.startsWith('.')) return;
    const args = text.slice(1).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    m.chat = m.key.remoteJid;
    for (let plugin of global.plugins) {
      let names = [];
      if (plugin.name) names = [plugin.name.toLowerCase(),...(plugin.alias || []).map(a => a.toLowerCase())];
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
  if (isMongoConnected) {
    const all = await Session.find({});
    for (let s of all) {
      await startBot(s._id);
      await delay(1000);
    }
  }
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const folders = fs.readdirSync(sessionsDir);
  for (let num of folders) {
    const p = path.join(sessionsDir, num);
    if (fs.lstatSync(p).isDirectory() && fs.readdirSync(p).length > 0) {
      if (isMongoConnected) {
        const exists = await Session.findById(num);
        if (exists) continue;
      }
      await startBot(num);
      await delay(1000);
    }
  }
}

setTimeout(() => loadAllSessions(), 3000);
