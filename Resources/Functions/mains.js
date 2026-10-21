const fs = require('fs')
const path = require('path')

module.exports = {
  command: ['menu','help','allmenu'],
  execute: async (conn, m, args, { config }) => {
    const from = m.key.remoteJid
    const prefix = config.prefix || '.'
    const pushname = m.pushName || 'User'
    const userNumber = m.key.participant ? m.key.participant.split('@')[0] : from.split('@')[0]
    const uptime = Math.floor(process.uptime()/60)
    const date = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })

    const menuText = `⚡ BREAKER-ULTRA MD v${config.version || '2.7.0'} ⚡
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 *Username* : ${pushname}
┃ 📞 *Number* : ${userNumber}
┃ 🤖 *Bot Name* : BREAKER
┃ 👑 *Owner* : Matsken
┃ 🔣 *Prefix* : .
┃ 🌐 *Mode* : public
┃ 🔋 *Uptime* : ${uptime}m
┃ 📅 *Date* : ${date}
┃ 🖥️ *Platform*: Linux Panel
┗━━━━━━━━━━━━━━━━━━━━━━┛

┌⊡ ◇ AI MENU ◇
│ ➡️ analyse
│ ➡️ chatbot
│ ➡️ deepseek
│ ➡️ explaincode
│ ➡️ gemini
│ ➡️ generate
│ ➡️ gpt
└⊡`

    // ===== SEARCH LOGO IN MAIN ROOT =====
    const root = process.cwd()
    const possibleNames = [
      'logo.jpg','logo.png','logo.jpeg',
      'menu.jpg','menu.png',
      'breaker.jpg','breaker.png',
      'bot.jpg','bot.png',
      'image.jpg','thumb.jpg',
      'BREAKER.jpg','thumbnail.jpg'
    ]

    let logoPath = null

    // 1. Check root directly
    for (const name of possibleNames) {
      const p = path.join(root, name)
      if (fs.existsSync(p)) { logoPath = p; break }
    }

    // 2. Check if any jpg/png in root (first image)
    if (!logoPath) {
      try {
        const rootFiles = fs.readdirSync(root)
        const img = rootFiles.find(f => /\.(jpg|jpeg|png)$/i.test(f))
        if (img) logoPath = path.join(root, img)
      } catch {}
    }

    // 3. Check subfolders
    if (!logoPath) {
      const folders = ['media','Media','assets','Assets','images']
      for (const folder of folders) {
        for (const name of possibleNames) {
          const p = path.join(root, folder, name)
          if (fs.existsSync(p)) { logoPath = p; break }
        }
        if (logoPath) break
      }
    }

    console.log(`[MENU] Logo search in ${root} -> ${logoPath || 'NOT FOUND, using text'}`)

    try {
      if (logoPath && fs.existsSync(logoPath)) {
        await conn.sendMessage(from, {
          image: fs.readFileSync(logoPath),
          caption: menuText
        }, { quoted: m })
      } else {
        await conn.sendMessage(from, { text: menuText }, { quoted: m })
      }
    } catch (e) {
      console.log(`[MENU ERROR] ${e.message}`)
      await conn.sendMessage(from, { text: menuText }, { quoted: m })
    }
  }
}