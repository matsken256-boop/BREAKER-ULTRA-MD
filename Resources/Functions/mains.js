// Breaker-Ultra MD - mains.js
// Original - by MATSKEN
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
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed, reconnecting:', shouldReconnect)
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('✅ Breaker-Ultra MD is Online!')
      // Send online message to yourself
      // await sock.sendMessage(sock.user.id, { text: 'Breaker-Ultra MD Online 🔥' })
    }
  })

  // MESSAGE HANDLER
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return
      
      const from = msg.key.remoteJid
      const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
      if (!body.startsWith(PREFIX)) return

      const args = body.slice(1).trim().split(/ +/)
      const command = args.shift().toLowerCase()

      // Load commands from /commands folder
      const cmdPath = path.join(__dirname, 'commands', `${command}.js`)
      if (fs.existsSync(cmdPath)) {
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
│ .vcf - your VCF site link
│ .owner
╰────────────────`
            await sock.sendMessage(from, { text: menu }, { quoted: msg })
            break
          case 'vcf':
            await sock.sendMessage(from, { text: `Your VCF site:\nhttps://er-vcf.vercel.app\nRegistered: Use admin link` }, { quoted: msg })
            break
        }
      }
    } catch (e) {
      console.log('Error in message handler:', e)
    }
  })
}

module.exports = mainsHandler
module.exports.mainsHandler = mainsHandler
module.exports.default = mainsHandler