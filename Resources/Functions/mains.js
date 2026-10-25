// Breaker-Ultra MD - mains.js
// Fixed by - MATSKEN Error Fix
// Node 20+ , Baileys Latest

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const path = require('path')

const SESSION_DIR = './session'
const PREFIX = '.'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
    },
    browser: ['Breaker-Ultra MD', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = reason !== DisconnectReason.loggedOut
      console.log('Connection closed, reason:', reason, 'Reconnecting:', shouldReconnect)
      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000)
      } else {
        console.log('Logged out, delete session folder and pair again')
      }
    } else if (connection === 'open') {
      console.log('✅ Breaker-Ultra MD is Online!')
    }
  })

  // MESSAGE HANDLER
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message) return
      if (msg.key.fromMe) return

      const from = msg.key.remoteJid
      const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ''
      
      if (!body.startsWith(PREFIX)) return

      const args = body.slice(1).trim().split(/ +/)
      const command = args.shift().toLowerCase()

      console.log(`[CMD] ${command} from ${from}`)

      // Load commands from /commands folder
      const cmdPath = path.join(__dirname, 'commands', `${command}.js`)
      if (fs.existsSync(cmdPath)) {
        delete require.cache[require.resolve(cmdPath)]
        const cmd = require(cmdPath)
        await cmd(sock, msg, args, from)
      } else {
        // Built-in commands
        switch(command) {
          case 'ping':
            await sock.sendMessage(from, { text: 'Pong! ⚡ Breaker-Ultra MD is active' }, { quoted: msg })
            break
          case 'menu':
            const menu = `╭─── *BREAKER-ULTRA MD* ───
│ Prefix: ${PREFIX}
│ Owner: MATSKEN
│ Mode: Public
╰────────────────
╭─── *MAIN* ───
│ .ping
│ .menu
│ .vcf
│ .owner
╰────────────────`
            await sock.sendMessage(from, { text: menu }, { quoted: msg })
            break
          case 'vcf':
            await sock.sendMessage(from, { text: `Your VCF site:\nhttps://er-vcf.vercel.app` }, { quoted: msg })
            break
          case 'owner':
            await sock.sendMessage(from, { text: `Owner: wa.me/256791163270` }, { quoted: msg })
            break
        }
      }
    } catch (e) {
      console.log('Error in message handler (ignored):', e.message)
    }
  })
}

// === THIS WAS YOUR ERROR - FIXED HERE ===
const mainsHandler = startBot

module.exports = mainsHandler
module.exports.mainsHandler = mainsHandler
module.exports.default = mainsHandler
module.exports.startBot = startBot

// Auto start when file is run directly
if (require.main === module) {
  startBot()
}