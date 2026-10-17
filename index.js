const express = require('express')
const fs = require('fs')
const path = require('path')
const https = require('https')
const { spawn } = require('child_process')
const moment = require('moment-timezone')

let SETTINGS = null
try { SETTINGS = require('./settings.js') }
catch(e){ console.error('[FATAL] settings.js missing! Set MASTER_PASSWORD'); process.exit(1) }
if(!SETTINGS.MASTER_PASSWORD){ console.error('[FATAL] Set MASTER_PASSWORD in settings.js'); process.exit(1) }

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || SETTINGS.PORT || 3000
const HOST = '0.0.0.0'
const TIMEZONE = 'Africa/Kampala'
const MASTER_PASSWORD = SETTINGS.MASTER_PASSWORD

const ROOT = __dirname
const SESSIONS_ROOT = path.join(ROOT, 'Sessions')
const LOGS_ROOT = path.join(ROOT, 'Logs')
if (!fs.existsSync(SESSIONS_ROOT)) fs.mkdirSync(SESSIONS_ROOT, { recursive: true })
if (!fs.existsSync(LOGS_ROOT)) fs.mkdirSync(LOGS_ROOT, { recursive: true })

// AUTO CLEAN OLD PAIR_*.TXT - FIXES YOUR SCREENSHOT
setInterval(()=>{
  try{
    fs.readdirSync(ROOT).forEach(f=>{
      if(f.startsWith('pair_') && f.endsWith('.txt')){
        const fp=path.join(ROOT,f);
        try{
          const age=Date.now()-fs.statSync(fp).mtimeMs;
          if(age>60000){ fs.unlinkSync(fp); console.log(`[CLEAN] Deleted ${f}`)}
        }catch{}
      }
    })
  }catch{}
}, 30000)

const activeBots = new Map()
function getTime(){ return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss') }
function logger(id,msg){ console.log(`[${getTime()}] ${msg}`); try{fs.appendFileSync(path.join(LOGS_ROOT,`${id||'manager'}.log`),`[${getTime()}] ${msg}\n`)}catch{} }
function getSessions(){ if(!fs.existsSync(SESSIONS_ROOT)) return []; return fs.readdirSync(SESSIONS_ROOT).filter(f=>{try{return fs.statSync(path.join(SESSIONS_ROOT,f)).isDirectory()}catch{return false}}) }
function startSession(sessionId, phoneNumber){
  if(activeBots.has(sessionId)){ try{activeBots.get(sessionId).kill()}catch{} activeBots.delete(sessionId) }
  const sp=path.join(SESSIONS_ROOT,sessionId)
  if(!fs.existsSync(sp)) fs.mkdirSync(sp,{recursive:true})
  const args=[path.join(ROOT,'start.js')]; if(phoneNumber) args.push(phoneNumber,sessionId)
  const bot=spawn('node',args,{stdio:['inherit','pipe','pipe'],env:{...process.env,SESSION_ID:sessionId,PHONE_NUMBER:phoneNumber||''}})
  activeBots.set(sessionId,bot)
  bot.stdout.on('data',d=>logger(sessionId,d.toString().trim()))
  bot.stderr.on('data',d=>logger(sessionId,`ERROR:${d.toString().trim()}`))
  bot.on('close',code=>{ logger(sessionId,`Exited ${code}`); activeBots.delete(sessionId); if(code!==0 && code!==1) setTimeout(()=>startSession(sessionId),3000) })
  return bot
}
function checkPassword(req){ const pass = req.query.password || req.headers['x-master-password'] || req.body?.password; return pass === MASTER_PASSWORD }

function detectPublicIP(){
  return new Promise((resolve)=>{
    https.get('https://api.ipify.org', (res)=>{ let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d.trim())) }).on('error',()=>resolve(null))
  })
}

