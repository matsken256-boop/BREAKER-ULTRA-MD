const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const settings = require('./settings')

async function startBot() {
 const { version } = await fetchLatestBaileysVersion()
 const { state, saveCreds } = await useMultiFileAuthState('auth_info')
 const sock = makeWASocket({
   version,
   auth: state,
   logger: P({ level: 'silent' }),
   browser: [settings.botName, "Chrome", "1.0.0"],
   printQRInTerminal: false,
   syncFullHistory: false
 })
 sock.ev.on('creds.update', saveCreds)

 if (!sock.authState.creds.registered) {
   const phoneNumber = settings.phoneNumber.replace(/[^0-9]/g, '')
   console.log(`[BREAKER] Waiting 8 seconds to stabilize...`)
   await new Promise(r => setTimeout(r, 8000))
   try {
     console.log(`[BREAKER] Requesting Pairing Code for ${phoneNumber}...`)
     const code = await sock.requestPairingCode(phoneNumber)
     console.log(`\n========================\nYOUR PAIRING CODE: ${code}\nDO NOT RESTART! LINK NOW!\n========================\n`)
   } catch (e) {
     console.log("Pairing Failed:", e.message)
     console.log("Retrying in 10 sec...")
     setTimeout(()=> startBot(), 10000)
   }
 }

 sock.ev.on('connection.update', async (update) => {
   const { connection, lastDisconnect } = update
   console.log("Connection:", connection)
   if (connection === 'close') {
     const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
     if (shouldReconnect) {
       console.log("Reconnecting...")
       setTimeout(()=> startBot(), 3000)
     }
   } else if (connection === 'open') {
     console.log(`✅✅ ${settings.botName} ONLINE & LINKED! ✅✅✅`)
   }
 })

 sock.ev.on('messages.upsert', async (m) => {
   try {
     const msg = m.messages[0]
     if (!msg.message || msg.key.fromMe) return
     const from = msg.key.remoteJid
     const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
     if (!body.startsWith(settings.prefix)) return
     const args = body.slice(settings.prefix.length).trim().split(/ +/)
     const command = args.shift().toLowerCase()
     if (command === 'ping') {
       await sock.sendMessage(from, { text: `Pong! ⚡\nBot: ${settings.botName}\nOwner: ${settings.ownerName}` })
     }
     if (command === 'menu') {
       await sock.sendMessage(from, { text: `*${settings.botName}* by ${settings.ownerName}\n\n.ping\n.menu\n.owner` })
     }
   } catch (e) { console.log(e) }
 })
}
startBot()
