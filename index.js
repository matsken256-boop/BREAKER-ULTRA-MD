const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const settings = require('./settings');

const app = express();
const PORT = process.env.PORT || settings.PORT || 3000;
const SESSION_DIR = path.join(__dirname, settings.MULTI_SESSION.sessionFolder || './auth');

app.use(express.json());
app.use(express.static(__dirname));

const isPaired = () => fs.existsSync(path.join(SESSION_DIR, 'creds.json'));

app.get('/', (req, res) => {
  if (isPaired()) return res.sendFile(path.join(__dirname, 'locked.html'));
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/code', async (req, res) => {
  if (isPaired()) return res.status(403).json({ error: settings.mess.sessionLimit });
  let num = (req.query.number || '').replace(/[^0-9]/g, '');
  if (!num) return res.status(400).json({ error: 'Number required' });
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, logger: pino({ level: 'silent' }), auth: state, browser: [settings.botName, 'Chrome', settings.botVersion] });
    sock.ev.on('creds.update', saveCreds);
    await delay(1500);
    const code = await sock.requestPairingCode(num);
    res.json({ code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function getIP(){
  try{ const r = await fetch('https://api.ipify.org'); return (await r.text()).trim(); }catch{ return null; }
}

app.listen(PORT, '0.0.0.0', async () => {
  const ip = await getIP();
  console.log(`Server on ${PORT}`);
  console.log(`⚡ ${settings.botName} WEB LOGIN ⚡`);
  console.log(`Web Link: http://${ip || 'YOUR-IP'}:${PORT}`);
  console.log(`Also open via your Katabump allocation link - Auto-detected!`);
  require('./start')();
});
