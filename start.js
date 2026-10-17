const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

const phoneNumberArg = process.argv[2] || process.env.PHONE_NUMBER || ''
const sessionId = process.argv[3] || process.env.SESSION_ID || 'breaker'

const SESSION_DIR = path.join(__dirname, 'Sessions', sessionId)
const PAIR_FILE = path.join(__dirname, `pair_${sessionId}.txt`)

async function startBot(phoneNumber = phoneNumberArg) {
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  // FIX: HARDCODED VERSION = NO NETWORK FETCH = INSTANT (2 sec saved)
  const sock = makeWASocket({
    version: [2, 3000, 1015901307],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['BREAKER-ULTRA MD', 'Chrome', '2.7.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    connectTimeoutMs: 60000
  })

  sock.ev.on('creds.update', saveCreds)

  // PAIRING CODE - FAST
  if (!sock.authState.creds.registered) {
    const num = phoneNumber.replace(/[^0-9]/g, '')
    if (num) {
      try {
        // FIX: 300ms NOT 3000ms
        await new Promise(r => setTimeout(r, 300))
        
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        
        // ONLY FILE WORKS ACROSS PROCESSES - global doesn't
        fs.writeFileSync(PAIR_FILE, code)
        
        console.log('')
        console.log('========================================')
        console.log(' BREAKER-ULTRA MD v2.7.0')
        console.log(' SESSION: ' + sessionId)
        console.log(' REAL PAIR CODE: ' + code)
        console.log(' FOR NUMBER: ' + num)
        console.log(' SAVED TO: Sessions/' + sessionId + '/')
        console.log('========================================')
        console.log('')
      } catch (e) {
        console.log('[BREAKER] Pair error:', e.message)
        // If error, delete empty session so index.js can retry
        try{ if(!fs.existsSync(path.join(SESSION_DIR,'creds.json'))) fs.rmSync(SESSION_DIR,{recursive:true,force:true}) }catch{}
      }
    }
  }

  sock.ev.on('connection.update', async (up) => {
    const { connection, lastDisconnect } = up
    if (connection === 'open') {
      console.log(`[${sessionId}] ✅ CONNECTED - SAVED IN Sessions/${sessionId}/creds.json`)
      // Delete pair file after success - this moves session to Sessions folder
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
      try {
        const handler = path.join(__dirname, 'Resources', 'Functions', 'mains.js')
        if (fs.existsSync(handler)) require(handler)(sock)
      } catch {}
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log(`[${sessionId}] Closed, reason:`, reason)
      // Clean pair file on close
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(phoneNumber), 3000)
      } else {
        console.log(`[${sessionId}] LOGGED OUT - Deleting session`)
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
      await sock.sendMessage(from, { text: '⚡ BREAKER-ULTRA MD v2.7.0 ONLINE - Session: ' + sessionId })
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
