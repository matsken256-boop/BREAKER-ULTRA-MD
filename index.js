const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Auto-detects for every user who uses your bot
const SERVER_IP = process.env.SERVER_IP || "51.83.6.7";
const SERVER_PORT = process.env.SERVER_PORT || "20130";
const PAIRING_LINK = `http://${SERVER_IP}:${SERVER_PORT}`;

let sockInstance = null;

app.get('/', (req, res) => {
  res.send(`
  <html><head><title>BREAKER LOGIN</title><meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{background:#000;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
   .box{background:#111;padding:30px;border-radius:20px;width:90%;max-width:380px;text-align:center;box-shadow:0 0 20px #00ff88}
    input{width:90%;padding:14px;border-radius:10px;border:none;margin:10px 0}
    button{width:95%;padding:14px;background:#00ff88;border:none;border-radius:10px;font-weight:bold;cursor:pointer}
   .code{font-size:28px;background:#000;padding:15px;border-radius:10px;color:#00ff88;margin:15px 0;letter-spacing:3px}
  </style></head>
  <body><div class="box">
    <h2>⚡ BREAKER-ULTRA-MD ⚡</h2>
    <p>PAIRING WEB LOGIN</p>
    <input id="num" placeholder="2557xxxxxxxx">
    <button onclick="getCode()">GET PAIRING CODE</button>
    <div id="result"></div>
  </div>
  <script>
    async function getCode(){
      const n=document.getElementById('num').value;
      document.getElementById('result').innerHTML='Generating...';
      const r=await fetch('/getcode?number='+n);
      const d=await r.json();
      if(d.code) document.getElementById('result').innerHTML='<div class=code>'+d.code+'</div>';
      else document.getElementById('result').innerHTML='<p style=color:red>'+d.error+'</p>';
    }
  </script></body></html>`);
});

app.get('/getcode', async (req,res)=>{
  let num=(req.query.number||'').replace(/[^0-9]/g,'');
  if(!sockInstance) return res.json({error:"Wait 5 sec and retry"});
  try{
    const code=await sockInstance.requestPairingCode(num);
    console.log(`PAIRING CODE FOR ${num}: ${code}`);
    res.json({code});
  }catch(e){res.json({error:e.message})}
});

async function startBot(){
  const {state,saveCreds}=await useMultiFileAuthState('auth_info_baileys');
  const sock=makeWASocket({
    auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:"silent"}))},
    printQRInTerminal:false,logger:pino({level:"silent"}),
    browser:["Ubuntu","Chrome","20.0.04"]
  });
  sockInstance=sock;
  sock.ev.on('creds.update',saveCreds);
  sock.ev.on('connection.update',u=>{
    if(u.connection==='open') console.log('\n✅ BOT CONNECTED!\n');
    if(u.connection==='close' && u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();
  });
  sock.ev.on('messages.upsert',async m=>{
    const msg=m.messages[0]; if(!msg.message) return;
    const txt=msg.message.conversation||msg.message.extendedTextMessage?.text||"";
    if(!txt.startsWith('.')) return;
    const args=txt.slice(1).trim().split(/ +/); const cmd=args.shift().toLowerCase();
    const p=path.join(__dirname,'resources','Plugins');
    if(!fs.existsSync(p)) return;
    for(const f of fs.readdirSync(p).filter(x=>x.endsWith('.js'))){
      try{const fp=path.join(p,f); delete require.cache[require.resolve(fp)]; const pl=require(fp);
      if(pl.command&&pl.command.includes(cmd)) await pl.handler(msg,{conn:sock,args,text:txt});
      }catch{}
    }
  });
}

app.listen(PORT,'0.0.0.0',()=>{
  console.log(`
  Server running on ${PORT} - Ready
  Allocation: ${SERVER_IP}:${SERVER_PORT}

  >>> PAIRING WEB LOGIN LINK: <<<
  ${PAIRING_LINK}
  `);
});
startBot();
