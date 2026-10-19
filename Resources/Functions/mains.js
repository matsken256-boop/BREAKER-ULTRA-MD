const fs = require('fs')
const path = require('path')
const os = require('os')
const moment = require('moment-timezone')

function getSettings() {
  try {
    const paths = [path.join(__dirname, '..', '..', 'settings.js'), path.join(__dirname, '..', '..', 'config.js')]
    for(let p of paths){
      if(fs.existsSync(p)){
        delete require.cache[require.resolve(p)]
        const s = require(p)
        const d = s.getSettings ? s.getSettings() : s.default ? s.default : s
        return {
          owner: d.owner || d.Owner || 'Matsken',
          prefix: d.prefix || '.',
          mode: d.mode || 'public',
          version: d.version || '2.7.0'
        }
      }
    }
  } catch(e){}
  return { owner: 'Matsken', prefix: '.', mode: 'public', version: '2.7.0' }
}

function getLogo() {
  const c = [path.join(__dirname,'..','Images','logo.jpg'), path.join(__dirname,'..','..','logo.jpg')]
  for(let x of c) if(fs.existsSync(x)) return x
  return null
}

function findPlugin(cmd){
  const base = path.join(__dirname, '..', 'Plugins')
  const t = {p:'ping'}[cmd] || cmd
  const f1 = path.join(base, `${t}.js`)
  if(fs.existsSync(f1)) return f1
  const f2 = path.join(base, `${cmd}.js`)
  if(fs.existsSync(f2)) return f2
  return null
}

module.exports = async (sock, msg) => {
  if(!msg?.message) return
  const settings = getSettings()
  const prefix = '.'
  const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || ''
  const jid = msg.key.remoteJid
  const isPrivate = !jid.endsWith('@g.us')
  
  // AUTO DETECT USER
  const userName = msg.pushName || msg.message?.extendedTextMessage?.contextInfo?.participant || jid.split('@')[0]
  const userJid = jid.split('@')[0] + ':36'
  const platform = os.hostname() ? `${os.platform()} - ${os.hostname()}` : 'Linux Panel'
  const hostPlatform = os.type().includes('Linux') ? 'Linux Panel' : os.platform()
  // AUTO DETECT TIME BY USER LOCATION (Kampala)
  const dateTime = moment().tz('Africa/Kampala').format('DD/MM/YYYY HH:mm') + ' EAT'
  const userTime = moment().tz(moment.tz.guess() || 'Africa/Kampala').format('DD/MM/YYYY HH:mm z')

  if(!body.startsWith(prefix)) return
  const cmd = body.slice(1).trim().split(/ +/)[0].toLowerCase()
  const args = body.slice(1).trim().split(/ +/).slice(1)
  if(!cmd) return

  if(cmd === 'menu' || cmd === 'hi' || cmd === 'hello'){
    // AUTO DETECTED CONNECTED MESSAGE
    const connectedMsg = `┌──『 BREAKER-ULTRA MD 』──
│ » Username: ${userJid}
│ » Name: ${userName}
│ » Owner: ${settings.owner}
│ » Platform: ${hostPlatform}
│ » Prefix: [ ${prefix} ]
│ » Mode: ${settings.mode}
│ » Version: ${settings.version}
│ » Date & Time: ${dateTime}
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└-------------------
Type *.menu* to see all commands`

    if(isPrivate){
      await sock.sendMessage(j