const fs = require('fs')
const path = require('path')

module.exports = {
  command: ['menu','help','allmenu','list'],
  execute: async (conn, m, args, { config }) => {
    const from = m.key.remoteJid
    const prefix = config.prefix || '.'
    const pushname = m.pushName || 'User'
    const userNumber = from.split('@')[0]
    const uptimeSec = process.uptime()
    const uptime = `${Math.floor(uptimeSec/3600)}h ${Math.floor((uptimeSec%3600)/60)}m`
    const date = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })

    // === GET ALL PLUGINS ===
    const pluginsDir = global.PLUGINS_DIR || path.join(process.cwd(), 'Plugins') || path.join(__dirname, '../Plugins')
    let allPlugins = {}
    try {
      if (global.PLUGINS) allPlugins = global.PLUGINS
      else {
        const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
        for (const f of files) {
          const p = path.join(pluginsDir, f)
          try { delete require.cache[require.resolve(p)]; allPlugins[f] = require(p) } catch {}
        }
      }
    } catch {}

    // Group by category
    let categories = {}
    let totalCmds = 0
    for (const file in allPlugins) {
      const plugin = allPlugins[file]
      if (!plugin) continue
      let cmds = plugin.command ? (Array.isArray(plugin.command) ? plugin.command : [plugin.command]) : [file.replace('.js','')]
      let category = plugin.category || plugin.type || 'OTHER'
      category = String(category).toUpperCase()
      if (!categories[category]) categories[category] = []
      const mainCmd = String(cmds[0]).toLowerCase()
      categories[category].push(mainCmd)
      totalCmds++
    }

    // Sort categories
    if (Object.keys(categories).length === 0) {
      // Fallback if no category field - group by name
      categories = { 'ALL COMMANDS': Object.keys(allPlugins).map(f => f.replace('.js','')) }
    }

    let menuText = `⚡ BREAKER-ULTRA MD v${config.version || '2.7.0'} ⚡
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 *User* : ${pushname}
┃ 📞 *Num* : ${userNumber}
┃ 🤖 *Bot* : BREAKER
┃ 👑 *Owner* : Matsken
┃ 🔣 *Prefix* : ${prefix}
┃ 📦 *Plugins* : ${totalCmds}
┃ 🔋 *Uptime* : ${uptime}
┃ 📅 *Date* : ${date}
┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`

    for (const cat in categories) {
      const cmds = categories[cat]
      menuText += `┌─○ ◇ ${cat} ◇\n`
      for (const cmd of cmds) {
        menuText += `│ ➡️ ${prefix}${cmd}\n`
      }
      menuText += `└─○\n\n`
    }

    menuText += `_Type ${prefix}help for info_\n_Powered by Matsken Tech_`

    // === LOGO FROM ROOT ===
    const logoPath = global.BOT_LOGO || global.MENU_LOGO
    try {
      if (logoPath && fs.existsSync(logoPath)) {
        console.log(`[MENU] Sending with logo: ${logoPath} | Total cmds: ${totalCmds}`)
        await conn.sendMessage(from, { 
          image: fs.readFileSync(logoPath), 
          caption: menuText 
        }, { quoted: m })
      } else {
        console.log(`[MENU] No logo found, sending text | Total cmds: ${totalCmds}`)
        await conn.sendMessage(from, { text: menuText }, { quoted: m })
      }
    } catch (e) {
      await conn.sendMessage(from, { text: menuText }, { quoted: m })
    }
  }
}