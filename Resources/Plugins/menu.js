module.exports = {
  command: ['menu','help','allmenu'],
  execute: async (conn, m, args, { config }) => {
    const from = m.key.remoteJid
    const prefix = config.prefix || '.'
    const fs = require('fs')
    const path = require('path')

    const PluginsPath = path.join(__dirname, '../Plugins')
    const files = fs.existsSync(PluginsPath) ? fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js')).map(f => f.replace('.js','')) : []

    // Uptime
    const uptimeSec = process.uptime()
    const h = Math.floor(uptimeSec / 3600)
    const min = Math.floor((uptimeSec % 3600) / 60)
    const uptime = h > 0 ? `${h}h ${min}m` : `${min}m`

    const botNumber = conn.user ? conn.user.id.split(':')[0] : '256'
    const date = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' EAT'
    const platform = process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Linux Panel'

    // Categorize - you can add more
    const ai = ['analyse','chatbot','deepseek','explaincode','gemini','generate','gpt','imagine','programming','summarise','teach','translate']
    const download = files.filter(f => ['play','song','video','apk','tiktok','fb','ig','ytmp3','ytmp4'].includes(f) || f.includes('dl'))
    const group = files.filter(f => ['kick','add','promote','demote','tagall','hidetag','antilink'].includes(f) || f.includes('group'))
    const owner = files.filter(f => ['mode','prefix','ban','unban','restart','update','broadcast'].includes(f))
    const other = files.filter(f => !ai.includes(f) && !download.includes(f) && !group.includes(f) && !owner.includes(f) && f !== 'menu')

    let menu = `⚡ BREAKER-ULTRA MD v${config.version || '2.7.0'} ⚡
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 *Username* : ${botNumber}
┃ 👑 *Name* : ©Matsken™✓
┃ 👑 *Owner* : ${config.ownerName || 'Matsken'}
┃ 🔣 *Prefix* : ${prefix}
┃ 🌐 *Mode* : ${config.mode || 'public'}
┃ 🔋 *Uptime* : ${uptime}
┃ 📅 *Date* : ${date}
┃ 🖥️ *Platform*: ${platform}
┗━━━━━━━━━━━━━━━━━━━━━━┛

┌⊡ ◇ AI MENU ◇
`
    for (const cmd of ai) { if (files.includes(cmd)) menu += `│ ➡️ ${cmd}\n` }
    menu += `└⊡\n\n> Total AI: ${ai.filter(c => files.includes(c)).length} cmds\n\n`

    if (download.length > 0) {
      menu += `┌⊡ ◇ DOWNLOAD MENU ◇\n`
      download.forEach(c => menu += `│ ➡️ ${c}\n`)
      menu += `└⊡\n\n> Total DL: ${download.length} cmds\n\n`
    }

    if (group.length > 0) {
      menu += `┌⊡ ◇ GROUP MENU ◇\n`
      group.forEach(c => menu += `│ ➡️ ${c}\n`)
      menu += `└⊡\n\n> Total Group: ${group.length} cmds\n\n`
    }

    if (other.length > 0) {
      menu += `┌⊡ ◇ OTHER MENU ◇\n`
      other.slice(0,30).forEach(c => menu += `│ ➡️ ${c}\n`) // limit to 30
      menu += `└⊡\n\n> Total Other: ${other.length} cmds\n\n`
    }

    menu += `*Type ${prefix}help <cmd> for details*\n> BREAKER-ULTRA by Matsken`

    await conn.sendMessage(from, { text: menu }, { quoted: m })
  }
}