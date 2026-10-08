const express = require('express')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const moment = require('moment-timezone')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'
const TIMEZONE = 'Africa/Kampala'

const ROOT = __dirname
const SESSIONS_ROOT = path.join(ROOT, 'Sessions')
const LOGS_ROOT = path.join(ROOT, 'Logs')

if (!fs.existsSync(SESSIONS_ROOT)) fs.mkdirSync(SESSIONS_ROOT, { recursive: true })
if (!fs.existsSync(LOGS_ROOT)) fs.mkdirSync(LOGS_ROOT, { recursive: true })

const activeBots = new Map()

function getTime(){ return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss') }
function logger(id,msg){
  const f=path.join(LOGS_ROOT,`${id||'manager'}.log`)
  const line=`[${getTime()}] ${msg}\n`
  console.log(line.trim())
  try{fs.appendFileSync(f,line)}catch{}
}
function getSessions(){
  if(!fs.existsSync(SESSIONS_ROOT)) return []
  return fs.readdirSync(SESSIONS_ROOT).filter(f=>fs.statSync(path.join(SESSIONS_ROOT,f)).isDirectory())
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

app.get('/',(req,res)=>{
  const s=getSessions()
  res.send(`<h1>BREAKER-ULTRA MD v2.7.0 ONLINE</h1><p>Sessions: ${s.length} Running: ${activeBots.size}</p>${s.map(x=>`<div>${x} ${activeBots.has(x)?'ONLINE':'OFFLINE'} <a href="/start/${x}">[START]</a> <a href="/stop/${x}">[STOP]</a> <a href="/logs/${x}">[LOGS]</a> <a href="/delete/${x}">[DEL]</a></div>`).join('')}<br><form action="/code">Number:<input name="number" placeholder="2567XXXX"><input name="session" placeholder="session"><button>GET CODE</button></form><br><a href="/status">status</a>`)
})

app.get('/code',async(req,res)=>{
  let number=(req.query.number||'').replace(/[^0-9]/g,'')
  let sid=(req.query.session||'').replace(/[^a-zA-Z0-9_-]/g,'')||`breaker_${Date.now().toString().slice(-4)}`
  if(!number) return res.status(400).json({error:'?number=2567XXXXXXXX'})
  const sp=path.join(SESSIONS_ROOT,sid)
  if(fs.existsSync(sp)) try{fs.rmSync(sp,{recursive:true,force:true})}catch{}
  fs.mkdirSync(sp,{recursive:true})
  global.pairCodes=global.pairCodes||{}
  global.pairCodes[sid]=null
  startSession(sid,number)
  let tries=0
  while(!global.pairCodes[sid] && tries<25){
    const cf=path.join(ROOT,`pair_${sid}.txt`)
    if(fs.existsSync(cf)){
      global.pairCodes[sid]=fs.readFileSync(cf,'utf8').trim()
      try{fs.unlinkSync(cf)}catch{}
      break
    }
    await new Promise(r=>setTimeout(r,1000))
    tries++
  }
  const code=global.pairCodes[sid]
  if(code) return res.json({success:true,session:sid,number,code})
  return res.json({success:false,error:'Failed, check /logs/'+sid,session:sid})
})

app.get('/sessions',(req,res)=>{res.json({total:getSessions().length,running:activeBots.size})})
app.get('/status',(req,res)=>res.json({bot:'BREAKER-ULTRA MD v2.7.0',total:getSessions().length,running:activeBots.size,uptime:process.uptime()}))
app.get('/start/:id',(req,res)=>{startSession(req.params.id);res.redirect('/')})
app.get('/stop/:id',(req,res)=>{
  const b=activeBots.get(req.params.id)
  if(b){b.kill();activeBots.delete(req.params.id);logger(req.params.id,'Stopped by user')}
  res.redirect('/')
})
app.get('/logs/:id',(req,res)=>{
  const f=path.join(LOGS_ROOT,`${req.params.id}.log`)
  if(!fs.existsSync(f)) return res.send('No logs')
  res.type('text/plain').send(fs.readFileSync(f,'utf8'))
})
app.get('/delete/:id',(req,res)=>{
  const b=activeBots.get(req.params.id)
  if(b){try{b.kill()}catch{} activeBots.delete(req.params.id)}
  try{fs.rmSync(path.join(SESSIONS_ROOT,req.params.id),{recursive:true,force:true})}catch{}
  res.redirect('/')
})

app.listen(PORT,HOST,()=>{console.log(`Manager running on http://${HOST}:${PORT}`)})