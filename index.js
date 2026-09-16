const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 20130;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const realHost = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const realLink = `${proto}://${realHost}/?password=breaker123`;

  console.log("");
  console.log("========================================");
  console.log("REAL LINK: " + realLink);
  console.log("========================================");
  console.log("");

  try {
    const alloc = fs.readFileSync('/home/container/allocations.json','utf8');
    console.log("ALLOC RAW: " + alloc);
  } catch(e){}

  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/code', async (req, res) => {
  const num = (req.query.number || '').replace(/[^0-9]/g,'');
  if(!num) return res.json({error:'Number required'});

  try {
    const baileys = require('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState } = baileys;
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Ubuntu","Chrome","20.0.04"],
      keepAliveIntervalMs: 10000
    });
    
    sock.ev.on('creds.update', saveCreds);
    await new Promise(r => setTimeout(r, 3000));
    let code = await sock.requestPairingCode(num);
    code = code.match(/.{1,4}/g).join('-');
    
    console.log("CODE: " + code + " for " + num);
    res.json({ code: code });
    
  } catch(err) {
    console.log("ERROR: " + err.message);
    res.json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log("BREAKER STARTED ON " + PORT);
});
