const fs = require('fs')
const path = require('path')
const os = require('os')
const moment = require('moment-timezone')

let welcomeSent = false

function getSettings() {
  try {
    const paths = [path.join(__dirname, '..', '..', 'settings.js'), path.join(__dirname, '..', '..', 'config.js')]
    for(let p of paths){
      if(fs.existsSync(p)){
        delete require.cache[require.resolve(p)]
        const s = require(p)
        const d = s.getSettings ? s.getSettings() : s.default ? s.default : s
        return {
          owner: 'Matsken',
          ownerNumber: d.ownerNumber || d.OwnerNumber || '',
          prefix: d.prefix || '.',
          mode: d.mode || 'public',
          version: d.version || '2.7.0'
        }
      }
    }
  } catch(e){}
  return { owner: 'Matsken', ownerNumber: '', prefix: '.', mode: 'public', version: '2.7.0' }
}

function getLogo() {
  const c = [path.join(__dirname,'..','Images','logo.jpg'), path.join(__dirname,'..','..','logo.jpg'), path.join(__dirname,'logo.jpg')]
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

async function sendWelcome(sock, settings, msg, jid){
  if(welcomeSent) return
  welcomeSent = true
  try {
    await new Promise(r => setTimeout(r, 2000))
    const rawId = sock.user?.id || msg?.key?.participant || jid || ''
    const phoneOnly = rawId.split(':')[0].split('@')[0].replace(/[^0-9]/g, '')
    const botId = phoneOnly || 'Unknown'
    const botName = msg?.pushName || sock.user?.name || 'WhatsApp User'
    const dateTime = moment().tz('Africa/Kampala').format('DD/MM/YYYY HH:mm') + ' EAT'
    const hostPlatform = os.type().includes('Linux') ? 'Linux Panel' : os.platform()
    let ownerDigits = (settings.ownerNumber || process.env.OWNER_NUMBER || phoneOnly).replace(/[^0-9]/g, '')
    if(!ownerDigits) ownerDigits = phoneOnly

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

    const ownerJid = `${ownerDigits}@s.whatsapp.net`
    console.log(`[BREAKER] Auto-detected User: ${botName} (${botId}) -> Sending to ${ownerJid}`)
    await sock.sendMessage(ownerJid, { text: welcomeMsg })
    console.log(`✅ Welcome sent to ${ownerJid}`)
  } catch(e){
    console.log('Welcome error:', e.message)
  }
}

module.exports = async (sock, msg) => {
  if(!msg?.message) return
  const settings = getSettings()
  const prefix = '.'
  const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || ''
  const jid = msg.key.remoteJid

  if(!welcomeSent){
    await sendWelcome(sock, settings, msg, jid)
  }

  if(!body.startsWith(prefix)) return
  const cmd = body.slice(1).trim().split(/ +/)[0].toLowerCase()
  const args = body.slice(1).trim().split(/ +/).slice(1)
  if(!cmd) return

  if(cmd === 'menu'){
    const dateTime = moment().tz('Africa/Kampala').format('DD/MM/YYYY HH:mm') + ' EAT'
    const up = Math.floor(process.uptime() / 60)
    const hostPlatform = os.type().includes('Linux') ? 'Linux Panel' : os.platform()

    const pluginsPath = path.join(__dirname, '..', 'Plugins')
    let files = fs.existsSync(pluginsPath) ? fs.readdirSync(pluginsPath).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')) : []
    const exclude = ['ping','menu','repo','update','restart','p']
    const aiList = files.filter(f=>!exclude.includes(f.toLowerCase())).sort()

    let aiText = ''
    for(let f of aiList) aiText += `│ ➡️ ${f}\n`

    const menuText = `⚡ BREAKER-ULTRA MD v${settings.version} ⚡
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 👑 *Owner* : Matsken
┃ 🔣 *Prefix* : ${prefix}
┃ 🌐 *Mode* : ${settings.mode}
┃ 🔋 *Uptime* : ${up}m
┃ 📅 *Date* : ${dateTime}
┃ 🖥️ *Platform*: ${hostPlatform}
┗━━━━━━━━━━━━━━━━━━━━━━┛

┌⊡ ◇ AI MENU ◇
${aiText}└⊡

> Total AI: ${aiList.length} cmds`

    const logo = getLogo()
    if(logo){
      await sock.sendMessage(jid, { image: fs.readFileSync(logo), caption: menuText }, { quoted: msg })
    } else {
      await sock.sendMessage(jid, { text: menuText }, { quoted: msg })
    }
    return
  }

  const pluginPath = findPlugin(cmd)
  if(pluginPath){
    try{
      delete require.cache[require.resolve(pluginPath)]
      const plugin = require(pluginPath)
      if(typeof plugin === 'function'){
        await plugin(sock, msg, args)
      } else if(plugin.execute){
        await plugin.execute(sock, msg, args)
      }
    }catch(e){
      console.log(`Plugin ${cmd} error:`, e.message)
    }
  }
}