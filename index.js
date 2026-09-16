const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const fs = require('fs')
const path = require('path')
const settings = require('./settings')

const app = express()
const PORT = settings.port

// Pair.html server
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'))
})
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(settings.sessionName)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: !settings.usePairingCode,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
    }
  })

  // Pairing Code Logic
  if (settings.usePairingCode && !sock.authState.creds.registered) {
    const phoneNumber = settings.ownerNumber[0].replace(/[^0-9]/g, '')
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber)
        code = code.match(/.{1,4}/g).join('-')
        console.log(`\n[ PAIRING CODE ] : ${code}\nGo to WhatsApp > Linked Devices > Link with phone number\n`)
      } catch (e) {
        console.log('Failed to get pairing code:', e)
      }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed, reconnecting:', shouldReconnect)
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log(`✅ ${settings.botName} Connected Successfully!`)
    }
  })

  // Simple Message Handler
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.remoteJid === 'status@broadcast') return
      
      const from = msg.key.remoteJid
      const type = Object.keys(msg.message)[0]
      const body = (type === 'conversation') ? msg.message.conversation : 
                   (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : ''
      
      if (!body.startsWith(settings.prefix)) return
      
      const args = body.slice(settings.prefix.length).trim().split(/ +/)
      const command = args.shift().toLowerCase()

      // ---- COMMANDS ----
      if (command === 'ping') {
        await sock.sendMessage(from, { text: `*Pong!* _${settings.botName} is alive_\nSpeed: fast` }, { quoted: msg })
      }
      if (command === 'alive') {
        await sock.sendMessage(from, { text: `*${settings.botName}*\n\nOfficial Multi-Device WhatsApp Bot\nFast, Secure, Reliable & Most Powerful\n\nOwner: ${settings.ownerName}` }, { quoted: msg })
      }
      
    } catch (err) {
      console.log('Message Error:', err)
    }
  })
}

startBot()

// Anti-crash
process.on('uncaughtException', (err) => console.log('Uncaught:', err))
process.on('unhandledRejection', (err) => console.log('Unhandled:', err))
