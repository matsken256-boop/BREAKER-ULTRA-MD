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
const VERSION = '2.7.0'

const ROOT = __dirname
const SESSIONS_ROOT = path.join(ROOT, 'Sessions')
const LOGS_ROOT = path.join(ROOT, 'Logs')
const WEB_ROOT = path.join(ROOT, 'Resources', 'Web')

if (!fs.existsSync(SESSIONS_ROOT)) fs.mkdirSync(SESSIONS_ROOT, { recursive: true })
if (!fs.existsSync(LOGS_ROOT)) fs.mkdirSync(LOGS_ROOT, { recursive: true })

const activeBots = new Map()

function getTime() {
  return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
}

function logger(sessionId, msg) {
  const logFile = path.join(LOGS_ROOT, `${sessionId || 'manager'}.log`)
  const line = `[${getTime()}] ${msg}\n`
  console.log(line.trim())
  try { fs.appendFileSync(logFile, line) } catch {}
}

function getSessions() {
  if (!fs.existsSync(SESSIONS_ROOT)) return []
  return fs.readdirSync(SESSIONS_ROOT).filter(f => {
    const p = path.join(SESSIONS_ROOT, f)
    return fs.statSync(p).isDirectory()
  })
}

function startSession(sessionId, phoneNumber = null) {
  if (activeBots.has(sessionId)) {
    try { activeBots.get(sessionId).kill() } catch {}
    activeBots.delete(sessionId)
  }

  const sessionPath = path.join(SESSIONS_ROOT, sessionId)
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true })

  const args = [path.join(ROOT, 'start.js')]
  if (phoneNumber) args.push(phoneNumber, sessionId)

  logger(sessionId, `Starting session ${sessionId} ${phoneNumber? 'for ' + phoneNumber : ''}`)

  const bot = spawn('node', args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {...process.env, SESSION_ID: sessionId, PHONE_NUMBER: phoneNumber || '' }
  })

  activeBots.set(sessionId, bot)

  bot.stdout.on('data', d => logger(sessionId, d.toString().trim()))
  bot.stderr.on('data', d => logger(sessionId, `ERROR: ${d.toString().trim()}`))

  bot.on('close', code => {
    logger(sessionId, `Session ${sessionId} exited with code ${code}`)
    activeBots.delete(sessionId)
    if (code!== 0 && code!== 1) {
      logger(sessionId, `Auto-restarting ${sessionId} in 3s...`)
      setTimeout(() => startSession(sessionId), 3000)
    }
  })

  return bot
}

// WEB DASHBOARD
if (fs.existsSync(WEB_ROOT)) {
  app.use(express.static(WEB_ROOT))
}

app.get('/', (req, res) => {
  const sessions = getSessions()
  const indexFile = path.join(WEB_ROOT, 'index.html')
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile)

  res.send(`
  <html><head><title>BREAKER-ULTRA MD v${VERSION}</title>
  <style>body{background:#0a0a0a;color:#00ff88;font-family:monospace;padding:20px}
 .card{border:1px solid #00ff88;padding:15px;margin:10px 0;border-radius:8px}
  a{color:#00ff88} input{padding:10px;background:#111;color:#0f8;border:1px solid #0f8}
  button{padding:10px 20px;background:#00ff88;color:#000;border:0;cursor:pointer;font-weight:bold}
  </style></head><body>
  <h1>⚡ BREAKER-ULTRA MD v${VERSION}</h1>
  <h3>MULTI-SESSION MANAGER - BOX UNLOCKED</h3>
  <div class="card">
    <h3>PAIR NEW BOT</h3>
    <form action="/code" method="get">
      <input name="number" placeholder="2567XXXXXXXX" required style="width:250px">
      <input name="session" placeholder="session name (optional)" style="width:200px">
      <button type="submit">GET PAIR CODE</button>
    </form>
    <p>Example: /code?number=2567XXXXXXXX&session=breaker1</p>
  </div>
  <div class="card">
    <h3>ACTIVE SESSIONS (${sessions.length}) - ${activeBots.size} running</h3>
    ${sessions.map(s => `<div>📁 ${s} - ${activeBots.has(s)? '🟢 ONLINE' : '🔴 OFFLINE'}
    <a href="/start/${s}">[START]</a> <a href="/stop/${s}">[STOP]</a> <a href="/logs/${s}">[LOGS]</a> <a href="/delete/${s}">[DELETE]</a></div>`).join('') || 'No sessions yet'}
  </div>
  <div class="card"><a href="/sessions">/sessions JSON</a> | <a href="/status">/status</a> | Timezone: ${TIMEZONE}</div>
  </body></html>
  `)
})

app.get('/code', async (req, res) => {
  let number = (req.query.number || '').replace(/[^0-9]/g, '')
  let sessionId = (req.query.session || '').replace(/[^a-zA-Z0-9_-]/g, '') || `breaker_${number.slice(-4)}_${Date.now().toString().slice(-4)}`

  if (!number) return res.status(400).json({ error: 'Add?number=2567XXXXXXXX' })

  const sessPath = path.join(SESSIONS_ROOT, sessionId)
  if (fs.existsSync(sessPath)) {
    try { fs.rmSync(sessPath, { recursive: true, force: true }) } catch {}
  }
  fs.mkdirSync(sessPath, { recursive: true })

  global.pairCodes = global.pairCodes || {}
  global.pairCodes[sessionId] = null

  logger(sessionId, `Pair request for ${number} session ${sessionId}`)

  // Start bot to generate code
  startSession(sessionId, number)

  // Wait for code
  let tries = 0
  while (!global.pairCodes[sessionId] && tries < 25) {
    const codeFile = path.join(ROOT, `pair_${sessionId}.txt`)
    if (fs.existsSync(codeFile)) {
      global.pairCodes[sessionId] = fs.readFileSync(codeFile, 'utf8').trim()
      try { fs.unlinkSync(codeFile) } catch {}
      break
    }
    await new Promise(r => setTimeout(r, 1000))
    tries++
  }

  const code = global.pairCodes[sessionId]
  if (code) {
    return res.json({
      success: true,
      session: sessionId,
      number,
      code,
      message: 'Enter this code in WhatsApp > Linked Devices > Link with phone number',
      pair_instructions: 'WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number',
      dashboard: `/${sessionId}`
    })
  }
  return res.json({ success: false, error: 'Failed to generate, check logs', session: sessionId, logs: `/logs/${sessionId}` })
})

app.get('/sessions', (req, res) => {
  const list = getSessions().map(id => ({
    id,
    online: activeBots.has(id),
    path: path.join(SESSIONS_ROOT, id)
  }))
  res.json({ total: list.length, running: activeBots.size, sessions: list })
})

app.get('/status', (req, res) => res.json({ bot: `BREAKER-ULTRA MD v${VERSION}`, multisession: true, total: getSessions().length, running: activeBots.size, timezone: TIMEZONE, uptime: process.uptime() }))

app.get('/start/:id', (req, res) => {
  startSession(req.params.id)
  res.redirect('/')
})

app.get('/stop/:id', (req, res) => {
  const bot = activeBots.get(req.params.id)
  if (bot) { bot.kill(); activeBots.delete(req.params.id); logger(req.params.id, 'Stopped by