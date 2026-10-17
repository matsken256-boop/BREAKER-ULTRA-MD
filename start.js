const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
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
  
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'], // SAME AS WORKING BOT
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  sock.ev.on('creds.update', saveCreds)

  // SAME TIMING AS WORKING BOT - WAIT 3 SEC FOR WS
  if (!sock.authState.creds.registered) {
    const num = phoneNumber.replace(/[^0-9]/g, '')
    if (num) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        fs.writeFileSync(PAIR_FILE, code)
        console.log(`\n>>> WORKING PAIR CODE: ${code} FOR ${num} <<<\n`)
      } catch (e) {
        console.log('Pair error:', e.message)
      }
    }
  }

  sock.ev.on('connection.update', async (up) => {
    const { connection, lastDisconnect } = up
    if (connection === 'open') {
      console.log(`[${sessionId}] ✅ CONNECTED`)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
      if (reason !== DisconnectReason.loggedOut) setTimeout(() => startBot(phoneNumber), 3000)
      else try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }) } catch {}
    }
  })
  return sock
}

module.exports = startBot
if (require.main === module) startBot(phoneNumberArg)
