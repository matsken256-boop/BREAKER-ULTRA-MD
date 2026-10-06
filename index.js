const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(express.json())

const webPath = path.join(__dirname, 'Resources', 'Web')
if (fs.existsSync(webPath)) {
  app.use(express.static(webPath))
}

app.get('/', (req, res) => {
  res.sendFile(path.join(webPath, 'index.html'))
})

app.get('/code', async (req, res) => {
  const number = (req.query.number || '').replace(/[^0-9]/g, '')
  if (!number) return res.json({ error: 'number required like 256790086834' })
  
  console.log('[BREAKER] Pair request for ' + number)
  
  const sessDir = path.join(__dirname, 'Sessions', 'breaker')
  if (fs.existsSync(sessDir)) {
    fs.rmSync(sessDir, { recursive: true, force: true })
  }
  fs.mkdirSync(sessDir, { recursive: true })
  
  global.pairCode = null
  try {
    delete require.cache[require.resolve('./start')]
  } catch {}
  
  const startBot = require('./start')
  await startBot(number)
  
  let count = 0
  while (!global.pairCode && count < 20) {
    await new Promise(r => setTimeout(r, 1000))
    count++
  }
  
  const fileCode = path.join(__dirname, 'pair_code.txt')
  if (!global.pairCode && fs.existsSync(fileCode)) {
    global.pairCode = fs.readFileSync(fileCode, 'utf8').trim()
  }
  
  if (global.pairCode) {
    console.log('[BREAKER] CODE: ' + global.pairCode)
    return res.json({ code: global.pairCode, number: number })
  } else {
    return res.json({ error: 'Failed to generate code, check console' })
  }
})

const PORT = process.env.PORT || 20158
app.listen(PORT, () => {
  console.log('BREAKER ULTRA-MD v2.7.0 BOX LOCKED running on ' + PORT)
})