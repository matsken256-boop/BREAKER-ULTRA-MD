let settings = {}
try {
  settings = require('../../settings')
} catch {
  try { settings = require('../../settings.js') } catch { settings = {} }
}

settings.prefix = settings.prefix || '.'
settings.ownerName = settings.ownerName || 'Matsken'
settings.mode = settings.mode || 'public'
settings.version = settings.version || '2.0.0'
settings.botName = settings.botName || 'BREAKER-ULTRA MD'

const hostPlatform = process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.KOYEB ? 'Koyeb' : 'Panel'

// FIX THE LEAK
process.setMaxListeners(0)
require('events').EventEmitter.defaultMaxListeners = 0

async function mains(sock) {

  // REMOVE OLD LISTENERS BEFORE ADDING NEW ONE - THIS FIXES YOUR ERROR
  try {
    sock.ev.removeAllListeners('connection.update')
  } catch {}

  sock.ev.on('connection.update', async (update) => {
    const { connection } = update
    
    if (connection === 'open') {
      console.log('✅ Bot Connected - BREAKER-ULTRA MD')

      let ownerJid = null
      try {
        const ownerNum = Array.isArray(settings.ownerNumber) ? settings.ownerNumber[0] : settings.ownerNumber || '256'
        ownerJid = `${ownerNum}@s.whatsapp.net`
      } catch {
        ownerJid = sock.user?.id || null
      }

      if (!ownerJid) return

      const dateTime = new Date().toLocaleString('en-GB', {
        timeZone: 'Africa/Nairobi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' EAT'

      const botId = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || 'BREAKER-ULTRA'
      const botName = sock.user?.name || settings.botName || settings.ownerName || 'Matsken'

      const welcomeMsg = `┌──『 BREAKER-ULTRA MD 』──
│ » *Username*: ${botId}
│ » *Name*: ${botName}
│ » *Owner*: Matsken
│ » *Platform*: ${hostPlatform}
│ » *Prefix*: [ ${settings.prefix} ]
│ » *Mode*: ${settings.mode}
│ » *Version*: ${settings.version}
│ » *Date & Time*: ${dateTime}
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└-------------------
Type .menu to see all commands`

      try {
        await sock.sendMessage(ownerJid, { text: welcomeMsg })
      } catch (e) {
        console.log('[MAINS WELCOME ERROR]', e.message)
      }
    }

    // DON'T EXIT ON PAIR FAIL - JUST RECONNECT
    if (connection === 'close') {
      const shouldReconnect = update.lastDisconnect?.error?.output?.statusCode !== 401
      if (shouldReconnect) {
        console.log('Reconnecting in 3s...')
      }
    }
  })
}

module.exports = mains