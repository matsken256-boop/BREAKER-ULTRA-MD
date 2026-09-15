const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 20130;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/code', async (req, res) => {
  let number = req.query.number;
  if (!number) return res.json({ error: 'Number required' });
  number = number.replace(/[^0-9]/g, '');
  try {
    const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
    const makeWASocket = require('@whiskeysockets/baileys').default;
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({ auth: state, printQRInTerminal: false });
    sock.ev.on('creds.update', saveCreds);
    await new Promise(r => setTimeout(r, 2000));
    let code = await sock.requestPairingCode(number);
    code = code.match(/.{1,4}/g).join('-');
    res.json({ code: code });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log('BREAKER ULTRA MD running on port ' + PORT);
});

try {
  require('./start.js');
} catch (e) {
  console.log('start.js not found, running pair server only');
    }
