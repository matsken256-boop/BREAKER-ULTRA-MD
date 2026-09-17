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
  if (!num) return res.send('Add?number=2567XXXXXXXX');
  const sessionPath = path.join(__dirname, 'sessions', num);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), browser: ['BREAKER-ULTRA', 'Chrome', '1.0.0'] });
    sock.ev.on('creds.update', saveCreds);
    if (!sock.authState.creds.registered) {
      await delay(1500);
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      res.send(`<html><body style="background:#0f172a;color:white;text-align:center;padding:30px"><div style="background:#1e293b;padding:20px;border-radius:12px;max-width:400px;margin:auto"><h2>Code: ${code}</h2><p>WhatsApp > Linked Devices > Link with number</p><a href="/" style="color:#25D366">Back</a></div></body></html>`);
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
  console.log(`⚡ BREAKER-ULTRA MD WEB LOGIN
