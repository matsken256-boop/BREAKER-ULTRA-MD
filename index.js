const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
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
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Connection closed, reconnecting:', shouldReconnect)
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log(`✅ ${settings.botName} by ${settings.ownerName} is ONLINE!`)
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
                await sock.sendMessage(from, { text: `*Pong!* 🏓\n\n*Bot:* ${settings.botName}\n*Owner:* ${settings.ownerName}\n*Version:* ${settings.version}\n*Speed:* Super Fast ⚡` })
            }
            if(command === 'menu') {
                await sock.sendMessage(from, { text: `*${settings.botName} MENU*\n\n*Owner:* ${settings.ownerName}\n*Version:* ${settings.version}\n\n*COMMANDS:*\n${settings.prefix}ping - Check speed\n${settings.prefix}menu - This menu\n${settings.prefix}owner - Owner info\n\n_© Powered by Matsken_` })
            }
            if(command === 'owner') {
                await sock.sendMessage(from, { text: `*My Owner:* ${settings.ownerName}\n*Number:* wa.me/${settings.ownerNumber}\n*Bot:* ${settings.botName}` })
            }

        } catch(e) { console.log(e) }
    })
}

startBot()
