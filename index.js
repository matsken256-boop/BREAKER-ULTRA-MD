const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const settings = require('./settings')
const readline = require('readline')

const question = (text) => {
 const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
 return new Promise((resolve) => rl.question(text, (ans) => { rl.close(); resolve(ans) }))
}

async function startBot() {
 const { state, saveCreds } = await useMultiFileAuthState('auth_info')
 const sock = makeWASocket({
   auth: state,
   logger: P({ level: 'silent' }),
   browser: [settings.botName, "Chrome", "1.0.0"]
 })

 sock.ev.on('creds.update', saveCreds)

 // PAIRING CODE LOGIC FOR KATABUMP
 if (!sock.authState.creds.registered) {
   console.log("\n[BREAKER] Bot not linked! Waiting to request Pairing Code...\n")
   // Change this to your number, no + , no spaces
   let phoneNumber = await question("Enter your WhatsApp number (e.g 2567XXXXXXXX): ")
   phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
   const code = await sock.requestPairingCode(phoneNumber)
   console.log(`\n===========================\nYOUR PAIRING CODE: ${code}\n===========================\nGo to WhatsApp > Linked Devices > Link with phone number > Enter this code\n`)
 }

 sock.ev.on('connection.update', (update) => {
   const { connection, lastDisconnect } = update
   if (connection === 'close') {
     const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
     console.log(`Reconnecting: ${shouldReconnect}`)
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
       await sock.sendMessage(from, {
         image: fs.readFileSync('./logo.jpg'),
         caption: `*${settings.botName}* by ${settings.ownerName} tech\n\nCOMMANDS:\n.ping - Check speed\n.menu - This menu\n.owner - Owner info`
       })
     }
     if (command === 'owner') {
       await sock.sendMessage(from, {
         image: fs.readFileSync('./logo.jpg'),
         caption: `Owner: ${settings.ownerName}\nBot: ${settings.botName}\nNumber: ${settings.ownerNumber}`
       })
     }
   } catch (e) { console.log(e) }
 })
}

startBot()
