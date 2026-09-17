const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-detect allocation info
app.get('/', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const fullUrl = `${protocol}://${host}`;

  res.send(`
    <html>
    <head><title>MatsKen Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body{font-family:Arial;background:#0f172a;color:white;text-align:center;padding:20px}
      input{padding:12px;width:85%;max-width:300px;border-radius:8px;border:none;margin:10px}
      button{padding:12px 25px;background:#25D366;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer}
     .box{background:#1e293b;padding:20px;border-radius:12px;max-width:420px;margin:auto;word-break:break-all}
     .info{background:#000;padding:10px;border-radius:8px;margin:10px 0;font-size:12px;text-align:left}
    </style>
    </head>
    <body>
      <div class="box">
        <h2>MatsKen Bot - Online ✅</h2>
        <div class="info">
          <b>Allocation Auto-Detected:</b><br>
          Host: ${host}<br>
          Port: ${PORT}<br>
          Full Link: ${fullUrl}<br>
          Status: Connected to Katabump Allocation
        </div>
        <p>Enter WhatsApp number with country code</p>
        <form action="/pair" method="get">
          <input type="text" name="number" placeholder="2567XXXXXXXX" required>
          <br><button type="submit">Get Pairing Code</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

app.get('/pair', async (req, res) => {
  let num = req.query.number;
  if (!num) return res.send('Provide number:?number=2567XXXXXXXX');
  num = num.replace(/[^0-9]/g, '');
  if (num.length < 10) return res.send('Invalid number');

  const sessionPath = path.join(__dirname, 'sessions', num);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['MatsKen', 'Chrome', '1.0.0']
    });
    sock.ev.on('creds.update', saveCreds);
    if (!sock.authState.creds.registered) {
      await delay(2000);
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      res.send(`<html><body style="font-family:Arial;background:#0f172a;color:white;text-align:center;padding:30px"><div style="background:#1e293b;padding:20px;border-radius:12px;max-width:400px;margin:auto"><h2>Pairing Code</h2><div style="font-size:32px;letter-spacing:5px;background:black;padding:15px;border-radius:8px;margin:15px 0">${code}</div><p>WhatsApp > Linked Devices > Link with phone number</p><a href="/" style="color:#25D366">Back</a></div></body></html>`);
      sock.ev.on('connection.update', async (u) => {
        if (u.connection === 'open') {
          console.log('Paired: ' + num);
          await delay(1000);
          loadAllSessions();
        }
      });
    } else {
      res.send('Already paired! Bot will connect.');
    }
  } catch (e) {
    console.log('Pair error:', e);
    res.send('Error: ' + e.message + ' <a href="/">Try again</a>');
  }
});

// THIS IS THE FIX FOR ALLOCATION
app.listen(PORT, HOST, () => {
  console.log('--- ALLOCATION AUTO-DETECTED ---');
  console.log('Host: ' + HOST);
  console.log('Port: ' + PORT);
  console.log('Server listening on ' + HOST + ':' + PORT);
  console.log('--------------------------------');
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
    } catch (e) { console.log('Failed ' + file + ': ' + e.message); }
  }
  console.log('Loaded ' + global.plugins.length + ' plugins');
}
loadPlugins();

async function startBot(sessionName) {
  const sessionPath = path.join(sessionsDir, sessionName);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), browser: ['MatsKen Bot', 'Chrome', '1.0.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot(sessionName);
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
      if (plugin.name) { names = [plugin.name.toLowerCase(),...(plugin.alias || []).map(a => a.toLowerCase())]; }
      else if (plugin.command) { names = plugin.command.map(c => c.toLowerCase()); }
      if (names.includes(cmdName)) {
        try {
          if (plugin.run) await plugin.run(sock, m, { prefix, body: text, args });
          else if (plugin.handler) await plugin.handler(m, { sock, prefix, args });
        } catch (e) { console.log('Error in ' + cmdName + ': ' + e); }
      }
    }
  });
  return sock;
}

async function loadAllSessions() {
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const folders = fs.readdirSync(sessionsDir);
  console.log('Sessions found: ' + folders.length);
  for (let num of folders) {
    const fullPath = path.join(sessionsDir, num);
    if (fs.lstatSync(fullPath).isDirectory() && fs.readdirSync(fullPath).length > 0) {
      console.log('Starting: ' + num);
      await startBot(num);
      await delay(1500);
    }
  }
}
loadAllSessions();
process.on('uncaughtException', (e) => { console.log('Uncaught:', e); });