app.get('/',(req,res)=>{
  const s=getSessions()
  const fullUrl = `${req.protocol}://${req.get('host')}`
  if(!checkPassword(req)){
    return res.send(`<html><head><title>Login</title><style>body{background:#0a0a0a;color:#00ff88;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.box{border:1px solid #00ff88;padding:30px;border-radius:10px;text-align:center;background:#111;width:320px}input{padding:12px;width:90%;margin:10px 0;background:#000;color:#0f8;border:1px solid #0f8}button{padding:12px;background:#00ff88;color:#000;border:0;font-weight:bold;width:100%;cursor:pointer}</style></head><body><div class="box"><h2>⚡ BREAKER ULTRA MD</h2><form action="/" method="get"><input type="password" name="password" placeholder="MASTER_PASSWORD" required><button>UNLOCK</button></form><p style="font-size:10px">${fullUrl}</p></div></body></html>`)
  }
  res.send(`<html><head><title>BREAKER-ULTRA MD</title><style>body{background:#0a0a0a;color:#00ff88;font-family:monospace;padding:20px}.card{border:1px solid #00ff88;padding:15px;margin:10px 0;border-radius:8px;background:#111}a{color:#00ff88}input{padding:10px;background:#000;color:#0f8;border:1px solid #0f8;margin:3px}button{padding:10px 20px;background:#00ff88;color:#000;border:0;font-weight:bold;cursor:pointer}</style></head><body><h1>⚡ ONLINE</h1><p>Link: ${fullUrl}/?password=****</p><div class="card"><h3>PAIR NEW BOT</h3><form action="/code" method="get"><input type="hidden" name="password" value="${req.query.password}"><input name="number" placeholder="2567XXXXXXXX" required style="width:200px"><button>GET CODE</button></form></div><div class="card">${s.map(x=>`<div>${x} ${activeBots.has(x)?'🟢':'🔴'} <a href="/start/${x}?password=${req.query.password}">[START]</a> <a href="/logs/${x}?password=${req.query.password}">[LOGS]</a> <a href="/delete/${x}?password=${req.query.password}" style="color:#f55">[DELETE]</a></div>`).join('')||'No sessions'}</div></body></html>`)
})

