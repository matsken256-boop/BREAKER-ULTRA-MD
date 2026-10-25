const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

const SESSION_DIR = path.join(__dirname, '../../session')
const PLUGINS_DIR = path.join(__dirname, '../Plugins')
const ROOT_DIR = path.join(__dirname, '../../')

const PREFIX = '.'
const BOT_NAME = 'Breaker-Ultra MD'
const OWNER_NAME = 'Matsken'
const VERSION = 'v2.7.0'

console.log(`[mains.js] ${BOT_NAME} by ${OWNER_NAME} - Public Mode`)

// FIND YOUR LOGO IN MAIN ROOT
function findLogo() {
    try {
        const files = fs.readdirSync(ROOT_DIR)
        console.log(`[mains.js] Checking root for logo:`, files.slice(0,20))
        // Look for logo, thumb, image, bot, icon
        const logoNames = ['logo', 'thumb', 'bot', 'image', 'icon', 'breaker', 'matsken']
        for (const file of files) {
            const lower = file.toLowerCase()
            const isMedia = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.mp4') || lower.endsWith('.webp')
            if (isMedia && logoNames.some(n => lower.includes(n))) {
                console.log(`[mains.js] Found logo: ${file}`)
                return path.join(ROOT_DIR, file)
            }
        }
        // Fallback: any jpg/png in root
        for (const file of files) {
            const lower = file.toLowerCase()
            if (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg')) {
                console.log(`[mains.js] Found fallback image: ${file}`)
                return path.join(ROOT_DIR, file)
            }
        }
        console.log(`[mains.js] No logo found in root`)
        return null
    } catch (e) {
        console.log(`[mains.js] Logo search error: ${e.message}`)
        return null
    }
}

async function startBot() {
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    
    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
        markOnlineOnConnect: true,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'connecting') {
            console.log(`\n╔══════════════════════════════╗\n║ ⚡ ${BOT_NAME} - CONNECTING  ║\n║ Owner: ${OWNER_NAME}\n║ Prefix: [ ${PREFIX} ]\n║ Mode: public\n║ Version: ${VERSION}\n╚══════════════════════════════╝\n`)
        }

        if (connection === 'open') {
            console.log(`✅ ${BOT_NAME} CONNECTED - ${sock.user.id}`)
            await sock.sendPresenceUpdate('available').catch(()=>{})

            // YOUR DESIGNED WELCOME - FIXED IN MAINS.JS, PUBLIC, WITH LOGO
            setTimeout(async () => {
                try {
                    const selfJid = sock.user.id
                    const botNameFromWA = sock.user.name || BOT_NAME
                    const platform = process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Katabump Panel'
                    const dateTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' EAT'

                    const welcomeMsg = `┌──『 ${BOT_NAME.toUpperCase()} 』──
│ » *Name:* ${botNameFromWA}
│ » *Owner:* ${OWNER_NAME}
│ » *Platform:* ${platform}
│ » *Prefix:* [ ${PREFIX} ]
│ » *Mode:* public ✅
│ » *Version:* ${VERSION}
│ » *Date & Time:* ${dateTime}
│
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└----------------

Type *${PREFIX}menu* to see all commands`

                    const logoPath = findLogo()
                    
                    if (logoPath && fs.existsSync(logoPath)) {
                        console.log(`Sending welcome WITH logo: ${logoPath}`)
                        await sock.sendMessage(selfJid, { 
                            image: fs.readFileSync(logoPath), 
                            caption: welcomeMsg 
                        })
                    } else {
                        console.log(`Sending welcome text only (no logo found)`)
                        await sock.sendMessage(selfJid, { text: welcomeMsg })
                    }
                    console.log(`✅ Welcome DM sent to self`)
                } catch (e) {
                    console.log(`❌ Welcome failed: ${e.message}`)
                }
            }, 3500)
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            const shouldReconnect = code !== DisconnectReason.loggedOut
            console.log(`Connection closed, code ${code}, reconnect: ${shouldReconnect}`)
            if (shouldReconnect) setTimeout(() => startBot(), 3000)
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0]
            if (!msg.message) return
            
            const from = msg.key.remoteJid
            const pushName = msg.pushName || 'User'
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ''
            
            if (!body.startsWith(PREFIX)) return

            console.log(`[MSG] ${pushName} (${from}): ${body}`)

            const args = body.slice(PREFIX.length).trim().split(/ +/)
            const command = args.shift().toLowerCase()
            console.log(`[CMD] ${command} from ${pushName}`)

            // LOAD ALL PLUGINS FROM Resources/Plugins - THIS IS WHERE menu.js and ping.js ARE
            const files = fs.existsSync(PLUGINS_DIR) ? fs.readdirSync(PLUGINS_DIR) : []
            console.log(`[PLUGINS] Found ${files.length} files in Plugins`)

            const cmdFile = path.join(PLUGINS_DIR, `${command}.js`)
            if (fs.existsSync(cmdFile)) {
                console.log(`[PLUGINS] Loading ${command}.js`)
                delete require.cache[require.resolve(cmdFile)]
                const plugin = require(cmdFile)
                try {
                    if (typeof plugin === 'function') { await plugin(sock, msg, args, from, { pushName }); return }
                    if (plugin.execute) { await plugin.execute(sock, msg, args, from, { pushName }); return }
                    if (plugin.default) { await plugin.default(sock, msg, args, from, { pushName }); return }
                } catch (e) { console.log(`Plugin ${command} error:`, e.message) }
            } else {
                // Fallback built-in
                if (command === 'ping') {
                    await sock.sendMessage(from, { text: `Pong! ⚡ *${BOT_NAME}* active\n👋 Hello *${pushName}*` }, { quoted: msg })
                }
                if (command === 'menu') {
                    await sock.sendMessage(from, { text: `*${BOT_NAME}*\nHello *${pushName}*\n\n${PREFIX}ping\n${PREFIX}menu\n${PREFIX}owner` }, { quoted: msg })
                }
            }
        } catch (e) {
            console.log('Message handler error:', e.message)
        }
    })
}

const mainHandler = startBot
module.exports = mainHandler
module.exports.mainHandler = mainHandler
module.exports.default = mainHandler
module.exports.startBot = startBot

if (require.main === module) { startBot() }