const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const settings = require('./settings')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: [settings.botName, "Chrome", "1.0.0"]
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Reconnecting:', shouldReconnect)
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log(`✅ ${settings.botName} ONLINE!`)
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if(!msg.message) return
            const from = msg.key.remoteJid
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
            if(!body.startsWith(settings.prefix)) return
            const args = body.slice(settings.prefix.length).trim().split(/ +/)
            const command = args.shift().toLowerCase()

            if(command === 'ping') {
                await sock.sendMessage(from, { text: `*Pong!* 🏓\nSpeed: Fast\nBot: ${settings.botName}` })
            }
            if(command === 'menu') {
                await sock.sendMessage(from, {
                    image: fs.readFileSync('./logo.jpg'),
                    caption: `*${settings.botName}*\n*by ${settings.ownerName} tech*\n\n*COMMANDS:*\n.ping - Check speed\n.menu - This logo menu\n.owner - Owner info\n\n_© Matsken Tech_`
                })
            }
            if(command === 'owner') {
                await sock.sendMessage(from, {
                    image: fs.readFileSync('./logo.jpg'),
                    caption: `*Owner:* ${settings.ownerName}\n*Bot:* ${settings.botName}\n*Number:* ${settings.ownerNumber}`
                })
            }
        } catch(e) { console.log(e) }
    })
}
startBot()
