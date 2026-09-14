const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 20130;

app.get('/', (req, res) => {
  res.send(`
  <html>
  <head><title>BREAKER ULTRA</title></head>
  <body style="background:#0a0a0a;color:#00ff00;font-family:monospace;text-align:center;padding-top:60px">
    <h1>🔥 BREAKER-ULTRA-MD 🔥</h1>
    <h2>Web Pairing Dashboard</h2>
    <p>Enter your WhatsApp number with country code</p>
    <input id="num" placeholder="2567XXXXXXX" style="padding:12px;width:260px;font-size:16px;text-align:center">
    <br><br>
    <button onclick="getCode()" style="padding:12px 30px;background:#00ff00;color:#000;font-weight:bold;border:none;cursor:pointer;font-size:16px">GET PAIR CODE</button>
    <h1 id="code" style="margin-top:40px;letter-spacing:5px"></h1>
    <p id="info"></p>
    <script>
      async function getCode(){
        const n = document.getElementById('num').value;
        if(!n) return alert('Enter number');
        document.getElementById('code').innerText = 'WAIT...';
        document.getElementById('info').innerText = 'Generating code...';
        const r = await fetch('/pair?number='+n);
        const d = await r.json();
        document.getElementById('code').innerText = d.code || d.error;
        document.getElementById('info').innerText = d.code ? 'Enter this code in WhatsApp > Linked Devices > Link with phone number' : '';
      }
    </script>
  </body>
  </html>
  `);
});

app.get('/pair', async (req, res) => {
  const number = req.query.number;
  if (!number) return res.json({ error: 'Number required' });
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ["BREAKER-ULTRA", "Chrome", "1.0"]
    });
    sock.ev.on('creds.update', saveCreds);
    if (!state.creds.registered) {
      await delay(1500);
      const code = await sock.requestPairingCode(number);
      console.log('PAIR CODE:', code);
      return res.json({ code: code });
    } else {
      return res.json({ error: 'Already registered. Delete auth_info_baileys to pair new number' });
    }
  } catch (e) {
    console.log(e);
    res.json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running on http://51.75.118.17:${PORT} - Access the dashboard to configure the bot`);
});
