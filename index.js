const express = require('express')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const moment = require('moment-timezone')

// LOAD YOUR SETTINGS.JS - THIS WAS MISSING
let SETTINGS = {}
try {
  SETTINGS = require('./settings.js')
  console.log('[INFO] Loaded settings.js - MASTER_PASSWORD protection enabled')
} catch(e) { console.log('[WARN] settings.js not found, using defaults') }

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || SETTINGS.PORT || 3000
const HOST = '0.0.0.0'
const TIMEZONE = 'Africa/Kampala'
const MASTER_PASSWORD = SETTINGS.MASTER_PASSWORD || process.env.MASTER_PASSWORD || "123456"

const ROOT = __dirname
const SESSIONS_ROOT = path.join(ROOT, 'Sessions')
const LOGS_ROOT = path.join(ROOT, 'Logs')

if (!fs.existsSync(SESSIONS_ROOT)) fs.mkdirSync(SESSIONS_ROOT, { recursive: true })
if (!fs.existsSync(LOGS_ROOT)) fs.mkdirSync(LOGS_ROOT, { recursive: true })

const activeBots = new Map()
function getTime(){ return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss') }
function logger(id,msg){
  const line=`[${getTime()}] ${msg}\n`
  console.log(line.trim())
  try{fs.appendFileSync(path.join(LOGS_ROOT,`${id||'manager'}.log`),line)}catch{}
}
function getSessions(){
  if(!fs.existsSync(SESSIONS_ROOT)) return []
  return fs.readdirSync(SESSIONS_ROOT).filter(f=>{ try{ return fs.statSync(path.join(SESSIONS_ROOT,f)).isDirectory()}catch{return false}})
}
function startSession(sessionId, phoneNumber){
  if(activeBots.has(sessionId)){ try{activeBots.get(sessionId).kill()}catch{} activeBots.delete(sessionId) }
  const sp=path.join(SESSIONS_ROOT,sessionId)
  if(!fs.existsSync(sp)) fs.mkdirSync(sp,{recursive:true})
  const args=[path.join(ROOT,'start.js')]
  if(phoneNumber) args.push(phoneNumber,sessionId)
  logger(sessionId,`Starting ${sessionId} ${phoneNumber||''}`)
  const bot=spawn('node',args,{stdio:['inherit','pipe','pipe'],env:{...process.env,SESSION_ID:sessionId,PHONE_NUMBER:phoneNumber||''}})
  activeBots.set(sessionId,bot)
  bot.stdout.on('data',d=>logger(sessionId,d.toString().trim()))
  bot.stderr.on('data',d=>logger(sessionId,`ERROR:${d.toString().trim()}`))
  bot.on('close',code=>{
    logger(sessionId,`Exited ${code}`)
    activeBots.delete(sessionId)
    if(code!==0 && code!==1) setTimeout(()=>startSession(sessionId),3000)
  })
  return bot
}

// PASSWORD CHECK MIDDLEWARE
function checkPassword(req){
  const pass = req.query.password || req.headers['x-master-password'] || req.body?.password
  return pass === MASTER_PASSWORD
}

app.get('/',(req,res)=>{
  const s=getSessions()
  const fullUrl = `${req.protocol}://${req.get('host')}`
  const isAuthed = checkPassword(req)

  if(!isAuthed){
    return res.send(`
    <html><head><title>Login - BREAKER ULTRA MD</title>
    <style>body{background:#0a0a0a;color:#00ff88;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
   .box{border:1px solid #00ff88;padding:30px;border-radius:10px;text-align:center;background:#111;width:320px}
    input{padding:12px;width:90%;margin:10px 0;background:#000;color:#0f8;border:1px solid #0f8}
    button{padding:12px 20px;background:#00ff88;color:#000;border:0;cursor:pointer;font-weight:bold;width:100%}
    </style></head><body>
    <div class="box"><h2>⚡ BREAKER ULTRA MD</h2><p>Enter Master Password</p>
    <p style="font-size:11px;color:#888">Default from settings.js: 123456</p>
    <form action="/" method="get"><input type="password" name="password" placeholder="MASTER_PASSWORD" required><button type="submit">UNLOCK DASHBOARD</button></form>
    <p style="font-size:10px;margin-top:15px">Link: ${fullUrl}/?password=YOUR_PASSWORD</p></div></body></html>`)
  }

  res.send(`
  <html><head><title>BREAKER-ULTRA MD v2.7.0</title>
  <style>body{background:#0a0a0a;color:#00ff88;font-family:monospace;padding:20px}
.card{border:1px solid #00ff88;padding:15px;margin:10px 0;border-radius:8px;background:#111}
  a{color:#00ff88} input{padding:10px;background:#000;color:#0f8;border:1px solid #0f8;margin:3px}
  button{padding:10px 20px;background:#00ff88;color:#000;border:0;cursor:pointer;font-weight:bold}
  </style></head><body>
  <h1>⚡ BREAKER-ULTRA MD v2.7.0 ONLINE</h1>
  <p>🔗 Allocation Auto-Detected: <b>${fullUrl}</b></p>
  <p>🔐 Logged in with MASTER_PASSWORD</p>
  <div class="card">
    <h3>PAIR NEW BOT</h3>
    <form action="/code" method="get">
      <input type="hidden" name="password" value="${MASTER_PASSWORD}">
      <input name="number" placeholder="2567XXXXXXXX" required style="width:200px">
      <input name="session" placeholder="session name" style="width:150px">
      <button type="submit">GET PAIR CODE</button>
    </form>
    <p style="font-size:12px">Direct API: ${fullUrl}/code?number=2567XXXX&password=${MASTER_PASSWORD}</p>
  </div>
  <div class="card">
    <h3>ACTIVE SESSIONS (${s.length}) - ${activeBots.size} running</h3>
    ${s.map(x=>`<div>📁 ${x} - ${activeBots.has(x)?'🟢 ONLINE':'🔴 OFFLINE'} <a href="/start/${x}?password=${MASTER_PASSWORD}">[START]</a> <a href="/stop/${x}?password=${MASTER_PASSWORD}">[STOP]</a> <a href="/logs/${x}?password=${MASTER_PASSWORD}">[LOGS]</a> <a href="/delete/${x}?password=${MASTER_PASSWORD}">[DEL]</a></div>`).join('')||'No sessions yet'}
  </div>
  <div class="card"><a href="/status?password=${MASTER_PASSWORD}">/status</a> | <a href="/sessions?password=${MASTER_PASSWORD}">/sessions</a> | Time: ${getTime()}</div>
  </body></html>`)
})

app.get('/code',async(req,res)=>{
  if(!checkPassword(req)) return res.status(401).json({error:'Wrong MASTER_PASSWORD', hint:'Add?password=123456'})
  let number=(req.query.number||'').replace(/[^0-9]/g,'')
  let sid=(req.query.session||'').replace(/[^a-zA-Z0-9_-]/g,'')||`breaker_${Date.now().toString().slice(-4)}`
  if(!number) return res.status(400).json({error:'Add?number=2567XXXXXXXX&password=123456'})
  const sp=path.join(SESSIONS_ROOT,sid)
  if(fs.existsSync(sp)) try{fs.rmSync(sp,{recursive:true,force:true})}catch{}
  fs.mkdirSync(sp,{recursive:true})
  global.pairCodes=global.pairCodes||{}
  global.pairCodes[sid]=null
  startSession(sid,number)
  let tries=0
  while(!global.pairCodes[sid] && tries<25){
    const cf=path.join(ROOT,`pair_${sid}.txt`)
    if(fs.existsSync(cf)){ global.pairCodes[sid]=fs.readFileSync(cf,'utf8').trim(); try{fs.unlinkSync(cf)}catch{}; break }
    await new Promise(r=>setTimeout(r,1000)); tries++
  }
  const code=global.pairCodes[sid]
  if(code) return res.json({success:true,session:sid,number,code,pair_url:`${req.protocol}://${req.get('host')}/code?number=${number}&password=${MASTER_PASSWORD}`})
  return res.json({success:false,error:'Failed to generate, check logs',session:sid,logs:`/logs/${sid}?password=${MASTER_PASSWORD}`})
})

app.get('/sessions',(req,res)=>{ if(!checkPassword(req)) return res.status(401).json({error:'Unauthorized'}); res.json({total:getSessions().length,running:activeBots.size, sessions:getSessions()}) })
app.get('/status',(req,res)=>{ if(!checkPassword(req)) return res.status(401).json({error:'Unauthorized'}); res.json({bot:'BREAKER-ULTRA MD v2.7.0',total:getSessions().length,running:activeBots.size,uptime:process.uptime(), master_password_set:!!MASTER_PASSWORD}) })
app.get('/start/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Wrong password'); startSession(req.params.id); res.redirect('/?password='+MASTER_PASSWORD) })
app.get('/stop/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Wrong password'); const b=activeBots.get(req.params.id); if(b){b.kill();activeBots.delete(req.params.id);logger(req.params.id,'Stopped by user')} res.redirect('/?password='+MASTER_PASSWORD) })
app.get('/logs/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Wrong password'); const f=path.join(LOGS_ROOT,`${req.params.id}.log`); if(!fs.existsSync(f)) return res.send('No logs'); res.type('text/plain').send(fs.readFileSync(f,'utf8')) })
app.get('/delete/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Wrong password'); const b=activeBots.get(req.params.id); if(b){try{b.kill()}catch{} activeBots.delete(req.params.id)} try{fs.rmSync(path.join(SESSIONS_ROOT,req.params.id),{recursive:true,force:true})}catch{} res.redirect('/?password='+MASTER_PASSWORD) })

app.listen(PORT,HOST,()=>{console.log(`Manager running on http://${HOST}:${PORT} with MASTER_PASSWORD=${MASTER_PASSWORD}`)})