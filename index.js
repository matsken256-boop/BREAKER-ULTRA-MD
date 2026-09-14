
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const settings = require('./settings')

async function startBot() {
 const { state, saveCreds } = await useMultiFileAuthState('auth_info')
 const sock = makeWASocket({
   auth: state,
   logger: P({ level: 'silent' }),
   browser: [settings.botName, "Chrome", "1.0.0"]
 })
 sock.ev.on('creds.update', saveCreds)

 // PAIRING CODE LOGIC - FIXED FOR KATABUMP
 if (!sock.authState.creds.registered) {
   const phoneNumber = settings.phoneNumber.replace(/[^0-9]/g, '')
   console.log(`\n[BREAKER] Not linked! Requesting Pairing Code for ${phoneNumber}...\n`)
   await new Promise(r => setTimeout(r, 3000))
   try {
     const code = await sock.requestPairingCode(phoneNumber)
     console.log(`\n========================\nYOUR PAIRING CODE: ${code}\nNUMBER: ${phoneNumber}\n========================\nGo to WhatsApp > Linked Devices > Link with phone number\n`)
   } catch (e) {
     console.log("Failed:", e.message)
   }
 }

 sock.ev.on('connection.update', (update) => {
   const { connection, lastDisconnect } = update
   if (connection === 'close') {
     const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
     if (shouldReconnect) startBot()
   } else if (connection === 'open') {
     console.log(`✅ ${settings.botName} ONLINE!`)
   }
 })

 sock.ev.on('messages.upsert', async (m) => {
   try {
     const msg = m.messages[0]
     if (!msg.message) return
     const from = msg.key.remoteJid
     const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
     if (!body.startsWith(settings.prefix)) return
     const args = body.slice(settings.prefix.length).trim().split(/ +/)
     const command = args.shift().toLowerCase()

     if (command === 'ping') {
       await sock.sendMessage(from, { text: `Pong! ⚡ Speed: Fast\nBot: ${settings.botName}` })
     }
     if (command === 'menu') {
       await sock.sendMessage(from, { image: fs.readFileSync('./logo.jpg'), caption: `*${settings.botName}* by ${settings.ownerName}\n\nCOMMANDS:\n.ping - Check speed\n.menu - This menu\n.owner - Owner info` })
     }
     if (command === 'owner') {
       await sock.sendMessage(from, { image: fs.readFileSync('./logo.jpg'), caption: `Owner: ${settings.ownerName}\nNumber: ${settings.ownerNumber}\nBot: ${settings.botName}` })
     }
   } catch (e) { console.log(e) }
 })
}
startBot()
