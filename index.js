const express = require('express')
const fs = require('fs')
const path = require('path')
const os = require('os')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 20158
const HOST = '0.0.0.0'

const LOCK_FILE = path.join(__dirname, '.breaker.lock')
if (fs.existsSync(LOCK_FILE)) {
  try { fs.unlinkSync(LOCK_FILE) } catch {}
}
fs.writeFileSync(LOCK_FILE, String(Date.now()))

const webPath = path.join(__dirname, 'Resources', 'Web')
if (fs.existsSync(webPath)) {
  app.use(express.static(webPath))
}

app.get('/', (req, res) => {
  const indexFile = path.join(webPath, 'index.html')
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile)
  res.send('BREAKER ULTRA-MD v2.7.0 BOX LOCKED - Use /code?number=256790086834')
})

app.get('/code', async (req, res) => {
  const number = (req.query.number || '').replace(/[^0-9]/g, '')
  if (!number) return res.json({ error: 'number required like 256790086834' })

  const sessDir = path.join(__dirname, 'Sessions', 'breaker')
  try {
    if (fs.existsSync(sessDir)) fs.rmSync(sessDir, { recursive: true, force: true })
    fs.mkdirSync(sessDir, { recursive: true })
  } catch {}

  global.pairCode = null
  try { delete require.cache[require.resolve('./start')] } catch {}

  const startBot = require('./start')
  await startBot(number)

  let c = 0
 