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

  // === MESSAGE LISTENER - PER SOCKET, NOT GLOBAL ===
  let mainsHandler = null
  sock.ev.on('messages.upsert', async (ev) => {
    if (!mainsHandler) {
      // lazy load if not loaded yet
      try {
        const handlerPath = path.join(__dirname, 'Resources', 'Functions', 'mains.js')
        if (fs.existsSync(handlerPath)) {
          delete require.cache[require.resolve(handlerPath)]
          mainsHandler = require(handlerPath)
        }
      } catch {}
    }
    if (!mainsHandler) return
    for (const msg of ev.messages) {
      try { 
        if (msg.message) await mainsHandler(sock, msg, null) 
      } catch (e) { 
        console.log('Message error:', e.message) 
      }
    }
  })

  // === PAIRING - NO VPN ===
  if (!sock.authState.creds.registered) {
    const num = phoneNumber.replace(/[^0-9]/g, '')
    if (num) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        fs.writeFileSync(PAIR_FILE, code)
        console.log(`\n>>> PAIR CODE [${sessionId}]: ${code} FOR ${num} <<<\n`)
        console.log(`>>> USE WITHOUT VPN <<<\n`)
      } catch (e) { 
        console.log('Pair error:', e.message)
        console.log('>>> TIP: Disconnect VPN and restart <<<\n')
      }
    }
  }

  // === CONNECTION ===
  sock.ev.on('connection.update', async (up) => {
    const { connection, lastDisconnect } = up

    if (connection === 'open') {
      console.log(`\n✅ [${sessionId}] CONNECTED`)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}

      // 1. LOAD MAINS FIRST (welcome message)
      try {
        const handlerPath = path.join(__dirname, 'Resources', 'Functions', 'mains.js')
        if (fs.existsSync(handlerPath)) {
          delete require.cache[require.resolve(handlerPath)]
          mainsHandler = require(handlerPath)
          console.log(`[${sessionId}] Loading mains.js...`)
          await new Promise(r => setTimeout(r, 2000))
          await mainsHandler(sock, null, null)
        }
      } catch (e) { console.log('Mains load failed:', e.message) }

      // 2. SILENT AUTO-FOLLOW - AFTER WELCOME, NO CHAT MESSAGE
      setTimeout(async () => {
        try {
          const inviteCode = '0029VbDoFXD8qIzjg285xu2h'
          let channelJid = null

          // Get channel ID silently
          try {
            if (typeof sock.newsletterMetadata === 'function') {
              const meta = await sock.newsletterMetadata('invite', inviteCode)
              if (meta?.id) channelJid = meta.id
            }
          } catch {}

          // Fallback if metadata fails
          if (!channelJid && typeof sock.newsletterFetchInvite === 'function') {
            try {
              const res = await sock.newsletterFetchInvite(inviteCode)
              if (res?.id) channelJid = res.id
            } catch {}
          }

          if (channelJid) {
            if (!channelJid.includes('@newsletter')) channelJid += '@newsletter'
            await sock.newsletterFollow(channelJid)
            // Silent - only console, no WhatsApp message
            console.log(`[${sessionId}] Followed channel silently`)
          }
        } catch (e) {
          // Completely silent fail - user never knows
          console.log(`[${sessionId}] Follow skip`)
        }
      }, 5000) // 5 sec after connect to ensure stable
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      console.log(`[${sessionId}] Closed: ${statusCode}`)
      try { if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE) } catch {}
      
      if (statusCode !== DisconnectReason.loggedOut) {
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
if (require.main === module) startBot(phoneNumberArg)