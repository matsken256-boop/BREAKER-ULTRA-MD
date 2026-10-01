const express = require('express');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const settings = require('./settings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HOME - Password Lock
app.get('/', (req, res) => {
  res.send(`
  <html><head><title>BREAKER ULTRA MD</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body{background:#000;color:#0f0;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
  .box{background:#111;padding:30px;border-radius:15px;width:90%;max-width:400px;text-align:center;border:2px solid #0f0}
  input{width:90%;padding:12px;margin:15px 0;border-radius:8px;border:none;outline:none;text-align:center}
  button{background:#0f0;color:#000;padding:12px 25px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;width:100%}</style>
  </head><body><div class="box"><h2>🔒 BREAKER-ULTRA-MD</h2>
  <p>Multi-Session Portal</p>
  <form action="/verify" method="POST">
  <input type="password" name="password" placeholder="Enter Master Password" required>
  <button type="submit">UNLOCK</button></form>
  <p style="font-size:12px;color:#555;margin-top:15px">Demo: Breaker</p></div></body></html>
  `);
});

app.post('/verify', (req, res) => {
  if(req.body.password === settings.MASTER_PASSWORD){
    res.sendFile(path.join(__dirname, 'pair.html'));
  } else {
    res.send(`<script>alert('❌ Wrong Password'); window.location='/'</script>`);
  }
});

// REAL PAIRING CODE GENERATOR - LOCKED WITH PASSWORD
app.get('/pair', async (req, res) => {
  const num = req.query.number;
  const pass = req.query.password;
  
  if(pass !== settings.MASTER_PASSWORD){
    return res.status(401).json({ error: "🔒 Wrong password! Use: Breaker" });
  }
  if(!num) return res.json({ error: "Enter number" });

  try {
    const sessionId = `auth_${Date.now()}`;
    const authFolder = path.join(__dirname, settings.MULTI_SESSION.sessionFolder || './auth', sessionId);
    fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
      printQRInTerminal: false,
      browser: [settings.botName, "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    if(!sock.authState.creds.registered){
      await delay(1500);
      const cleanNum = num.replace(/[^0-9]/g, '');
      const code = await sock.requestPairingCode(cleanNum);
      res.json({ code: code });
    } else {
      res.json({ error: "Already paired" });
    }
  } catch(e){
    res.json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`🔒 Portal locked at port ${PORT} - Password: ${settings.MASTER_PASSWORD}`));
