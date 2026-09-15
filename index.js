const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let sockInstance = null;

app.get('/', (req, res) => {
  res.send(`
  <html><head><meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
  .card{background:#1a1a1a;padding:30px;border-radius:20px;width:90%;max-width:400px;text-align:center;box-shadow:0 0 20px #00ff88}
    input{width:90%;padding:15px;border-radius:10px;border:none;margin:10px 0;font-size:16px}
    button{width:95%;padding:15px;background:#00ff88;border:none;border-radius:10px;font-weight:bold;font-size:16px;cursor:pointer}
  .code{font-size:28px;letter-spacing:5px;background:#000;padding:15px;border-radius:10px;margin:15px 0;color:#00ff88;font-weight:bold}
  </style></head>
  <body><div class="card">
      <h2>⚡ BREAKER-ULTRA-MD ⚡</h2>
      <p>Enter WhatsApp Number</p>
      <input id="num" placeholder="2557xxxxxxxx" />
      <button onclick="getCode()">GET PAIRING CODE</button>
      <div id="result"></div>
      <p style="font-size:12px;margin-top:20px">WhatsApp > Linked Devices > Link with phone number</p>
    </div>
    <script>
      async function getCode(){
        const n=document.getElementById('num').value;
        document.getElementById('result').innerHTML='<p>Generating...</p>';
        const res=await fetch('/getcode?number='+n);
        const data=await res.json();
        if(data.code){document.getElementById('result').innerHTML='<div class=code>'+data.code+'</div>';}
        else{document.getElementById('result').innerHTML='<p style=color:red>'+data.error+'</p>';}
      }
    </script></body></html>
  `);
});

app.get('/getcode', async (req, res) => {
  let num = req.query.number.replace(/[^0-9]/g,'');
  if(!sockInstance) return res.json({error:"Wait 5 sec"});
  try{
    const code = await sockInstance.requestPairingCode(num);
    console.log(`CODE FOR ${num}: ${code}`);
    res.json({code});
  }catch(e){res.json({error:e.message})}
});

app.get('/pair',(req,res)=>res.redirect('/'));

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
    if(connection==='open'){console.log('✅ BOT CONNECTED!');}
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
app.listen(PORT,'0.0.0.0',()=>console.log(`Server running on ${PORT} - Pairing Web Ready`));
initBot();
