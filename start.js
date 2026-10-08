const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

const SESSION_DIR = path.join(__dirname, 'Sessions', 'breaker')
const PAIR_FILE = path.join(__dirname, 'pair_code.txt')

async function startBot(phoneNumber) {
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

  // PAIRING CODE - REAL ONE
  if (!sock.authState.creds.registered) {
    const num = phoneNumber.replace(/[^0-9]/g, '')
    if (num) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        global.pairCode = code
        fs.writeFileSync(PAIR_FILE, code)
        console.log('')
        console.log('========================================')
        console.log(' BREAKER-ULTRA MD v2.7.0')
        console.log(' REAL PAIR CODE: ' + code)
        console.log(' FOR NUMBER: ' + num)
        console.log(' Enter in WhatsApp > Linked Devices')
        console.log(' > Link with phone number')
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
      console.log('[BREAKER] Connected as BREAKER-ULTRA MD')
      global.pairCode = null
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}

      // YOUR BOT LOGIC STARTS HERE - load handlers
      try {
        const handler = path.join(__dirname, 'Resources', 'Functions', 'mains.js')
        if (fs.existsSync(handler)) {
          require(handler)(sock)
        }
      } catch {}
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log('[BREAKER] Closed, reason:', reason)
      if (reason!== DisconnectReason.loggedOut) {
        console.log('[BREAKER] Reconnecting...')
        setTimeout(() => startBot(phoneNumber), 3000)
      } else {
        console.log('[BREAKER] Logged out, delete Sessions/breaker')
        try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }) } catch {}
      }
    }
  })

  // MESSAGE HANDLER EXAMPLE
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    const from = m.key.remoteJid

    if (text.toLowerCase() === '.ping' || text.toLowerCase() === '.alive') {
      await sock.sendMessage(from, { text: '⚡ *BREAKER-ULTRA MD v2.7.0*\nBOX: UNLOCKED\nStatus: Online\nOwner: BREAKER\n\nType.menu for commands' })
    }
    if (text.toLowerCase() === '.menu') {
      await sock.sendMessage(from, { text:
`⚡ *BREAKER-ULTRA MD MENU*

🔹.ping - check alive
🔹.menu - this menu
🔹.owner - owner
🔹.pair - pair info

_Bot is clean pro, no locker_
` })
    }
  })

  return sock
}

module.exports = startBot

// If run directly: node start.js 2567xxxxxxx
if (require.main === module) {
  const num = process.argv[2]
  if (!num) console.log('Usage: node start.js 2567xxxxxxx')
  else startBot(num)
}