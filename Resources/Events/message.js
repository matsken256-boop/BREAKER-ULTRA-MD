// Safe requires - don't crash if missing
try { require('../Functions/mains.js') } catch {}
try { require('../Socket/index.js') } catch {}

const fs = require('fs')
const path = require('path')

let config = {}
try { config = require('../../settings') } catch { try { config = require('../../settings.js') } catch { config = {} } }
config.prefix = config.prefix || '.'
config.ownerName = config.ownerName || 'Matsken'
config.ownerNumber = config.ownerNumber || ['256']
config.mode = config.mode || 'public'
config.version = config.version || '2.7.0'

let smsg = (conn, m) => m
try { const lib = require('../Functions/myfunc'); if (lib.smsg) smsg = lib.smsg } catch {
  try { const lib2 = require('../Lib/myfunc'); if (lib2.smsg) smsg = lib2.smsg } catch {}
}

const PluginsPath = path.join(__dirname, '../../Plugins')

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
    
    console.log(`[CMD] ${pushname}: ${prefix}${command} ${text.slice(0,20)}`)

    // BUILT-IN COMMANDS - always work even if plugins fail
    switch (command) {
      case 'p':
      case 'ping':
      case 'alive': {
        await conn.sendMessage(from, { 
          text: `⚡ *BREAKER-ULTRA MD*\n\n✅ Online\n⏱️ ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT\n👤 ${pushname}\n🏠 ${process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Panel'}\n\n_Mode: ${config.mode}_` 
        }, { quoted: m })
        return
      }
      case 'menu':
      case 'help': {
        const files = getPlugins()
        let list = files.map(f => `• ${prefix}${f.replace('.js','')}`).join('\n')
        let menu = `╔════════════════════╗\n║ ⚡ *BREAKER-ULTRA MD* ║\n╠════════════════════╣\n║ *Owner:* ${config.ownerName}\n║ *Prefix:* ${prefix}\n║ *Mode:* ${config.mode}\n║ *Version:* ${config.version}\n║ *Plugins:* ${files.length}\n╚════════════════════╝\n\n*ALL COMMANDS:*\n${list}\n\n_Type ${prefix}ping to check_`
        await conn.sendMessage(from, { text: menu }, { quoted: m })
        return
      }
      case 'owner': {
        const num = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber
        await conn.sendMessage(from, { text: `👑 Owner: ${config.ownerName}\n📞 Number: ${num}` }, { quoted: m })
        return
      }
    }

    // PLUGIN LOADER - FIXED
    const files = getPlugins()
    for (const file of files) {
      try {
        const full = path.join(PluginsPath, file)
        delete require.cache[require.resolve(full)]
        const plugin = require(full)
        
        if (!plugin) continue
        
        // Get all command names for this plugin
        let pluginCommands = []
        if (plugin.command) {
          pluginCommands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
          pluginCommands = pluginCommands.map(c => String(c).toLowerCase())
        }
        const fileNameAsCmd = file.replace('.js','').toLowerCase()
        pluginCommands.push(fileNameAsCmd)

        // Check if this plugin matches
        if (!pluginCommands.includes(command)) continue

        // Execute
        if (plugin.execute) {
          await plugin.execute(conn, m, args, { config, text, command, sender, pushname })
          return // Stop after first match
        }
        if (typeof plugin === 'function') {
          await plugin(conn, m, args, { config, text, command })
          return
        }

      } catch (e) {
        console.log(`[PLUGIN ERROR] ${file}: ${e.message}`)
      }
    }

  } catch (e) {
    console.log('Error in messages.js:', e.message, e.stack)
  }
          }
