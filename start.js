const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, delay, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const path = require('path')

const SESSION_DIR = path.join(__dirname, 'Sessions', 'breaker')
const CODE_FILE = path.join(__dirname, 'pair_code.txt')

async function startBot(phoneNumber) {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true })
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
    }
  })

  if (!sock.authState.creds.registered) {
    const num = phoneNumber? phoneNumber.replace(/[^0-9]/g, '') : null
    if (num) {
      await delay(3500)
      try {
        let code = await sock.requestPairingCode(num)
        code = code.match(/.{1,4}/g).join('-')
        fs.writeFileSync(CODE_FILE, code)
        global.pairCode = code
        console.log('REAL CODE FOR ' + num + ': ' + code)
      } catch (e) {
        console.log('Pair error: ' + e.message)
      }
    }
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = lastDisconnect? lastDisconnect.error.output.statusCode : 0
      if (reason === DisconnectReason.loggedOut) {
        if (fs.existsSync(SESSION_DIR)) {
          fs.rmSync(SESSION_DIR, { recursive: true, force: true })
        }
      }
      await delay(3000)
      startBot(phoneNumber)
    }
    if (connection === 'open') {
      console.log('BREAKER ULTRA-MD CONNECTED')
      if (fs.existsSync(CODE_FILE)) {
        fs.unlinkSync(CODE_FILE)
      }
      try {
        const breakerPath = path.join(__dirname, 'breaker.js')
        if (fs.existsSync(breakerPath)) {
          require('./breaker')(sock)
        }
      } catch {}
    }
  })

  global.sock = sock
  return sock
}

module.exports = startBot

if (require.main === module) {
  const num = process.argv[2]
  startBot(num)
}