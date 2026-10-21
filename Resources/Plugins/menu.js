module.exports = {
  command: ['menu','help','allmenu'],
  execute: async (conn, m, args, { config }) => {
    const from = m.key.remoteJid
    const prefix = config.prefix || '.'
    const fs = require('fs')
    const path = require('path')

    const PluginsPath = path.join(__dirname, '../Plugins')
    const files = fs.existsSync(PluginsPath) ? fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js')).map(f => f.replace('.js','')) : []

    // USER INFO - who typed menu
    const pushname = m.pushName || 'User'
    const userNumber = m.key.participant ? m.key.participant.split('@')[0] : from.split('@')[0]
    
    const uptimeSec = process.uptime()
    const h = Math.floor(uptimeSec / 3600)
    const min = Math.floor((uptimeSec % 3600) / 60)
    const uptime = h > 0 ? `${h}h ${min}m` : `${min}m`
    
    const date = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' EAT'
    const platform = process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Linux Panel'

    const ai = ['analyse','chatbot','deepseek','explaincode','gemini','generate','gpt','imagine','programming','summarise','teach','translate']
    const aiExist = ai.filter(c => files.includes(c))

    let menu = `⚡ BREAKER-ULTRA MD v${config.version || '2.7.0'} ⚡
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 *Username* : ${pushname}
┃ 📞 *Number* : ${userNumber}
┃ 🤖 *Bot Name* : BREAKER
┃ 👑 *Owner* : Matsken
┃ 🔣 *Prefix* : ${prefix}
┃ 🌐 *Mode* : ${config.mode || 'public'}
┃ 🔋 *Uptime* : ${uptime}
┃ 📅 *Date* : ${date}
┃ 🖥️ *Platform*: ${platform}
┗━━━━━━━━━━━━━━━━━━━━━━┛

┌⊡ ◇ AI MENU ◇
`
    for (const cmd of aiExist) menu += `│ ➡️ ${cmd}\n`
    menu += `└⊡\n\n> Total AI: ${aiExist.length} cmds\n`

    await conn.sendMessage(from, { text: menu }, { quoted: m })
  }
}