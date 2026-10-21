const fs = require('fs')
const path = require('path')

let config = {}
try { config = require('../../settings') } catch { try { config = require('../../settings.js') } catch { config = {} } }
config.prefix = config.prefix || '.'
config.ownerName = config.ownerName || 'Matsken'
config.ownerNumber = config.ownerNumber || ['256766800757']
config.mode = config.mode || 'public'
config.version = config.version || '2.7.0'

let smsg = (conn, m) => m
try { const lib = require('../Functions/myfunc'); if (lib.smsg) smsg = lib.smsg } catch {}
try { const lib2 = require('../Lib/myfunc'); if (lib2.smsg) smsg = lib2.smsg } catch {}
try { const lib3 = require('./myfunc'); if (lib3.smsg) smsg = lib3.smsg } catch {}

function findPluginsFolder() {
  const tries = [
    path.join(__dirname, '../Plugins'),
    path.join(__dirname, '../../Plugins'),
    path.join(__dirname, '../plugins'),
    path.join(__dirname, '../../plugins'),
    path.join(process.cwd(), 'Plugins'),
    path.join(process.cwd(), 'plugins')
  ]
  for (const p of tries) if (fs.existsSync(p)) return p
  return null
}

const PLUGINS_DIR = findPluginsFolder()
let plugins = {}
let allCommands = []

function loadAllPlugins() {
  plugins = {}
  allCommands = []
  if (!PLUGINS_DIR) {
    console.log('[PLUGINS] Folder not found!')
    return
  }
  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
  console.log(`[PLUGINS] Found ${files.length} files in ${PLUGINS_DIR}`)
  
  for (const file of files) {
    const fullPath = path.join(PLUGINS_DIR, file)
    try {
      delete require.cache[require.resolve(fullPath)]
      const plugin = require(fullPath)
      plugins[file] = plugin
      
      let cmds = []
      if (plugin.command) cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
      cmds.push(file.replace('.js','').toLowerCase())
      const uniqueCmds = [...new Set(cmds.map(c => String(c).toLowerCase()))]
      allCommands.push(...uniqueCmds)
      
      console.log(`[PLUGINS] ✓ Loaded ${file} -> [${uniqueCmds.join(', ')}]`)
    } catch (e) {
      console.log(`[PLUGINS] ✗ Failed ${file}: ${e.message}`)
    }
  }
  console.log(`[PLUGINS] TOTAL LOADED: ${Object.keys(plugins).length} | TOTAL COMMANDS: ${allCommands.length}`)
}

// Load on start
loadAllPlugins()

// Auto reload every 5 mins + watch folder
if (PLUGINS_DIR) {
  fs.watch(PLUGINS_DIR, (event, filename) => {
    if (filename && filename.endsWith('.js')) {
      console.log(`[PLUGINS] File changed: ${filename}, reloading...`)
      setTimeout(loadAllPlugins, 1000)
    }
  })
}

module.exports = async (conn, m) => {
  try {
    if (!m) return
    if (m.key && m.key.remoteJid === 'status@broadcast') return
    try { m = smsg(conn, m) } catch {}
    if (!m.message) return

    const from = m.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = isGroup ? (m.key.participant || m.participant) : from
    const pushname = m.pushName || 'User'

    const body = m.mtype === 'conversation' ? m.message.conversation :
                 m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text :
                 m.mtype === 'imageMessage' ? m.message.imageMessage.caption || '' :
                 m.mtype === 'videoMessage' ? m.message.videoMessage.caption || '' :
                 m.message?.conversation || m.message?.extendedTextMessage?.text || ''

    if (!body) return
    const prefix = config.prefix || '.'
    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const text = args.join(' ')

    // HOT RELOAD COMMAND - owner only
    if (command === 'reload' || command === 'rplugins') {
      const ownerNums = Array.isArray(config.ownerNumber) ? config.ownerNumber : [config.ownerNumber]
      const isOwner = ownerNums.some(n => sender.includes(String(n).replace(/[^0-9]/g,'')))
      if (!isOwner) return
      loadAllPlugins()
      await conn.sendMessage(from, { text: `✅ Reloaded ${Object.keys(plugins).length} plugins\n📁 ${PLUGINS_DIR}\n\nCommands: ${allCommands.slice(0,30).join(', ')}...` }, { quoted: m })
      return
    }

    // CORE - ping, alive, owner, uptime
    if (['p','ping'].includes(command)) {
      await conn.sendMessage(from, { text: `⚡ Pong! ${Date.now() - (m.messageTimestamp*1000)}ms\n🤖 BREAKER-ULTRA MD\n👤 ${pushname}` }, { quoted: m })
      return
    }
    if (command === 'alive') {
      await conn.sendMessage(from, { text: `✅ BREAKER-ULTRA MD is Online\nVersion: ${config.version}\nMode: ${config.mode}\nUptime: ${Math.floor(process.uptime()/60)}m\nPlugins: ${Object.keys(plugins).length}` }, { quoted: m })
      return
    }

    // FIND AND EXECUTE PLUGIN
    let found = false
    for (const file in plugins) {
      const plugin = plugins[file]
      if (!plugin) continue
      let pluginCmds = []
      if (plugin.command) pluginCmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
      pluginCmds.push(file.replace('.js','').toLowerCase())
      pluginCmds = pluginCmds.map(c => String(c).toLowerCase())
      
      if (pluginCmds.includes(command)) {
        found = true
        console.log(`[EXEC] ${command} -> ${file} by ${pushname}`)
        try {
          if (plugin.execute) await plugin.execute(conn, m, args, { config, text, command, sender, pushname, from, isGroup, plugins })
          else if (typeof plugin === 'function') await plugin(conn, m, args, { config, text, command })
        } catch (e) {
          console.log(`[EXEC ERROR] ${file}: ${e.message}`)
          await conn.sendMessage(from, { text: `❌ Error in ${file}: ${e.message}` }, { quoted: m })
        }
        break
      }
    }

    if (!found) {
      console.log(`[NO CMD] ${command} not found. Available: ${allCommands.slice(0,20).join(', ')}`)
    }

  } catch (e) {
    console.log('Error in mains.js:', e.message, e.stack)
  }
}