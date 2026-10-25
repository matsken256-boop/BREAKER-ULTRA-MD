const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

let config = {}
try { config = require('../../settings') } catch { try { config = require('../../settings.js') } catch { config = {} } }
config.ownerName = config.ownerName || 'Matsken'
config.botName = config.botName || 'Breaker-Ultra MD'
config.prefix = config.prefix || '.'

const SESSION_DIR = path.join(__dirname, '../../session')
const PLUGINS_DIR = path.join(__dirname, '../Plugins')
const PREFIX = config.prefix

console.log(`[mains.js] ${config.botName} by ${config.ownerName} - Loading...`)

async function startBot() {
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    
    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        syncFullHistory: false,
    })

    sock.ev.on('creds.update', saveCreds)

    // LOAD YOUR EVENTS
    let connectionHandler, messageHandler
    try {
        connectionHandler = require('../Events/connection.js')
        console.log('[mains.js] Loaded Events/connection.js ✅')
    } catch (e) {
        console.log('[mains.js] Failed to load connection.js:', e.message)
    }
    try {
        messageHandler = require('../Events/message.js')
        console.log('[mains.js] Loaded Events/message.js ✅')
    } catch (e) {
        console.log('[mains.js] No Events/message.js, using built-in handler')
    }

    sock.ev.on('connection.update', async (update) => {
        // Call your designed connection.js welcome handler
        if (connectionHandler) {
            try {
                await connectionHandler(sock, { 
                    update, 
                    start: () => startBot(), 
                    close: () => console.log('Closed') 
                })
            } catch (e) { console.log('connectionHandler error:', e.message) }
        }

        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut
            console.log(`Connection closed, code ${statusCode}, reconnect: ${shouldReconnect}`)
            if (shouldReconnect) setTimeout(() => startBot(), 3000)
            else console.log('❌ Logged out - delete session folder and pair again')
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        // If you have custom message.js, use it
        if (messageHandler) {
            try { return await messageHandler(sock, chatUpdate) } 
            catch (e) { console.log('messageHandler error:', e.message) }
        }

        // BUILT-IN FALLBACK - PUBLIC, LOADS PLUGINS
        try {
            const msg = chatUpdate.messages[0]
            if (!msg.message) return
            // For testing, allow fromMe - comment next line later if you want to ignore self
            // if (msg.key.fromMe) return

            const from = msg.key.remoteJid
            const pushName = msg.pushName || 'User'
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ''
            
            console.log(`[MSG] ${pushName}: ${body}`)
            if (!body.startsWith(PREFIX)) return

            const args = body.slice(PREFIX.length).trim().split(/ +/)
            const command = args.shift().toLowerCase()
            console.log(`[CMD] ${command} from ${pushName}`)

            // LOAD FROM Resources/Plugins - THIS WAS THE BUG
            const cmdFile = path.join(PLUGINS_DIR, `${command}.js`)
            if (fs.existsSync(cmdFile)) {
                console.log(`[PLUGINS] Loading ${command}.js`)
                delete require.cache[require.resolve(cmdFile)]
                const cmd = require(cmdFile)
                if (typeof cmd === 'function') { await cmd(sock, msg, args, from, { pushName, config }); return }
                if (cmd.execute) { await cmd.execute(sock, msg, args, from, { pushName, config }); return }
                if (cmd.default) { await cmd.default(sock, msg, args, from, { pushName, config }); return }
            }

            // Built-in commands - PUBLIC with auto user detection
            switch (command) {
                case 'ping': case 'p':
                    await sock.sendMessage(from, { text: `Pong! ⚡ *${config.botName}* is active\n\n👋 Hello *${pushName}*\n✅ Public bot working!\n\nPrefix: ${PREFIX}\nOwner: ${config.ownerName}` }, { quoted: msg })
                    break
                case 'menu':
                    const menu = `╭─── *${config.botName.toUpperCase()}* ───\n│ 👋 Hello *${pushName}*\n│ Prefix: ${PREFIX}\n│ Owner: ${config.ownerName}\n│ Mode: Public ✅\n╰────────────────\n╭─── *MAIN* ───\n│ ${PREFIX}ping\n│ ${PREFIX}menu\n│ ${PREFIX}vcf\n│ ${PREFIX}owner\n╰────────────────\n\n> Powered by ${config.ownerName}`
                    await sock.sendMessage(from, { text: menu }, { quoted: msg })
                    break
                case 'owner':
                    await sock.sendMessage(from, { text: `👑 Owner: ${config.ownerName}\n🤖 Bot: ${config.botName}\n\nYou: *${pushName}*` }, { quoted: msg })
                    break
                case 'vcf':
                    await sock.sendMessage(from, { text: `🌐 VCF: https://er-vcf.vercel.app\n\nRequested by: *${pushName}*` }, { quoted: msg })
                    break
            }
        } catch (e) {
            console.log('Handler error (ignored):', e.message)
        }
    })
}

const mainHandler = startBot
module.exports = mainHandler
module.exports.mainHandler = mainHandler
module.exports.default = mainHandler
module.exports.startBot = startBot

if (require.main === module) { startBot() }