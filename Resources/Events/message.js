require('../Functions/mains.js')
require('../Socket/index.js')

const fs = require('fs')
const path = require('path')

let config = {}
try {
  config = require('../../settings')
} catch {
  try { config = require('../../settings.js') } catch { config = {} }
}
config.prefix = config.prefix || '.'
config.ownerName = config.ownerName || 'Matsken'
config.ownerNumber = config.ownerNumber || ['256']
config.mode = config.mode || 'public'
config.version = config.version || '2.7.0'

let smsg = (conn, m) => m
try {
  const lib = require('../Functions/myfunc')
  if (lib.smsg) smsg = lib.smsg
} catch {
  try {
    const lib2 = require('../Lib/myfunc')
    if (lib2.smsg) smsg = lib2.smsg
  } catch {}
}

const PluginsPath = path.join(__dirname, '../Plugins')

function getPlugins() {
  if (!fs.existsSync(PluginsPath)) return []
  return fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js'))
}

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
    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const text = args.join(' ')
    const senderNum = sender.split('@')[0]
    const isOwner = (Array.isArray(config.ownerNumber) ? config.ownerNumber.includes(senderNum) : false) || m.key.fromMe

    console.log(`[CMD] ${pushname}: ${prefix}${command}`)

    switch (command) {
      case 'p':
      case 'ping':
      case 'alive': {
        await conn.sendMessage(from, { 
          text: `⚡ *BREAKER-ULTRA MD*\n\n✅ Online\n⏱️ ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT\n👤 ${pushname}\n🏠 ${process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Panel'}\n\n_Mode: ${config.mode}_` 
        }, { quoted: m })
        break
      }

      case 'menu':
      case 'help': {
        const files = getPlugins()
        let list = files.map(f => `• ${prefix}${f.replace('.js','')}`).join('\n')
        let menu = `╔════════════════════╗
║ ⚡ *BREAKER-ULTRA MD* ║
╠════════════════════╣
║ *Owner:* ${config.ownerName}
║ *Prefix:* ${prefix}
║ *Mode:* ${config.mode}
║ *Version:* ${config.version}
║ *Plugins:* ${files.length}
╚════════════════════╝

*ALL COMMANDS:*
${list}

_Type ${prefix}ping to check_`
        await conn.sendMessage(from, { text: menu }, { quoted: m })
        break
      }

      case 'owner': {
        const num = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber
        await conn.sendMessage(from, { text: `👑 Owner: ${config.ownerName}\n📞 Number: ${num}` }, { quoted: m })
        break
      }

      default: {
        const files = getPlugins()
        for (const file of files) {
          try {
            const full = path.join(PluginsPath, file)
            delete require.cache[require.resolve(full)]
            const plugin = require(full)
            
            const cmdName = file.replace('.js','').toLowerCase()
            
            if (plugin.command) {
              const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
              if (!cmds.map(c => c.toLowerCase()).includes(command) && cmdName !== command) continue
              if (plugin.execute) {
                await plugin.execute(conn, m, args, { config, text, command, sender, pushname })
                return
              }
              if (typeof plugin === 'function') {
                await plugin(conn, m, args)
                return
              }
            }
            
            if (typeof plugin === 'function') {
              if (cmdName === command) {
                await plugin(conn, m, config, { text, args })
                return
              }
            }
            
            if (plugin.execute && cmdName === command) {
              await plugin.execute(conn, m, args, { config, text, command })
              return
            }
            
          } catch (e) {
            console.log(`[PLUGIN ERROR] ${file}: ${e.message}`)
          }
        }
        break
      }
    }

  } catch (e) {
    console.log('Error in messages.js:', e.message)
  }
}