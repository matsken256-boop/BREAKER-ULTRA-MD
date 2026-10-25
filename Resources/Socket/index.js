const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

// === MEGAN API ===
const MEGAN_APIKEY = "megan_fc148d34fe9b3a2";
const MEGAN_BASE = "https://megan-api.vercel.app";
global.MEGAN_KEY = MEGAN_APIKEY;
global.MEGAN_APIKEY = MEGAN_APIKEY;
global.MEGAN_BASE = MEGAN_BASE;
global.MEGAN_API = MEGAN_BASE;

global.MEGAN_AI = async (prompt) => {
  try {
    const res = await axios.get(`${MEGAN_BASE}/api/ai`, { params: { prompt, key: MEGAN_APIKEY }, timeout: 15000 });
    return res.data?.result || res.data?.response || "No response";
  } catch (e) { return "❌ AI Offline" }
};

let config = {}
try { config = require('../../settings') } catch { try { config = require('../../settings.js') } catch { config = {} } }
config.prefix = config.prefix || '.'
config.ownerName = 'Matsken'
config.botName = 'Breaker-Ultra MD'
config.version = '2.7.0'
config.mode = 'public' // PUBLIC FOR EVERYONE

async function startBot() {
    const sessionPath = path.join(__dirname, '../../session');
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
        browser: Browsers.ubuntu("Chrome"),
        logger: pino({ level: "silent" }),
        markOnlineOnConnect: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) setTimeout(() => startBot(), 3000)
        } else if (connection === 'open') {
            console.log('✅ Breaker-Ultra MD CONNECTED - PUBLIC MODE')
            try {
                await sock.sendMessage(sock.user.id, { 
                    text: `✅ *${config.botName} Online*\n\n👋 Bot is ready for public use!\n\n📌 Prefix: ${config.prefix}\n👑 Owner: ${config.ownerName}\n\nType *${config.prefix}menu* to start` 
                })
            } catch (e) {}
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0]
            if (!m.message) return

            const from = m.key.remoteJid
            const pushName = m.pushName || 'User' // AUTO DETECT USER NAME
            const userId = from.split('@')[0]
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
            
            if (!body.startsWith(config.prefix)) return

            const args = body.slice(config.prefix.length).trim().split(/ +/)
            const command = args.shift().toLowerCase()
            console.log(`[CMD] ${command} from ${pushName} (${userId})`)

            // PUBLIC COMMANDS - EVERYONE CAN USE
            if (command === 'ping' || command === 'p') {
                await sock.sendMessage(from, { text: `Pong! ⚡ *${config.botName}* is active\n\n👋 Hello *${pushName}*\n✅ Public bot working!` }, { quoted: m })
                return
            }
            if (command === 'menu') {
                const menu = `╭─── *${config.botName.toUpperCase()}* ───
│ 👋 Hello *${pushName}*
│ Prefix: ${config.prefix}
│ Owner: ${config.ownerName}
│ Mode: Public ✅
╰────────────────
╭─── *MAIN MENU* ───
│ ${config.prefix}ping - Check bot
│ ${config.prefix}menu - This menu
│ ${config.prefix}vcf
│ ${config.prefix}owner
╰────────────────

> Powered by ${config.ownerName}`
                await sock.sendMessage(from, { text: menu }, { quoted: m })
                return
            }
            if (command === 'vcf') {
                await sock.sendMessage(from, { text: `🌐 *VCF Site*\nhttps://er-vcf.vercel.app\n\nRequested by: *${pushName}*` }, { quoted: m })
                return
            }
            if (command === 'owner') {
                await sock.sendMessage(from, { text: `👑 *Owner:* ${config.ownerName}\n🤖 *Bot:* ${config.botName}\n\nYou: *${pushName}*` }, { quoted: m })
                return
            }

            // Load external commands
            const cmdPaths = [
                path.join(__dirname, '../../commands', `${command}.js`),
                path.join(__dirname, '../../plugins', `${command}.js`)
            ]
            for (const cmdPath of cmdPaths) {
                if (fs.existsSync(cmdPath)) {
                    delete require.cache[require.resolve(cmdPath)]
                    const cmd = require(cmdPath)
                    if (typeof cmd === 'function') await cmd(sock, m, args, from, { pushName })
                    else if (cmd.execute) await cmd.execute(sock, m, args, from, { pushName })
                    break
                }
            }

        } catch (e) {
            console.log('Handler Error:', e.message)
        }
    })
    return sock
}

module.exports = startBot
module.exports.default = startBot