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
      if ((l.includes('logo') || l.includes('breaker') || l.includes('thumb') || l.includes('beauty')) && (l.endsWith('.jpg') || l.endsWith('.png') || l.endsWith('.jpeg'))) {
        return path.join(ROOT_DIR, f)
      }
    }
    for (const f of files) { if (f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')) return path.join(ROOT_DIR, f) }
  } catch {}
  return null
}

let pluginsLoader = null
try {
  const pPath = path.join(__dirname, 'plugins.js')
  if (fs.existsSync(pPath)) pluginsLoader = require('./plugins.js')
} catch {}

module.exports = async (sock, msg, extra) => {
  try {
    // 1. WELCOME - TEXT ONLY, NO LOGO (as you wanted)
    if (!msg) {
      try {
        const selfJid = sock.user.id
        const dt = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })
        const welcomeMsg = `┌──『 ${BOT_NAME} 』──
│ Bot: ${BOT_NAME}
│ Owner: ${OWNER_NAME}
│ Prefix: [ . / ]
│ Mode: public ✅
│ Date: ${dt}
│ GitHub: github.com/matsken256-boop
│ Telegram: @Matsken1
└----------------

Type .menu`

        // NO IMAGE HERE - TEXT ONLY
        await sock.sendMessage(selfJid, { text: welcomeMsg })
        console.log('[mains.js] Welcome TEXT sent (no logo)')
      } catch (e) {}
      return
    }

    if (!msg.message) return
    const from = msg.key.remoteJid
    const pushName = msg.pushName || 'User'
    let body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || msg.message.ephemeralMessage?.message?.extendedTextMessage?.text || ''
    if (!body) return
    if (!PREFIXES.some(p => body.startsWith(p))) return
    
    const usedPrefix = PREFIXES.find(p => body.startsWith(p))
    const args = body.slice(usedPrefix.length).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    if (!command) return
    console.log(`[CMD] ${usedPrefix}${command}`)

    // 2. SPECIAL HANDLERS - MENU WITH LOGO, PING FIXED

    if (command === 'menu' || command === 'help') {
      let txt = `*${BOT_NAME}*\nHello *${pushName}* 👋\n\n╭─『 INFO 』\n│ Owner: ${OWNER_NAME}\n│ GitHub: matsken256-boop\n│ Telegram: @Matsken1\n│ Prefix: ${PREFIXES.join(' ')}\n╰────────────\n\n*COMMANDS:*\n`
      try {
        if (fs.existsSync(PLUGINS_DIR)) {
          const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js')).map(f => f.replace('.js','')).sort()
          txt += files.map(c => `│ • ${usedPrefix}${c}`).join('\n')
        }
      } catch {}
      txt += `\n\n*Powered by ${BOT_NAME}*`
      
      const logoPath = findLogo()
      if (logoPath && fs.existsSync(logoPath)) {
        await sock.sendMessage(from, { image: fs.readFileSync(logoPath), caption: txt }, { quoted: msg })
        console.log('[mains.js] Menu WITH LOGO sent')
      } else {
        await sock.sendMessage(from, { text: txt }, { quoted: msg })
      }
      return
    }

    if (command === 'ping' || command === 'alive' || command === 'speed') {
      // Try your real ping.js file first
      const pingPaths = [
        path.join(PLUGINS_DIR, 'ping.js'),
        path.join(ROOT_DIR, 'Plugins/ping.js'),
        path.join(__dirname, '../Plugins/ping.js')
      ]
      for (const pPath of pingPaths) {
        if (fs.existsSync(pPath)) {
          try {
            delete require.cache[require.resolve(pPath)]
            const pingPlugin = require(pPath)
            if (typeof pingPlugin === 'function') {
              await pingPlugin(sock, msg, args, from, { pushName })
              return
            }
            if (pingPlugin.execute) {
              await pingPlugin.execute(sock, msg, args, from)
              return
            }
          } catch (e) { console.log('ping.js error', e.message) }
        }
      }
      // Fallback if ping.js fails
      const start = Date.now()
      await sock.sendMessage(from, { text: `*Pong! ⚡*\nSpeed: ${Date.now() - start}ms\n${BOT_NAME} Active` }, { quoted: msg })
      return
    }

    // 3. ALL OTHER PLUGINS - FETCH ALL FOLDER
    try {
      // Try plugins.js loader
      if (pluginsLoader) {
        if (typeof pluginsLoader === 'function') {
          const done = await pluginsLoader(sock, msg, command, args, from, { pushName, prefix: usedPrefix })
          if (done) return
        }
        if (pluginsLoader[command]) {
          await pluginsLoader[command](sock, msg, args, from)
          return
        }
      }
      // Direct file fetch - TRY ALL CASES
      const cmdFile = path.join(PLUGINS_DIR, `${command}.js`)
      if (fs.existsSync(cmdFile)) {
        delete require.cache[require.resolve(cmdFile)]
        const plugin = require(cmdFile)
        // Try all possible signatures your plugins might use
        try {
          if (typeof plugin === 'function') {
            await plugin(sock, msg, args, from, { pushName, prefix: usedPrefix })
          } else if (plugin.default) {
            await plugin.default(sock, msg, args)
          } else if (plugin.execute) {
            await plugin.execute(sock, msg, args, from)
          }
        } catch (e) {
          // Second try different signature
          try { await plugin(msg, sock, args) } catch {}
        }
        return
      }
    } catch (e) { console.log('[mains.js] plugin error', e.message) }

  } catch (e) { console.log('[mains.js] Fatal', e.message) }
}