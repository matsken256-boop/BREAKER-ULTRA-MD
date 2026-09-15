const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 20130;

let activeSocket = null;
let lastCode = null;
let codeExpireTime = null;

// Auto-detect IP for login link
let SERVER_IP = "YOUR-IP";
try {
  const alloc = JSON.parse(fs.readFileSync('/home/container/allocations.json','utf8'));
  SERVER_IP = alloc.ip + ":" + alloc.port;
} catch(e) {
  SERVER_IP = "51.75.118.17:20130";
}

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/code', async (req, res) => {
  let number = req.query.number;
  if (!number) return res.json({ error: 'Number required' });
  number = number.replace(/[^0-9]/g, '');

  // Clean old session if exists and expired
  if (codeExpireTime && Date.now() > codeExpireTime) {
    if (activeSocket) try{ activeSocket.end(); }catch(e){}
    activeSocket = null;
    lastCode = null;
  }

  try {
    const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
    const makeWASocket = require('@whiskeysockets/baileys').default;
    
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    // If socket already exists and code still valid (2 min), return same code
    if (activeSocket && lastCode && codeExpireTime && Date.now() < codeExpireTime) {
      return res.json({ code: lastCode, expires: Math.floor((codeExpireTime - Date.now())/1000), loginLink: `http://${SERVER_IP}/?password=breaker123` });
    }

    const sock = makeWASocket({ 
      auth: state, 
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000
    });
    
    activeSocket = sock;
    sock.ev.on('creds.update', saveCreds);

    await new Promise(r => setTimeout(r, 3000));
    let code = await sock.requestPairingCode(number);
    code = code.match(/.{1,4}/g).join('-');
    
    lastCode = code;
    codeExpireTime = Date.now() + 120000; // 2 MINUTES! 120 seconds

    console.log(`\n=== PAIR CODE FOR ${number} : ${code} ===`);
    console.log(`=== VALID FOR 2 MINUTES ===`);
    console.log(`=== LOGIN LINK: http://${SERVER_IP}/?password=breaker123 ===\n`);

    res.json({ 
      code: code, 
      expires: 120,
      loginLink: `http://${SERVER_IP}/?password=breaker123`,
      message: "Code valid for 2 minutes! You have time boss!"
    });

    // Auto close after 2 mins if not paired
    setTimeout(() => {
      if (activeSocket) {
        console.log("Code expired after 2 min, closing...");
        // Don't delete socket immediately, let user request new one
      }
    }, 120000);

  } catch (e) {
    console.log("Pair error:", e.message);
    res.json({ error: e.message });
  }
});

// Show allocation auto
app.get('/alloc', (req,res) => {
  res.json({ ip: SERVER_IP, login: `http://${SERVER_IP}/?password=breaker123`, expires: "2 minutes" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BREAKER ULTRA MD running on port ${PORT}`);
  console.log(`REAL LOGIN LINK: http://${SERVER_IP}/?password=breaker123`);
  console.log(`Code will be valid for 2 MINUTES now!`);
});
