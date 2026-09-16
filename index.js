const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 20130; // Auto-detects Katabump port
let pairingCache = { code: null, time: 0, number: null };
const CODE_EXPIRE_MS = 2 * 60 * 1000; // 2 MINUTES

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Home - shows dynamic link based on who visits
app.get('/', (req, res) => {
  const host = req.get('host'); // AUTO-DETECTS user's allocation: e.g. 51.83.6.7:20130 or 51.83.6.8:20300 etc
  const fullLink = `http://${host}`;
  
  const htmlPath = path.join(__dirname, 'pair.html');
  if(fs.existsSync(htmlPath)){
    // Inject dynamic link into pair.html
    let html = fs.readFileSync(htmlPath, 'utf8');
    // Add banner with their real link
    const banner = `<div style="background:#0f0;color:#000;padding:10px;text-align:center;font-weight:bold">Your Login Link: ${fullLink} - Share this to pair</div>`;
    html = html.replace('<body>', `<body>${banner}`);
    return res.send(html);
  }
  res.send(`<h2>BREAKER ULTRA MD</h2><p>Your link: ${fullLink}</p><p>Go to ${fullLink}/pair?number=2567XXXX</p>`);
});

// Pair endpoint - 2 min cache + dynamic link
app.get('/pair', async (req,res) => {
  let number = req.query.number;
  const host = req.get('host'); // This is the REAL allocation of the user who called it
  const userLink = `http://${host}`;

  if(!number) return res.json({error: 'Add ?number=2567XXXX', your_link: userLink});
  number = number.replace(/[^0-9]/g,'');

  try{
    const now = Date.now();
    if(pairingCache.code && pairingCache.number === number && (now - pairingCache.time) < CODE_EXPIRE_MS){
       return res.json({code: pairingCache.code, expires_in: Math.floor((CODE_EXPIRE_MS - (now-pairingCache.time))/1000)+'s', your_login_link: userLink, note: 'Code valid for 2 minutes'});
    }

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), browser: ["BREAKER-ULTRA-MD","Chrome","1.0.0"]});
    sock.ev.on('creds.update', saveCreds);
    
    if(state.creds.registered){
      return res.json({error: 'Already paired!', your_link: userLink});
    }

    await delay(1500);
    const code = await sock.requestPairingCode(number);
    pairingCache = { code, time: now, number };
    
    console.log(`[ PAIRING CODE ] : ${code} for ${number} | User Link: ${userLink} - Valid 2 mins`);
    return res.json({code, expires_in: '120s', your_login_link: userLink});

  }catch(e){
    console.log(e);
    res.json({error: e.message, your_link: userLink});
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`AUTO-DETECT MODE ENABLED`);
  console.log(`Each user gets their own link automatically:`);
  console.log(`- Check your Katabump > Network tab > IP:Port`);
  console.log(`- Open http://YOUR_ALLOCATION_IP:PORT`);
  console.log(`- The bot will show YOUR login link, not hardcoded`);
  console.log(`========================================`);
  console.log(`[ INFO ] Pair code lasts 2 MINUTES`);
});

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), browser: ["BREAKER-ULTRA-MD","Chrome","1.0.0"]});
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
