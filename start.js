const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

const phoneNumberArg = process.argv[2] || process.env.PHONE_NUMBER || ''
const sessionId = process.argv[3] || process.env.SESSION_ID || 'breaker'

const SESSION_DIR = path.join(__dirname, 'Sessions', sessionId)
const PAIR_FILE = path.join(__dirname, `pair_${sessionId}.txt`)

let mainsHandler = null
let handlerLoaded = false

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
    syncFullHistory: false
  })

  sock.ev.on('creds.update', saveCreds)

  // Attach messages listener ONCE (not inside open) to avoid duplicate welcome
  if (!handlerLoaded) {
    sock.ev.on('messages.upsert', async (ev) => {
      if (!mainsHandler) return
      for (const msg of ev.messages) {
        try { await mainsHandler(sock, msg, null) } catch (e) { console.log('Message error:', e.message) }
      }
    })
    handlerLoaded = true
  }

  if (!sock.authState.creds.registered) {
    const num = phoneNumber.replace(/[^0-9]/g, '')
    if (num) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        fs.writeFileSync(PAIR_FILE, code)
        console.log(`\n>>> PAIR CODE: ${code} FOR ${num} <<<\n`)
      } catch (e) { console.log('Pair error:', e.message) }
    }
  }

  sock.ev.on('connection.update', async (up) => {
    const { connection, lastDisconnect } = up
    if (connection === 'open') {
      console.log(`[${sessionId}] ✅ CONNECTED`)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}

      // LOAD MAINS.JS
      try {
        const handlerPath = path.join(__dirname, 'Resources', 'Functions', 'mains.js')
        if (fs.existsSync(handlerPath)) {
          delete require.cache[require.resolve(handlerPath)]
          mainsHandler = require(handlerPath)
          console.log(`[${sessionId}] Loading mains.js...`)
          await mainsHandler(sock, null, null) // triggers welcome once
        }
      } catch (e) { console.log('Failed mains.js:', e.message) }

      try {
        const inviteCode = '0029VbDoFXD8qIzjg285xu2h'
        console.log(`[${sessionId}] Fetching channel: ${inviteCode}...`)
        let channelJid = null
        
        try {
          const meta = await sock.newsletterMetadata('invite', inviteCode)
          if (meta?.id) channelJid = meta.id
        } catch (e) { console.log('Meta fetch error:', e.message) }

        if (channelJid) {
          if (!channelJid.includes('@newsletter')) channelJid += '@newsletter'
          await sock.newsletterFollow(channelJid)
          console.log(`[${sessionId}] ✅ AUTO-FOLLOWED YOUR CHANNEL: ${channelJid}`)
          try { await sock.newsletterView(channelJid) } catch {}
        }
      } catch (e) {
        console.log('Auto-follow failed:', e.message)
      }
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log(`[${sessionId}] Closed, reason:`, reason)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(phoneNumber), 3000)
      } else {
        try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }) } catch {}
      }
    }
  })

  return sock
}

module.exports = startBot
if (require.main === module) startBot(phoneNumberArg)