const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;

let sockInstance = null;

function getServerIP(){
  try{
    const nets = os.networkInterfaces();
    for(const name of Object.keys(nets)){
      for(const net of nets[name]){
        if(net.family==='IPv4' &&!net.internal) return net.address;
      }
    }
  }catch{}
  return '51.83.7.201';
}

app.get('/', (req, res) => {
  res.send(`
  <html><head><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BREAKER PAIRING</title>
  <style>
    body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
   .card{background:#1a1a1a;padding:30px;border-radius:20px;width:90%;max-width:420px;text-align:center;box-shadow:0 0 25px #00ff88;border:1px solid #00ff88}
    input{width:90%;padding:15px;border-radius:10px;border:none;margin:15px 0;font-size:16px;background:#000;color:#fff;border:1px solid #333}
    button{width:95%;padding:15px;background:#00ff88;color:#000;border:none;border-radius:10px;font-weight:bold;font-size:16px;cursor:pointer}
   .code{font-size:32px;letter-spacing:6px;background:#000;padding:18px;border-radius:12px;margin:18px 0;color:#00ff88;font-weight:bold;border:1px solid #00ff88}
   .linkbox{background:#000;padding:10px;border-radius:8px;color:#00ff88;font-size:12px;word-break:break-all;margin:10px 0}
  </style></head>
  <body><div class="card">
      <h2>⚡ BREAKER-ULTRA-MD ⚡</h2>
      <p>PAIRING WEB LOGIN</p>
      <div class="linkbox">Server: https://${getServerIP()}:${PORT}</div>
      <input id="num" placeholder="2557xxxxxxxx" />
      <button onclick="getCode()">GET PAIRING CODE</button>
      <div id="result"></div>
      <p style="font-size:11px;margin-top:20px;color:#888">WhatsApp > Linked Devices > Link with phone number instead</p>
    </div>
    <script>
      async function getCode(){
        const n=document.getElementById('num').value;
        if(!n){alert('Enter number with country code');return}
        document.getElementById('result').innerHTML='<p style=color:#00ff88>Generating... wait 3 sec</p>';
        const res=await fetch('/getcode?number='+n);
        const data=await res.json();
        if(data.code){document.getElementById('result').innerHTML='<div class=code>'+data.code+'</div><p style=color:#00ff88>✅ Copy this code NOW!</p>';}
        else{document.getElementById('result').innerHTML='<p style=color:red>❌ '+data.error+'</p>';}
      }
    </script></body></html>
  `);
});

app.get('/getcode', async (req, res) => {
  let num = (req.query.number||'').replace(/[^0-9]/g,'');
  if(!num) return res.json({error:"Number required"});
  if(!sockInstance) return res.json({error:"Bot starting... wait 5 sec and retry"});
  try{
    if(sockInstance.authState.creds.registered){
      return res.json({error:"Already paired! Delete auth_info_baileys folder"});
    }
    const code = await sockInstance.requestPairingCode(num);
    console.log(`\n====================\nPAIRING CODE FOR ${num}: ${code}\n====================\n`);
    res.json({code});
  }catch(e){res.json({error:e.message})}
});

async function initBot(){
  const {state,saveCreds}=await useMultiFileAuthState('auth_info_baileys');
  const sock=makeWASocket({
    auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:"silent"}))},
    printQRInTerminal:false,logger:pino({level:"silent"}),
    browser:["Ubuntu","Chrome","20.0.04"]
  });
  sockInstance=sock;
  sock.ev.on('creds.update',saveCreds);
  sock.ev.on('connection.update',async(u)=>{
    const{connection,lastDisconnect}=u;
    if(connection==='open'){console.log('\n✅✅✅ BOT CONNECTED TO WHATSAPP! ✅✅✅\n');}
    if(connection==='close'){
      if(lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) initBot();
    }
  });
  sock.ev.on('messages.upsert',async(m)=>{
    const msg=m.messages[0];if(!msg.message) return;
    const text=msg.message.conversation||msg.message.extendedTextMessage?.text||"";
    if(!text.startsWith('.')) return;
    const args=text.slice(1).trim().split(/ +/);const cmdName=args.shift().toLowerCase();
    const pluginsPath=path.join(__dirname,'resources','Plugins');
    if(!fs.existsSync(pluginsPath)) return;
    for(const file of fs.readdirSync(pluginsPath).filter(f=>f.endsWith('.js'))){
      try{const fp=path.join(pluginsPath,file);delete require.cache[require.resolve(fp)];
      const plugin=require(fp);
      if(plugin.command&&plugin.command.includes(cmdName)) await plugin.handler(msg,{conn:sock,args,text});
      }catch{}
    }
  });
}

app.listen(PORT,'0.0.0.0',()=>{
  const ip = getServerIP();
  console.log(`
 ________________________________________
| |
| ⚡ BREAKER-ULTRA-MD PAIRING SERVER ⚡ |
| |
| Server running on ${PORT} - Pairing Web Ready |
| |
| ➤ Local: http://localhost:${PORT} |
| ➤ Network: http://${ip}:${PORT} |
| ➤ Pairing Web: https://${ip}:${PORT} |
| ➤ Public: https://control.katabump.com/se |
| |
| OPEN YOUR PUBLIC URL TO GET CODE! |
|________________________________________|
`);
});
initBot();
