const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')

function getSettings() {
  try {
    const paths = [
      path.join(__dirname, '..', '..', 'settings.js'),
      path.join(__dirname, '..', '..', 'config.js')
    ]
    for(let p of paths){
      if(fs.existsSync(p)){
        delete require.cache[require.resolve(p)]
        const s = require(p)
        const d = s.getSettings ? s.getSettings() : s.default ? s.default : s
        return {
          owner: d.owner || d.Owner || 'Matsken',
          ownerNumber: d.ownerNumber || '256766800757',
          prefix: d.prefix || '.',
          mode: d.mode || 'public',
          version: d.version || '2.7.0'
        }
      }
    }
  } catch(e){}
  return { owner: 'Matsken', ownerNumber: '256766800757', prefix: '.', mode: 'public', version: '2.7.0' }
}

function getLogo() {
  const c = [path.join(__dirname,'..','Images','logo.jpg'), path.join(__dirname,'..','..','logo.jpg')]
  for(let x of c) if(fs.existsSync(x)) return x
  return null
}

function findPlugin(cmd){
  const base = path.join(__dirname, '..', 'Plugins')
  const alias = {p:'ping'}
  const t = alias[cmd] || cmd
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
  const dateTime = moment().tz('Africa/Kampala').format('DD/MM/YYYY HH:mm') + ' EAT'

  if(!body.startsWith(prefix)) return
  const cmd = body.slice(1).trim().split(/ +/)[0].toLowerCase()
  const args = body.slice(1).trim().split(/ +/).slice(1)
  if(!cmd) return

  // YOUR EXACT CONNECTED PRIVATE MESSAGE - RESTORED
  if(cmd === 'menu' || cmd === 'hi' || cmd === 'hello' || cmd === 'bot'){
    if(isPrivate){
      const connectedMsg = `┌──『 BREAKER-ULTRA MD 』──
│ » Username: ${settings.ownerNumber}:36
│ » Owner: ${settings.owner}
│ » Platform: Linux Panel
│ » Prefix: [ ${prefix} ]
│ » Mode: ${settings.mode}
│ » Version: ${settings.version}
│ » Date & Time: ${dateTime}
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└-------------------
Type *.menu* to see all commands`
      await sock.sendMessage(jid, {text: connectedMsg}, {quoted: msg})
    }

    // Then show AI MENU in your box format
    const base = path.join(__dirname, '..', 'Plugins')
    const allFiles = fs.existsSync(base) ? fs.readdirSync(base).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')) : []
    const exclude = ['ping','menu','repo','update','restart','p']
    const aiFiles = allFiles.filter(f=>!exclude.includes(f.toLowerCase())).sort()

    let aiList = ''
    aiFiles.forEach(f => aiList += `│ ➡️ ${f}\n`)

    const up = Math.floor(process.uptime()/60)
    const aiMenu = `*⚡ BREAKER-ULTRA MD v2.7.0 ⚡*
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 👑 *Owner* : ${settings.owner}
┃ 🔣 *Prefix* : ${prefix}
┃ 🌐 *Mode* : Public
┃ 🔋 *Uptime* : ${up}m
┃ 📅 *Date* : ${dateTime}
┗━━━━━━━━━━━━━━━━━━━━━━┛

┌⊡ ◇ AI MENU ◇
${aiList}└⊡

> Total AI: ${aiFiles.length} cmds`

    const logo = getLogo()
    // Wait 1 sec then send AI menu
    setTimeout(async () => {
      if(logo) await sock.sendMessage(jid, {image: fs.readFileSync(logo), caption: aiMenu}, {quoted: msg})
      else await sock.sendMessage(jid, {text: aiMenu}, {quoted: msg})
    }, 1000)
    return
  }

  const fp = findPlugin(cmd)
  if(fp){
    try{
      delete require.cache[require.resolve(fp)]
      const plug = require(fp)
      if(typeof plug === 'function') await plug(sock, msg, {prefix, args, settings, sock})
      else if(plug.execute) await plug.execute(sock, msg, {prefix, args, settings})
    }catch(e){
      await sock.sendMessage(jid, {text: `❌ ${e.message}`}, {quoted: msg})
    }
  }
}