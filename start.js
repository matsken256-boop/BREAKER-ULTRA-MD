/*
╔═══════════════════════════════════════╗
║ BREAKER-ULTRA-MD v2.7.0 BOX LOCKED ║
║ ROOT: LOCKED | HOST: RANDOM ANYWHERE║
╚═══════════════════════════════════════╝
*/
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
app.use(express.urlencoded({extended:true}));

// Web UI
app.get('/', (req,res)=>{
  const webFile = path.join(__dirname,'Resources','Web','index.html');
  if(fs.existsSync(webFile)) return res.sendFile(webFile);
  res.send(`
  <html>
  <head><title>BREAKER ULTRA MD</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>body{background:#0a0a0a;color:#00ff88;font-family:monospace;text-align:center;padding:30px}input{padding:12px;width:260px;border:1px solid #00ff88;background:#111;color:#fff}button{padding:12px 25px;background:#00ff88;border:0;font-weight:bold;cursor:pointer;margin-top:10px}</style>
  </head>
  <body>
  <h1>┌─⊷ ◇ BREAKER ULTRA MD ◇ ⊶┐</h1>
  <h2>v2.7.0 BOX LOCKED</h2>
  <p>ROOT LOCKED | Resources LOCKED | ${fs.existsSync('./Resources/plugins')?fs.readdirSync('./Resources/plugins').length:0} Plugins</p>
  <hr style="border-color:#00ff88">
  <h3>GET PAIR CODE</h3>
  <input id="num" placeholder="256769724124"><br>
  <button onclick="getCode()">GET CODE</button>
  <h2 id="code"></h2>
  <script>
  async function getCode(){
    const n=document.getElementById('num').value;
    if(!n) return alert('Enter number');
    document.getElementById('code').innerText='Generating...';
    const r=await fetch('/code?number='+n);
    const d=await r.json();
    if(d.code) document.getElementById('code').innerText='CODE: '+d.code;
    else document.getElementById('code').innerText=d.error;
  }
  </script>
  </body></html>`);
});

// Pair code API
app.get('/code', async (req,res)=>{
  let num = (req.query.number||'').replace(/[^0-9]/g,'');
  if(!num) return res.status(400).json({error:'Use /code?number=256769724124'});
  if(!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR,{recursive:true});
  try{
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({version,logger:pino({level:'silent'}),auth:state,browser:[settings.BOT_NAME||'BREAKER-ULTRA-MD','Chrome','2.7.0']});
    sock.ev.on('creds.update',saveCreds);
    await delay(2000);
    const code = await sock.requestPairingCode(num);
    console.log(`\n[PAIR] ${num} => ${code}\n`);
    res.json({code, success:true});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// AUTO DETECT ALLOCATION & WEB LOGIN LINK
app.listen(PORT,'0.0.0.0', ()=>{
  console.log(`
┌─⊷ ◇ BREAKER ULTRA MD WEB ◇ ⊶┐
│ v2.7.0 BOX LOCKED - PRO
│ PORT: ${PORT} - Auto Detected
│ HOST: 0.0.0.0 (Random Anywhere)
├─⊷ WEB LOGIN LINKS ⊶┐
│ Local: http://localhost:${PORT}
│ Allocation: Your hosting panel link (Katabump/Render) will use PORT ${PORT}
│ Pair Direct: /code?number=256769724124
├─⊷ INSTRUCTIONS ⊶┐
│ 1. Open your allocation link from panel
│ 2. Add number to get pair code
│ 3. Pair in WhatsApp
└─⊷ READY TO DEPLOY ANYWHERE
  `);
  try{ require('./start')(); }catch(e){ console.log('Bot start error:',e.message); }
});