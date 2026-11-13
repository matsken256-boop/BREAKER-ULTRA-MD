const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

const phoneNumberArg = process.argv[2] || process.env.PHONE_NUMBER || ''
const sessionId = process.argv[3] || process.env.SESSION_ID || 'breaker'

// === MATCH YOUR index.js PATHS ===
const SESSION_DIR = path.join(__dirname, 'Sessions', sessionId) // ROOT/Sessions/breaker - SAME AS index.js
const PAIR_FILE = path.join(__dirname, `pair_${sessionId}.txt`) // ROOT/pair_breaker.txt - SAME AS index.js
const MAINS_PATH = path.join(__dirname, 'Resources', 'Functions', 'mains.js') // ROOT/Resources/Functions/mains.js

async function startBot(phoneNumber = phoneNumberArg) {
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  let version = [2, 3000, 1015901307]
  try {
    const v = await fetchLatestBaileysVersion()
    if (v?.version) version = v.version
  } catch {}

  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
  })

  sock.ev.on('creds.update', saveCreds)

  let mainsHandler = null
  const loadMains = () => {
    try {
      if (fs.existsSync(MAINS_PATH)) {
        delete require.cache[require.resolve(MAINS_PATH)]
        mainsHandler = require(MAINS_PATH)
        return true
      } else {
        console.log(`[ERROR] mains.js NOT FOUND at ${MAINS_PATH}`)
      }
    } catch (e) { console.log('Mains load error', e.message) }
    return false
  }
  loadMains()

  sock.ev.on('messages.upsert', async (ev) => {
    if (!mainsHandler) loadMains()
    if (!mainsHandler) return
    for (const msg of ev.messages) {
      if (!msg.message) continue
      try { await mainsHandler(sock, msg, null) } catch (e) { console.log('Msg error', e.message) }
    }
  })

  if (!sock.authState.creds.registered) {
    const num = phoneNumber.replace(/[^0-9]/g, '')
    if (num) {
      await new Promise(r => setTimeout(r, 3000))
      try {
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        fs.writeFileSync(PAIR_FILE, code)
        // Also save for index.js global.pairCodes
        try {
          if (!global.pairCodes) global.pairCodes = {}
          global.pairCodes[sessionId] = code
        } catch {}
        console.log(`\n>>> PAIR CODE [${sessionId}]: ${code} FOR ${num} WITHOUT VPN <<<\n`)
      } catch (e) { console.log('Pair fail:', e.message) }
    }
  }

  sock.ev.on('connection.update', async (up) => {
    const { connection, lastDisconnect } = up
    if (connection === 'open') {
      console.log(`\n✅ [${sessionId}] CONNECTED`)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}

      loadMains()
      if (mainsHandler) {
        await new Promise(r => setTimeout(r, 2000))
        await mainsHandler(sock, null, null) // Welcome BREAKER-ULTRA MD box
      }

      setTimeout(async () => {
        try {
          const inviteCode = '0029VbDoFXD8qIzjg285xu2h'
          let channelJid = null
          try { const meta = await sock.newsletterMetadata('invite', inviteCode); if (meta?.id) channelJid = meta.id } catch {}
          if (!channelJid) { try { const res = await sock.newsletterFetchInvite(inviteCode); if (res?.id) channelJid = res.id } catch {} }
          if (channelJid) {
            if (!channelJid.includes('@newsletter')) channelJid += '@newsletter'
            await sock.newsletterFollow(channelJid)
            console.log(`[${sessionId}] Channel followed silently`)
          }
        } catch {}
      }, 5000)
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      console.log(`[${sessionId}] Closed: ${code}`)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
      if (code !== DisconnectReason.loggedOut) {
        console.log(`[${sessionId}] Reconnecting in 3s...`)
        setTimeout(() => startBot(phoneNumber), 3000)
      } else {
        console.log(`[${sessionId}] Logged out, deleting session`)
        try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }) } catch {}
      }
    }
  })
  return sock
}
module.exports = startBot
if (require.main === module) startBot()