const fs = require('fs')
const path = require('path')

const PLUGINS_DIR = path.join(__dirname, '../Plugins')
const ROOT_DIR = path.join(__dirname, '../../')

const config = {
  botName: "BREAKER-ULTRA MD",
  ownerName: "Matsken",
  prefix: ".",
  version: "2.7.0",
  mode: "public"
}

function findLogo() {
  try {
    const files = fs.readdirSync(ROOT_DIR)
    for (const f of files) {
      const l = f.toLowerCase()
      if ((l.includes('logo') || l.includes('breaker') || l.includes('beauty')) && (l.endsWith('.jpg') || l.endsWith('.png') || l.endsWith('.jpeg'))) {
        return path.join(ROOT_DIR, f)
      }
    }
  } catch {}
  return null
}

function getPlatform() {
  try { return require('os').platform() } catch { return 'linux' }
}

module.exports = async (sock, msg, extra) => {
  try {
    // 1. WELCOME - TEXT ONLY - EXACT LIKE YOUR connection.js SCREENSHOT
    if (!msg) {
      try {
        const botNameFromWA = sock.user.name || config.botName
        const platform = getPlatform()
        const dateTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' EAT'
        const welcomeMsg = `┌──『 ${config.botName.toUpperCase()} 』──
» *Name:* ${botNameFromWA}
» *Owner:* ${config.ownerName}
» *Platform:* ${platform}
» *Prefix:* [ ${config.prefix} ]
» *Mode:* public ✅
» *Version:* ${config.version}
» *Date & Time:* ${dateTime}
»
» https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
» https://t.me/Matsken1
» https://github.com/matsken256-boop


Hello! I am *${config.botName}*, ready for everyone.

Type *${config.prefix}menu* to see all commands`;
        await sock.sendMessage(sock.user.id, { text: welcomeMsg })
      } catch (e) {}
      return
    }

    if (!msg.message) return
    const from = msg.key.remoteJid
    const pushname = msg.pushName || 'Beauty'
    const userNumber = from.split('@')[0]
    let body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || msg.message.ephemeralMessage?.message?.extendedTextMessage?.text || ''
    if (!body) return
    if (![".", "!", "/"].some(p => body.startsWith(p))) return
    const prefix = body[0]
    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    if (!command) return

    // 2. LOAD YOUR REAL PLUGIN FILE FIRST - SO ping.js & menu.js WORK
    const cmdFile = path.join(PLUGINS_DIR, `${command}.js`)
    if (fs.existsSync(cmdFile)) {
      try {
        delete require.cache[require.resolve(cmdFile)]
        const plugin = require(cmdFile)
        if (typeof plugin === 'function') {
          await plugin(sock, msg, args, from, { pushName: pushname, prefix })
          return
        }
        if (plugin.execute) {
          await plugin.execute(sock, msg, args, from)
          return
        }
      } catch (e) {
        console.log(`${command}.js error:`, e.message)
      }
    }

    // 3. FALLBACKS
    if (command === 'ping') {
      await sock.sendMessage(from, { text: `*Pong! ⚡* ${config.botName} Active` }, { quoted: msg })
      return
    }

    if (command === 'menu') {
      const files = fs.existsSync(PLUGINS_DIR) ? fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js')).map(f => f.replace('.js','')) : []
      const ai = ['analyse','chatbot','deepseek','explaincode','gemini','generate','gpt','imagine','programming','summarise','teach','translate']
      const aiExist = ai.filter(c => files.includes(c))
      const uptime = `${Math.floor(process.uptime()/3600)}h ${Math.floor((process.uptime()%3600)/60)}m`
      const date = new Date().toLocaleDateString()
      const platform = getPlatform()
      let menu = `⚡ ${config.botName} v${config.version} ⚡

👤 *Username* : ${pushname}
📞 *Number* : ${userNumber}
🤖 *Bot Name* : BREAKER
👑 *Owner* : ${config.ownerName}
🔠 *Prefix* : ${prefix}
👤 *Mode* : ${config.mode}
🔋 *Uptime* : ${uptime}
📅 *Date* : ${date}
🖥️ *Platform*: ${platform}

◇ ◇ AI MENU ◇
`
      for (const cmd of aiExist) menu += `│ 📩 ${cmd}\n`
      const logoPath = findLogo()
      if (logoPath && fs.existsSync(logoPath)) {
        await sock.sendMessage(from, { image: fs.readFileSync(logoPath), caption: menu }, { quoted: msg })
      } else {
        await sock.sendMessage(from, { text: menu }, { quoted: msg })
      }
    }

  } catch (e) { console.log('Fatal', e.message) }
}