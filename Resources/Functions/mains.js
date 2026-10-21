let settings = {}
try {
  settings = require('../../config') // you had settings, but your file is config.js
} catch {
  try { settings = require('../../settings') } catch { settings = {} }
}
try {
  const cfg2 = require('../../config.js')
  settings = { ...settings, ...cfg2 }
} catch {}

settings.prefix = settings.prefix || '.'
settings.ownerName = settings.ownerName || 'Matsken'
settings.mode = settings.mode || 'public'
settings.version = settings.version || '2.0.0'
settings.botName = settings.botName || 'BREAKER-ULTRA MD'
settings.ownerNumber = settings.ownerNumber || ["2567XXXXXXXX"]

const fs = require('fs')
const path = require('path')
const hostPlatform = process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.KOYEB ? 'Koyeb' : 'Panel'

process.setMaxListeners(0)
require('events').EventEmitter.defaultMaxListeners = 0

async function mains(sock, m) {
  // --- PART 1: CONNECTION (Welcome Message) - Only run once ---
  sock.ev.removeAllListeners('connection.update')
  
  sock.ev.on('connection.update', async (update) => {
    const { connection } = update
    if (connection === 'open') {
      console.log('✅ Bot Connected - BREAKER-ULTRA MD')
      let ownerJid = null
      try {
        const ownerNum = Array.isArray(settings.ownerNumber) ? settings.ownerNumber[0] : settings.ownerNumber
        ownerJid = `${ownerNum}@s.whatsapp.net`
      } catch {
        ownerJid = sock.user?.id || null
      }
      if (!ownerJid) return

      const dateTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) + ' EAT'
      const botId = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || 'BREAKER-ULTRA'
      const botName = sock.user?.name || settings.botName

      const welcomeMsg = `┌──『 BREAKER-ULTRA MD 』──
│ » *Username*: ${botId}
│ » *Name*: ${botName}
│ » *Owner*: ${settings.ownerName}
│ » *Platform*: ${hostPlatform}
│ » *Prefix*: [ ${settings.prefix} ]
│ » *Mode*: ${settings.mode}
│ » *Version*: ${settings.version}
│ » *Date & Time*: ${dateTime}
└-------------------
Type .menu to see all commands`

      try { await sock.sendMessage(ownerJid, { text: welcomeMsg }) } catch (e) { console.log('[WELCOME ERROR]', e.message) }
    }
  })

  // --- PART 2: MESSAGE HANDLER - THIS WAS MISSING - FIXES NO REPLY ---
  if (!m) return; // if called from socket/index.js without message, skip
  try {
    const msg = m
    if (!msg.message) return
    
    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const type = Object.keys(msg.message)[0]
    const body = (type === 'conversation' && msg.message.conversation) ? msg.message.conversation : (type === 'extendedTextMessage' && msg.message.extendedTextMessage.text) ? msg.message.extendedTextMessage.text : (type === 'imageMessage' && msg.message.imageMessage.caption) ? msg.message.imageMessage.caption : (type === 'videoMessage' && msg.message.videoMessage.caption) ? msg.message.videoMessage.caption : ''
    
    if (!body) return
    
    // Check prefix
    const prefixes = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix]
    let prefix = prefixes.find(p => body.startsWith(p))
    if (!prefix) return // not a command
    
    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    
    // Owner check if private mode
    const sender = msg.key.participant || from
    const ownerNums = (Array.isArray(settings.ownerNumber) ? settings.ownerNumber : [settings.ownerNumber]).map(n => n.replace(/[^0-9]/g,''))
    const isOwner = ownerNums.some(n => sender.includes(n))
    
    if (settings.mode === 'private' && !isOwner && settings.public === false) {
        return // ignore non-owners in private mode
    }

    console.log(`[CMD] ${command} from ${sender} in ${isGroup ? 'group' : 'private'}`)

    // Load command file
    const pluginsDir = path.join(__dirname, '../plugins')
    const commandsDir = path.join(__dirname, '../commands')
    let cmdPath = null
    
    if (fs.existsSync(pluginsDir)) {
        const files = fs.readdirSync(pluginsDir)
        for (let f of files) {
            if (f.toLowerCase() === `${command}.js` || f.toLowerCase().startsWith(command)) {
                cmdPath = path.join(pluginsDir, f)
                break
            }
        }
    }
    if (!cmdPath && fs.existsSync(commandsDir)) {
        const files = fs.readdirSync(commandsDir)
        for (let f of files) {
            if (f.toLowerCase() === `${command}.js`) {
                cmdPath = path.join(commandsDir, f)
                break
            }
        }
    }

    // Fallback: menu/ping built-in for testing
    if (command === 'ping' || command === 'menu' || command === 'alive') {
        await sock.sendMessage(from, { text: `✅ BREAKER-ULTRA MD is alive!\n\nCommand: ${prefix}${command}\nMode: ${settings.mode}\nPrefix: ${prefix}\nBot: ${settings.botName}` }, { quoted: msg })
        return
    }

    if (cmdPath) {
        const cmd = require(cmdPath)
        if (typeof cmd === 'function') {
            await cmd(sock, msg, args, { settings, prefix, command, from, isGroup, isOwner })
        } else if (cmd.run || cmd.execute) {
            await (cmd.run || cmd.execute)(sock, msg, args, { settings })
        }
    }

  } catch (err) {
    console.log('[MAINS MSG ERROR]', err.message)
  }
}

module.exports = mains
