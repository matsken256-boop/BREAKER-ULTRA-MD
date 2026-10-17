const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

// READ FROM index.js manager - THIS IS THE FIX
const phoneNumberArg = process.argv[2] || process.env.PHONE_NUMBER || ''
const sessionId = process.argv[3] || process.env.SESSION_ID || 'breaker'

const SESSION_DIR = path.join(__dirname, 'Sessions', sessionId)
const PAIR_FILE = path.join(__dirname, `pair_${sessionId}.txt`) // MATCHES index.js

async function startBot(phoneNumber = phoneNumberArg) {
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['BREAKER-ULTRA MD', 'Chrome', '2.7.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false
  })

  sock.ev.on('creds.update', saveCreds)

  // PAIRING CODE - NOW WRITES CORRECT FILE
  if (!sock.authState.creds.registered) {
    const num = phoneNumber.replace(/[^0-9]/g, '')
    if (num) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        
        // FIX 1: Write to correct file that index.js waits for
        fs.writeFileSync(PAIR_FILE, code)
        
        // FIX 2: Set global that index.js waits for
        global.pairCodes = global.pairCodes || {}
        global.pairCodes[sessionId] = code
        
        console.log('')
        console.log('========================================')
        console.log(' BREAKER-ULTRA MD v2.7.0')
        console.log(' SESSION: ' + sessionId)
        console.log(' REAL PAIR CODE: ' + code)
        console.log(' FOR NUMBER: ' + num)
        console.log(' FILE: ' + PAIR_FILE)
        console.log('========================================')
        console.log('')
      } catch (e) {
        console.log('[BREAKER] Pair error:', e.message)
      }
    }
  }

  sock.ev.on('connection.update', async (up) => {
    const { connection, lastDisconnect } = up
    if (connection === 'open') {
      console.log(`[${sessionId}] ✅ CONNECTED`)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
      try {
        const handler = path.join(__dirname, 'Resources', 'Functions', 'mains.js')
        if (fs.existsSync(handler)) require(handler)(sock)
      } catch {}
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log(`[${sessionId}] Closed, reason:`, reason)
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(phoneNumber), 3000)
      } else {
        try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }) } catch {}
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    const from = m.key.remoteJid
    if (text.toLowerCase() === '.ping') {
      await sock.sendMessage(from, { text: '⚡ BREAKER-ULTRA MD v2.7.0 ONLINE' })
    }
  })
  return sock
}

module.exports = startBot
if (require.main === module) {
  const num = process.argv[2]
  if (!num) console.log('Usage: node start.js 2567xxxxxxx breaker_1234')
  else startBot(num)
}