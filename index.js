const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const settings = require('./settings');

const app = express();
const PORT = process.env.PORT || settings.PORT || 3000;
global.activeBots = {};
global.plugins = [];
app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BREAKER-ULTRA MD</title>
<style>
body{background:#0a0a0a;color:white;font-family:sans-serif;text-align:center;padding:20px}
.card{background:#161616;border-radius:15px;padding:25px;margin:15px auto;max-width:400px;border:1px solid #333}
.btn{width:100%;padding:15px;margin:10px 0;border:none;border-radius:10px;font-weight:bold;font-size:16px}
.pair{background:#00ff88;color:black}
.qr{background:#008cff;color:white}
h1{color:#00ff88}
</style>
</head>
<body>
<h1>⚡ BREAKER-ULTRA MD ⚡</h1>
<p>Official Web Login - BREAKER-ULTRA MD</p>

<div class="card">
<h3>🔑 PAIR CODE LOGIN</h3>
<input id="num" placeholder="Enter WhatsApp Number e.g 2567xxxxxx" style="width:90%;padding:14px;border-radius:10px;border:none;margin-bottom:10px;text-align:center;font-size:16px">
<button class="btn pair" onclick="getCode()">GET PAIR CODE</button>
<div id="codeBox" style="margin-top:15px;font-size:22px;color:#00ff88;font-weight:bold"></div>
</div>

<div class="card">
<h3>📱 QR CODE LOGIN</h3>
<button class="btn qr" onclick="window.location.href='/qr'">GET QR CODE</button>
</div>

<div class="card">
<p>Server: ${req.headers.host}</p>
<p>Status: <span style="color:#00ff88">ONLINE ✅</span></p>
</div>

<script>
let timer;
async function getCode(){
 let n=document.getElementById('num').value.replace(/[^0-9]/g,'');
 if(!n) return alert('Enter number!');
 document.getElementById('codeBox').innerHTML='⏳ Generating...';
 let res=await fetch('/code?number='+n);
 let data=await res.json();
 if(data.code){
   let sec = 60;
   document.getElementById('codeBox').innerHTML='YOUR CODE: '+data.code+'<br><span id="count" style="font-size:16px;color:yellow">Expires in: 60s</span>';
   clearInterval(timer);
   timer=setInterval(()=>{
     sec--;
     let el=document.getElementById('count');
     if(el) el.innerHTML='Expires in: '+sec+'s - ENTER NOW!';
     if(sec<=0){
       clearInterval(timer);
       document.getElementById('codeBox').innerHTML='❌ Code Expired! Click again';
     }
   },1000);
 } else {
   document.getElementById('codeBox').innerHTML=data.error || 'Error';
 }
}
</script>
</body>
</html>
`));
const activeSockets = {};

app.get('/code', async (req, res) => {
  let num = req.query.number;
  if(!num) return res.json({error:'Enter number'});
  num = num.replace(/[^0-9]/g,'');

  const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
  const pino = require('pino');
  const fs = require('fs');

  try {
    // delete old temp if exists
    if(fs.existsSync('./temp_'+num)) fs.rmSync('./temp_'+num,{recursive:true,force:true});

    const { state, saveCreds } = await useMultiFileAuthState('./temp_'+num);
    const sock = makeWASocket({
      auth: state,
      logger: pino({level:'silent'}),
      printQRInTerminal:false,
      browser:['Ubuntu','Chrome','20.0.04'],
      syncFullHistory:false
    });

    activeSockets[num] = sock;
    sock.ev.on('creds.update', saveCreds);

    // Wait for socket to be ready
    await delay(3000);

    if(!sock.authState.creds.registered){
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join('-') || code;

      // keep socket alive 120 seconds
      setTimeout(()=>{
        try{ sock.end(); delete activeSockets[num]; }catch{}
      },120000);

      sock.ev.on('connection.update', async (u)=>{
  if(u.connection === 'open'){
    console.log(`✅ PAIRED SUCCESS: ${num}`);
    // Copy to correct multi-session folder
    try{
      const destPath = `./sessions/${num}`;
      if(!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');
      if(fs.existsSync(`./temp_${num}`)){
        if(fs.existsSync(destPath)) fs.rmSync(destPath, {recursive:true, force:true});
        fs.cpSync(`./temp_${num}`, destPath, {recursive:true});
        fs.rmSync(`./temp_${num}`, {recursive:true, force:true});
        console.log(`Session saved to ${destPath} - Restarting...`);
        setTimeout(()=> startBot(num), 2000);
      }
    }catch(e){ console.log(e); }
  }
  if(u.connection === 'close'){
    console.log('Connection closed for pairing', num);
  }
});

return res.json({code: code});

  } catch(e){
    console.log(e);
    res.json({error: e.message});
  }
});

app.get('/qr', async (req,res)=>{
  res.send('QR feature coming - use Pair Code for now!');
});
app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
  https.get('https://api.ipify.org', (res) => {
    let ip = '';
    res.on('data', d => ip += d);
    res.on('end', () => {
      console.log(`\n ⚡ BREAKER-ULTRA MD WEB LOGIN ⚡`);
      console.log(` 🔗 Web Link: http://${ip.trim()}:${PORT} \n`);
    });
  }).on('error', () => {
      console.log(`\n ⚡ BREAKER-ULTRA MD WEB LOGIN ⚡`);
      console.log(` 🔗 Web Link: http://0.0.0.0:${PORT} \n`);
  });
});

