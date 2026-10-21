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
try { const lib = require('../Functions/myfunc'); if (lib.smsg) smsg = lib.smsg } catch {}
try { const lib2 = require('../Lib/myfunc'); if (lib2.smsg) smsg = lib2.smsg } catch {}

const PluginsPath = path.join(__dirname, '../../Plugins')

// FIX 1: Load plugins ONCE at startup - not every message (this was killing bot)
let pluginsCache = {}
function loadPlugins() {
  pluginsCache = {}
  if (!fs.existsSync(PluginsPath)) return
  const files = fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js'))
  for (const file of files) {
    try {
      const full = path.join(PluginsPath, file)
      delete require.cache[require.resolve(full)]
      pluginsCache[file] = require(full)
    } catch {}
  }
  console.log(`[PLUGINS] Loaded ${Object.keys(pluginsCache).length} plugins`)
}
loadPlugins()

module.exports = async (conn, m) => {
  try {
    if (!m) return
    if (m.key && m.key.remoteJid === 'status@broadcast') return // ignore status
    try { m = smsg(conn, m) } catch {}
    if (!m.message) return

    const from = m.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = isGroup ? (m.key.participant || m.participant) : from
    const pushname = m.pushName || 'No Name'

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

    console.log(`[CMD] ${pushname}: ${prefix}${command}`)

    // FIX 2: ONLY ping/alive/owner here - LET Plugins/menu.js HANDLE MENU
    switch (command) {
      case 'p':
      case 'ping':
      case 'alive': {
        await conn.sendMessage(from, { 
          text: `⚡ *BREAKER-ULTRA MD*\n\n✅ Online\n⏱️ ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT\n👤 ${pushname}\n🏠 ${process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Panel'}\n\n_Mode: ${config.mode}_` 
        }, { quoted: m })
        return
      }
      case 'owner': {
        const num = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber
        await conn.sendMessage(from, { text: `👑 Owner: ${config.ownerName}\n📞 Number: ${num}` }, { quoted: m })
        return
      }
    }

    // PLUGIN LOADER - uses cache, no delete
    for (const file in pluginsCache) {
      try {
        const plugin = pluginsCache[file]
        if (!plugin) continue

        let pluginCommands = []
        if (plugin.command) {
          pluginCommands = Array