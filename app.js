const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const settings = require('./settings');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const SESSION_DIR = path.join(__dirname, settings.MULTI || './session');
const CREDS_PATH = path.join(SESSION_DIR, 'creds.json');
const isPaired = () => fs.existsSync(CREDS_PATH);

app.get('/', (req, res) => {
  if (isPaired()) return res.status(403).sendFile(path.join(__dirname, 'locked.html'));
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/code', async (req, res) => {
  if (isPaired()) return res.status(403).json({ error: "LOCKED - Session active" });
  let number = (req.query.number || "").replace(/[^0-9]/g, "");
  if (!number) return res.status(400).json({ error: "Number required" });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, logger: pino({ level: "silent" }), auth: state, printQRInTerminal: false, browser: [settings.botName, "Chrome", "1.0.0"] });
    sock.ev.on("creds.update", saveCreds);
    await delay(1500);
    const code = await sock.requestPairingCode(number);
    res.json({ code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
