const express = require('express')
const app = express()
const PORT = process.env.PORT || 200
app.use(express.json())
app.get('/', (req,res)=>{
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>BREAKER</title><style>body{background:#0f0f0f;color:#fff;text-align:center;padding:25px;font-family:sans-serif}.box{background:#1a1a1a;padding:25px;border-radius:15px;max-width:400px;margin:auto}input{padding:15px;width:90%;border-radius:10px;background:#000;color:#fff;border:1px solid #333;font-size:18px}button{padding:15px;background:#25D366;color:#fff;border:none;border-radius:10px;font-size:18px;margin-top:15px;font-weight:bold;width:95%}#code{font-size:36px;color:#25D366;letter-spacing:5px;margin-top:20px}</style></head><body><div class="box"><h1>🔥 BREAKER-ULTRA-MD 🔥</h1><p>Web Pairing Dashboard</p><input id="num" placeholder="256747701543"/><br><button onclick="getCode()">GET PAIR CODE</button><h2 id="code"></h2><p id="msg"></p></div><script>async function getCode(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');if(!n)return alert('Enter number');document.getElementById('msg').innerText='Generating... wait 8 sec';let r=await fetch('/pair?number='+n);let d=await r.json();if(d.code)document.getElementById('code').innerText=d.code;else document.getElementById('msg').innerText=d.error}</script></body></html>`)
})
let globalSock=null
app.get('/pair', async(req,res)=>{
 try{
  const number=(req.query.number||'').replace(/[^0-9]/g,'')
  if(!globalSock) return res.json({error:'Bot starting... wait 5 sec retry'})
  if(globalSock.authState.creds.registered) return res.json({error:'Already paired! Delete auth_info_baileys folder'})
  const code=await globalSock.requestPairingCode(number)
  res.json({code})
 }catch(e){res.json({error:e.message})}
})
app.listen(PORT, ()=>console.log(`Web server running on http://51.75.118.17:${PORT} - Access the dashboard to configure the bot`))
const {default:makeWASocket,useMultiFileAuthState,DisconnectReason,fetchLatestBaileysVersion}=require('@whiskeysockets/baileys')
const P=require('pino')
async function startBotCore(){
 const {version}=await fetchLatestBaileysVersion()
 const {state,saveCreds}=await useMultiFileAuthState('auth_info_baileys')
 const sock=makeWASocket({version,auth:state,logger:P({level:'silent'}),browser:['BREAKER','Chrome','1.0.0']})
 globalSock=sock
 sock.ev.on('creds.update',saveCreds)
 sock.ev.on('connection.update', async(u)=>{
  const {connection,lastDisconnect}=u
  if(connection==='close'){
   if(lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) setTimeout(startBotCore,3000)
  }else if(connection==='open'){console.log('✅ BREAKER CONNECTED!')}
 })
 try{const handler=require('./handler');sock.ev.on('messages.upsert',(m)=>handler(m,sock))}catch{}
}
startBotCore()
