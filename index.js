const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // <-- CHANGE THIS 3000 TO YOUR KATABUMP ALLOCATED PORT IF NEEDED
let pairingCache = { code: null, time: 0, number: null };
const CODE_EXPIRE_MS = 2 * 60 * 1000; // 2 MINUTES

app.use(express.static(path.join(__dirname)));

// Serve pair.html on main link
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'pair.html');
  if(fs.existsSync(htmlPath)) return res.sendFile(htmlPath);
  res.send(`<h2>BREAKER-ULTRA-MD Pairing</h2><p>Go to /pair?number=2567XXXXXXX</p>`);
});

// Pair endpoint - code lasts 2 mins
app.get('/pair', async (req,res) => {
  let number = req.query.number;
  if(!number) return res.json({error: 'Add ?number=2567XXXXXXX'});
  number = number.replace(/[^0-9]/g,'');

  try{
    const now = Date.now();
    // If same number and code still within 2 mins, return same code
    if(pairingCache.code && pairingCache.number === number && (now - pairingCache.time) < CODE_EXPIRE_MS){
       return res.json({code: pairingCache.code, expires_in: Math.floor((CODE_EXPIRE_MS - (now-pairingCache.time))/1000)+'s', link: `http://${req.headers.host}/`});
    }

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), printQRInTerminal: false, browser: ["BREAKER-ULTRA-MD","Chrome","1.0.0"]});
    sock.ev.on('creds.update', saveCreds);
    
    if(state.creds.registered){
      return res.json({error: 'Already paired! Delete ./session to pair again'});
    }

    await delay(1500);
    const code = await sock.requestPairingCode(number);
    pairingCache = { code, time: now, number };
    
    console.log(`[ PAIRING CODE ] : ${code} for ${number} - Valid for 2 mins`);
    console.log(`[ WEB LINK ] : http://${req.headers.host}/pair?number=${number}`);

    return res.json({code, expires_in: '120s', message: 'Code valid for 2 minutes', web_link: `http://${req.headers.host}/`});

  }catch(e){
    console.log(e);
    res.json({error: e.message});
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`KATATABUMP ALLOCATION LINK:`);
  console.log(`http://YOUR_ALLOCATED_IP:${PORT}`);
  console.log(`Example: If your allocation is 51.75.118.17:3124`);
  console.log(`Then your link is http://51.75.118.17:3124`);
  console.log(`========================================`);
  console.log(`[ INFO ] Code will now last for 2 MINUTES`);
});

// --- BOT PART ---
async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), printQRInTerminal: true, browser: ["BREAKER-ULTRA-MD","Chrome","1.0.0"]});
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u;
    if(connection === 'close'){
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if(shouldReconnect) startBot();
    } else if(connection === 'open'){
      console.log('✅ BREAKER-ULTRA-MD Connected Successfully!');
    }
  });
}
startBot();
