const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const settings = require('./settings');

const app = express();
const PORT = process.env.PORT || settings.PORT || 3000;
const SESSION_DIR = path.join(__dirname, settings.SESSION_FOLDER || './Sessions/breaker');

app.use(express.json());
app.use(express.static(__dirname));

// Serve Web folder
app.get('/', (req, res) => {
  const webPath = path.join(__dirname, 'Resources', 'Web', 'index.html');
  if (fs.existsSync(webPath)) return res.sendFile(webPath);
  res.send(`
  <body style="background:#0a0a0a;color:#00ff88;font-family:monospace;text-align:center;padding:50px">
  <h1>┌─⊷ ◇ BREAKER ULTRA ◇ ⊶┐</h1>
  <h2>v2.7.0 BOX LOCKED</h2>
  <p>Resources Locked ✅ | Plugins Active ✅</p>
  <a href="/code?number=2567XXXXXXXX" style="color:#00ff88">GET PAIR CODE</a>
  </body>`);
});

app.get('/code', async (req, res) => {
  let num = (req.query.number || '').replace(/[^0-9]/g,'');
  if (!num) return res.status(400).json({ error: 'Number required: /code?number=2567XXX' });
  
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, {recursive:true});
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ 
      version, 
      logger: pino({level:'silent'}), 
      auth: state, 
      browser: ['BREAKER-ULTRA-MD','Chrome','2.7.0'] 
    });
    sock.ev.on('creds.update', saveCreds);
    await delay(1500);
    const code = await sock.requestPairingCode(num);
    res.json({ 
      code,
      message: `┌─⊷ ◇ BREAKER ULTRA MD ◇ ⊶┐\n│ Code: ${code}\n│ Bot: v2.7.0 BOX\n└─⊷`
    });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

async function getIP(){
  try{ const r = await fetch('https://api.ipify.org'); return (await r.text()).trim(); }catch{ return null; }
}

app.listen(PORT, '0.0.0.0', async () => {
  const ip = await getIP();
  console.log(`Server on ${PORT}`);
  console.log(`⚡ ${settings.BOT_NAME || 'BREAKER-ULTRA-MD'} WEB LOGIN ⚡`);
  console.log(`Web Link: http://${ip || 'YOUR-IP'}:${PORT}`);
  console.log('Also open via your Katabump allocation link - Auto-detected!');
});