// LOAD PLUGINS FROM resources/Plugins
const pluginsPath = path.join(__dirname, 'resources', 'Plugins');
if (fs.existsSync(pluginsPath)) {
  fs.readdirSync(pluginsPath).forEach(file => {
    if (file.endsWith('.js')) {
      try {
        const plugin = require(path.join(pluginsPath, file));
        global.plugins.push(plugin);
      } catch (e) { console.log(`Failed plugin ${file}:`, e.message); }
    }
  });
  console.log(`✅ Loaded ${global.plugins.length} plugins`);
}

async function startBot(number) {
  const sessionPath = path.join(__dirname, 'sessions', number);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log(`✅ Connected: ${number}`);
      global.activeBots[number] = sock;

      // YOUR WELCOME MESSAGE - ONLY SENDS TO BOT ITSELF (PRIVATE CHAT)
      try {
        await sock.sendMessage(sock.user.id, { text: `⚡BREAKER -ULTRA MD ⚡ CONNECTED ✅ AND IS ACTIVE🟢` });
      } catch {}

    }
    if (connection === 'close') {
      delete global.activeBots[number];
      setTimeout(() => startBot(number), 3000);
    }
  });

  // UNIVERSAL PLUGIN HANDLER
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    if (m.key.fromMe) return;

    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    const prefix = ".";
    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    m.chat = m.key.remoteJid;

    for (let plugin of global.plugins) {
      let names = [];
      if (plugin.name) names = [plugin.name.toLowerCase(),...(plugin.alias || []).map(a => a.toLowerCase())];
      else if (plugin.command) names = plugin.command.map(c => c.toLowerCase());

      if (names.includes(cmdName)) {
        try {
          if (plugin.run) await plugin.run(sock, m, { prefix, botname: "BREAKER-ULTRA MD", args });
          else if (plugin.handler) await plugin.handler(m, { conn: sock, args, prefix });
        } catch (e) {
          console.log(`Error in ${cmdName}:`, e);
        }
      }
    }
  });

  return sock;
}

async function loadAllSessions() {
  const sessionsDir = path.join(__dirname, 'sessions');
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const folders = fs.readdirSync(sessionsDir);
  for (let num of folders) {
    if (fs.lstatSync(path.join(sessionsDir, num)).isDirectory()) {
      await startBot(num);
      await delay(1000);
    }
  }
}
loadAllSessions();

module.exports = { startBot };