app.get('/code',async(req,res)=>{
  if(!checkPassword(req)) return res.status(401).json({error:'Unauthorized'})
  let number=(req.query.number||'').replace(/[^0-9]/g,'')
  let sid=(req.query.session||'').replace(/[^a-zA-Z0-9_-]/g,'')||`breaker_${Date.now().toString().slice(-4)}`
  if(!number) return res.status(400).json({error:'need number'})
  
  const sp=path.join(SESSIONS_ROOT,sid)
  // FIX: DON'T DELETE IF ALREADY PAIRED - THIS WAS DELETING YOUR SESSIONS
  const credsFile=path.join(sp,'creds.json')
  if(fs.existsSync(credsFile)){
    return res.send(`<html><body style="background:#0a0a0a;color:#00ff88;font-family:monospace;padding:30px;text-align:center"><h2>⚠️ Session ${sid} already paired!</h2><p>creds.json exists in Sessions/${sid}/</p><p><a href="/?password=${req.query.password}" style="color:#0f8">Go Back</a> | <a href="/delete/${sid}?password=${req.query.password}" style="color:#f55">Delete to re-pair</a></p></body></html>`)
  }
  if(fs.existsSync(sp)) try{fs.rmSync(sp,{recursive:true,force:true})}catch{}
  fs.mkdirSync(sp,{recursive:true})
  
  global.pairCodes=global.pairCodes||{}; global.pairCodes[sid]=null; startSession(sid,number)
  
  // FIX: FAST POLL 300ms not 1000ms
  let tries=0; while(!global.pairCodes[sid] && tries<60){ 
    const cf=path.join(ROOT,`pair_${sid}.txt`); 
    if(fs.existsSync(cf)){ 
      try{ global.pairCodes[sid]=fs.readFileSync(cf,'utf8').trim(); }catch{}
      try{fs.unlinkSync(cf)}catch{}; 
      if(global.pairCodes[sid]) break;
    } 
    await new Promise(r=>setTimeout(r,300)); tries++ 
  }
  
  const code=global.pairCodes[sid];
  
  // FIX: BIG DISPLAY NOT SMALL JSON
  if(code){
    return res.send(`
      <html><head><meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body{background:#0a0a0a;color:#fff;font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px}
        .box{border:2px solid #00ff88;background:#111;padding:30px;border-radius:20px;text-align:center;max-width:400px;width:100%;box-shadow:0 0 30px #00ff8833}
        .code{font-size:56px;font-weight:bold;letter-spacing:6px;color:#00ff88;background:#000;padding:20px 10px;border-radius:15px;margin:20px 0;border:2px solid #00ff88;word-spacing:10px}
        .num{color:#888;font-size:14px;margin-top:10px}
        .inst{font-size:13px;color:#ccc;text-align:left;background:#1a1a1a;padding:15px;border-radius:10px;margin-top:20px;line-height:1.6}
        .warn{color:#ffcc00;font-size:13px;margin-top:15px;font-weight:bold;animation:blink 1s infinite}
        @keyframes blink{50%{opacity:0.5}}
        button{padding:15px 30px;background:#00ff88;color:#000;border:0;font-weight:bold;font-size:16px;border-radius:10px;cursor:pointer;width:100%;margin-top:15px}
      </style></head>
      <body><div class="box">
        <div style="font-size:20px">⚡ BREAKER ULTRA MD</div>
        <div class="num">FOR: +${number}</div>
        <div class="code">${code}</div>
        <div class="warn">⏱️ EXPIRES IN 30 SECONDS - TYPE NOW!</div>
        <div class="inst">
          <b>How to link:</b><br>
          1. Open WhatsApp on <b>+${number}</b><br>
          2. Settings > Linked Devices<br>
          3. Link a Device<br>
          4. Click "Link with phone number"<br>
          5. Type: <b>${code}</b>
        </div>
        <button onclick="location.href='/?password=${req.query.password}'">BACK TO HOME</button>
        <div style="font-size:10px;color:#555;margin-top:15px">Session: ${sid} - Saved in Sessions/${sid}/creds.json</div>
      </div></body></html>
    `);
  }
  return res.send(`<html><body style="background:#000;color:#f55;font-family:monospace;padding:30px;text-align:center"><h2>❌ Failed to get code - Timeout</h2><p>Check Logs for ${sid}</p><p>Error: start.js didn't create pair_${sid}.txt</p><a href="/?password=${req.query.password}" style="color:#0f8">Go Back</a> | <a href="/logs/${sid}?password=${req.query.password}" style="color:#ff0">[LOGS]</a></body></html>`)
})

app.get('/start/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Unauthorized'); startSession(req.params.id); res.redirect('/?password='+req.query.password) })
app.get('/stop/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Unauthorized'); const b=activeBots.get(req.params.id); if(b){b.kill();activeBots.delete(req.params.id)} res.redirect('/?password='+req.query.password) })
app.get('/logs/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Unauthorized'); const f=path.join(LOGS_ROOT,`${req.params.id}.log`); if(!fs.existsSync(f)) return res.send('No logs'); res.type('text/plain').send(fs.readFileSync(f,'utf8')) })
app.get('/delete/:id',(req,res)=>{ if(!checkPassword(req)) return res.status(401).send('Unauthorized'); const b=activeBots.get(req.params.id); if(b){try{b.kill()}catch{} activeBots.delete(req.params.id)} try{fs.rmSync(path.join(SESSIONS_ROOT,req.params.id),{recursive:true,force:true})}catch{} res.redirect('/?password='+req.query.password) })

app.listen(PORT,HOST,async()=>{
  console.log(`[INFO] Loaded settings.js`)
  const ip = await detectPublicIP()
  const allocation = ip? `http://${ip}:${PORT}` : `http://0.0.0.0:${PORT}`
  console.log(``)
  console.log(`=================================================`)
  console.log(`🔗 WEB LOGIN LINK:`)
  console.log(`${allocation}`)
  console.log(`=================================================`)
  console.log(``)
  console.log(`Manager running on ${allocation}`)
  console.log(`To login, add?password=YOUR_PASSWORD`)
})
