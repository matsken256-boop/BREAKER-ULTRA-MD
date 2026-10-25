const fs = require('fs')
const path = require('path')

const PLUGINS_DIR = path.join(__dirname, '../Plugins')
const ROOT_DIR = path.join(__dirname, '../../')
const BOT_NAME = "BREAKER-ULTRA MD"
const OWNER_NAME = "Matsken"
const PREFIXES = [".", "!", "/"]

function findLogo() {
  try {
    const files = fs.readdirSync(ROOT_DIR)
    for (const f of files) {
      const l = f.toLowerCase()
      if ((l.includes('logo') || l.includes('breaker') || l.includes('thumb')) && (l.endsWith('.jpg') || l.endsWith('.png') || l.endsWith('.jpeg'))) {
        return path.join(ROOT_DIR, f)
      }
    }
    for (const f of files) { if (f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')) return path.join(ROOT_DIR, f) }
  } catch {}
  return null
}

// THIS IS CALLED BY YOUR start.js
module.exports = async (sock, msg, extra) => {
  try {
    // === CASE 1: WELCOME - start.js calls with msg = null when connected ===
    if (!msg) {
      console.log(`[mains.js] Welcome trigger for ${BOT_NAME}`)
      try {
        const selfJid = sock.user.id
        const dt = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })
        const welcomeMsg = `┌──『 ${BOT_NAME} 』──\n│ Name: ${sock.user.name || BOT_NAME}\n│ Owner: ${OWNER_NAME}\n│ Prefix: [ . ]\n│ Mode: public ✅\n│ Date: ${dt}\n│ Channel: https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h\n└----------------\n\nType .menu`
        const logoPath = findLogo()
        if (logoPath && fs.existsSync(logoPath)) {
          await sock.sendMessage(selfJid, { image: fs.readFileSync(logoPath), caption: welcomeMsg })
        } else {
          await sock.sendMessage(selfJid, { text: welcomeMsg })
        }
        console.log('[mains.js] Welcome sent to self')
      } catch (e) { console.log('[mains.js] Welcome error', e.message) }
      return
    }

    // === CASE 2: NORMAL MESSAGE - start.js calls with msg object ===
    if (!msg.message) return
    const from = msg.key.remoteJid
    const pushName = msg.pushName || 'User'
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ''
    if (!body) return

    // Check prefix . ! /
    if (!PREFIXES.some(p => body.startsWith(p))) return
    const usedPrefix = PREFIXES.find(p => body.startsWith(p))
    const args = body.slice(usedPrefix.length).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    if (!command) return

    console.log(`[CMD] ${command} from ${pushName}`)

    // Try load plugin from Resources/Plugins/
    const cmdFile = path.join(PLUGINS_DIR, `${command}.js`)
    if (fs.existsSync(cmdFile)) {
      delete require.cache[require.resolve(cmdFile)]
      const plugin = require(cmdFile)
      if (typeof plugin === 'function') {
        await plugin(sock, msg, args, from, { pushName })
      } else if (plugin.execute) {
        await plugin.execute(sock, msg, args, from)
      }
      return
    }

    // Built-in fallbacks
    if (command === 'ping') {
      await sock.sendMessage(from, { text: `Pong! ⚡ *${BOT_NAME}* active` }, { quoted: msg })
    }
    if (command === 'menu') {
      let txt = `*${BOT_NAME}*\nHello *${pushName}*\n\n`
      try {
        const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js')).map(f => f.replace('.js','')).slice(0,40)
        txt += files.map(c => `${usedPrefix}${c}`).join('\n')
      } catch { txt += `${usedPrefix}ping\n${usedPrefix}menu` }
      await sock.sendMessage(from, { text: txt }, { quoted: msg })
    }

  } catch (e) {
    console.log('[mains.js] Error:', e.message)
  }
}