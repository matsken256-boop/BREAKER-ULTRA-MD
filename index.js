const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const app = express();
const PORT = 20130;
let sock;

app.get('/', (req, res) => {
 res.send(`<h2 style="background:#000;color:#0f0;text-align:center;padding:20px">BREAKER-ULTRA-MD<br><br><input id="n" value="256766800757"><br><br><button onclick="fetch('/pair?number='+document.getElementById('n').value).then(r=>r.json()).then(d=>document.getElementById('c').innerText=d.code)">GET CODE</button><h1 id="c"></h1></h2>`);
});
app.get('/pair', async (req,res)=>{
 let num=req.query.number?.replace(/[^0-9]/g,'');
 try{
  if(!sock) return res.json({error:'Wait 5 sec'});
  await delay(1500);
  let code=await sock.requestPairingCode(num);
  code=code.match(/.{1,4}/g).join('-');
  console.log(`PAIR CODE: ${code}`);
  res.json({code});
 }catch(e){res.json({error:e.message})}
});

async function initBot(){
 const {state,saveCreds}=await useMultiFileAuthState('./auth_info_baileys');
 sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:"fatal"}))},logger:pino({level:"silent"}),printQRInTerminal:false,browser:["Ubuntu","Chrome","20.0.04"]});
 sock.ev.on('creds.update',saveCreds);
 sock.ev.on('connection.update',async(u)=>{
  if(u.connection==='open') console.log('✅✅✅ CONNECTED! Check WhatsApp private chat');
  if(u.connection==='close' && u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) setTimeout(initBot,3000);
 });
 sock.ev.on('messages.upsert',async({messages})=>{
  const m=messages[0]; if(!m?.message||m.key.fromMe) return;
  const t=m.message.conversation||m.message.extendedTextMessage?.text||"";
  if(t.toLowerCase()==='ping'||t==='.ping') await sock.sendMessage(m.key.remoteJid,{text:"*PONG!* BREAKER Active"});
 });
}

app.listen(PORT,'0.0.0.0',()=>{
 console.log(`
 / // / /___ / _) _ _
/ /< / _ / /_/ / / / / / / _ _ \\
 / // / /_/ / / / / / / / / / /
/_/ /_\\_\\_/_/_/___/ _/ _/ /_/.-
                                /_/
 `);
 console.log(`container@katabump~ node /home/container/index.js`);
 console.log(`--------------------------------------------------`);
 console.log(`✅ BREAKER-ULTRA-MD IS LIVE!`);
 console.log(`Port: ${PORT}`);
 console.log(`🌐 Open your Network Tab IP:${PORT}`);
 console.log(`Example: http://51.83.6.7:${PORT}`);
 console.log(`--------------------------------------------------`);
 initBot();
});
