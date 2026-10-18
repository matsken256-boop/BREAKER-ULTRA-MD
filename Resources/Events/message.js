const fs = require('fs')
const path = require('path')

// Safe require settings
let config = {}
try {
    config = require('../../settings')
} catch {
    try { config = require('../../settings.js') } catch { config = {} }
}
config.prefix = config.prefix || '.'
config.ownerName = config.ownerName || 'Matsken'
config.ownerNumber = config.ownerNumber || ['256...']
config.mode = config.mode || 'public'
config.version = config.version || '2.7.0'

// Safe smsg
let smsg = (conn, m) => m
try {
    const lib = require('../Lib/myfunc')
    if (lib.smsg) smsg = lib.smsg
} catch {}

module.exports = async (conn, m) => {
  try {
    if (!m) return
    try { m = smsg(conn, m) } catch {}
    if (!m.message) return

    const from = m.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = isGroup ? (m.key.participant || m.participant) : from
    const pushname = m.pushName || 'No Name'

    const body = m.mtype === 'conversation' ? m.message.conversation :
                 m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text :
                 m.mtype === 'imageMessage' ? m.message.imageMessage.caption :
                 m.mtype === 'videoMessage' ? m.message.videoMessage.caption :
                 m.message?.conversation || m.message?.extendedTextMessage?.text || ''

    if (!body) return

    const prefix = config.prefix || '.'
    const isCmd = body.startsWith(prefix)
    
    // Allow .p even without checking isCmd properly
    let args, command, text
    if (isCmd) {
        args = body.slice(prefix.length).trim().split(/ +/)
        command = args.shift().toLowerCase()
        text = args.join(' ')
    } else {
        // Not a command, ignore for now but still log
        return
    }

    const senderNum = sender.split('@')[0]
    const isOwner = (Array.isArray(config.ownerNumber) ? config.ownerNumber.includes(senderNum) : false) || m.key.fromMe

    console.log(`[CMD] ${pushname}: ${prefix}${command}`)

    switch(command) {
      case 'p': // <-- ADDED .p
      case 'ping':
      case 'alive': {
        await conn.sendMessage(from, { text: `⚡ *BREAKER-ULTRA MD*\n\n✅ Online\n⏱️ ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT\n👤 ${pushname}\n🏠 ${process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Panel'}\n\n_Mode: ${config.mode}_` }, { quoted: m })
        break
      }

      case 'menu':
      case 'help': {
        let menu = `╔════════════════════╗
║ ⚡ *BREAKER-ULTRA MD* ║
╠════════════════════╣
║ Owner: ${config.ownerName}
║ Prefix: ${prefix}
║ Mode: ${config.mode}
║ Version: ${config.version}
╚════════════════════╝

*PRO COMMANDS:*
• ${prefix}p - Check bot
• ${prefix}ping - Check bot
• ${prefix}menu - This menu
• ${prefix}owner - Owner info
`
        await conn.sendMessage(from, { text: menu }, { quoted: m })
        break
      }

      case 'owner': {
        const num = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber
        await conn.sendMessage(from, { text: `👑 Owner: ${config.ownerName}\n📞 Number: ${num}` }, { quoted: m })
        break
      }

      default: {
        // === THIS IS THE FIX - LOAD ALL OTHER PLUGINS ===
        try {
            const PluginsPath = path.join(__dirname, '../Plugins')
            if (fs.existsSync(PluginsPath)) {
                const files = fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js'))
                for (const file of files) {
                    try {
                        const full = path.join(PluginsPath, file)
                        delete require.cache[require.resolve(full)]
                        const plugin = require(full)
                        if (typeof plugin === 'function') {
                            await plugin(conn, m, config, null)
                        }
                    } catch (e) {
                        // silent
                    }
                }
            }
        } catch (e) {
            console.log('Plugins load error:', e.message)
        }
        break
      }
    }

  } catch (e) {
    console.log('Error in messages.js:', e.message)
    console.log(e.stack)
  }
}