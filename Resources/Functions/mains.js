const fs = require('fs')
const path = require('path')
const os = require('os')

const PLUGINS_DIR = path.join(__dirname, '../Plugins')
const BOT_NAME = "BREAKER-ULTRA MD"
const OWNER = "matsken"
const PREFIX = "."
const VERSION = "2.7.0"
const MODE = "public"

function getHost(){
  let h = os.hostname()
  if(h.length > 20 && h.includes('-')) return "Katabump Host"
  return h
}

function getStats(){
  let count = 0
  try{ count = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).length }catch{}
  return { count, host: getHost(), plat: os.platform() }
}

function formatUptime(){
  let s = process.uptime()
  let h = Math.floor(s/3600)
  let m = Math.floor((s%3600)/60)
  let sec = Math.floor(s%60)
  return `${h}h ${m}m ${sec}s`
}

module.exports = async (sock, msg) => {
  try{
    if(!msg){
      try{
        const s = getStats()
        const dt = new Date().toLocaleString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' EAT'
        // Username = exact WhatsApp username of linked account
        const linkedName = sock.user?.name || sock.user?.verifiedName || OWNER
        const welcome = `⚡ ${BOT_NAME} ⚡
┌──『 ${BOT_NAME} 』──
│ » Username: ${linkedName}
│ » Owner: ${OWNER}
│ » Platform: ${s.plat}
│ » Host: ${s.host}
│ » Prefix: [ ${PREFIX} ]
│ » Mode: ${MODE}
│ » Version: v${VERSION}
│ » Date & Time: ${dt}
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└──────────────────

Type *${PREFIX}menu* to see all commands`
        await sock.sendMessage(sock.user.id, {text: welcome})
      }catch(e){} return
    }

    if(!msg.message) return
    const from = msg.key.remoteJid
    const pushName = msg.pushName || from.split('@')[0]
    const userNumber = from.split('@')[0]
    let body = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    if(!body) return
    if(![".", "!", "/"].some(p=>body.startsWith(p))) return
    const prefix = body[0]
    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    if(!command) return

    const cmdFile = path.join(PLUGINS_DIR, `${command}.js`)
    if(fs.existsSync(cmdFile)){
      try{
        delete require.cache[require.resolve(cmdFile)]
        const p = require(cmdFile)
        if(typeof p === 'function'){ await p(sock, msg, args, from, {pushName,prefix,command}); return }
        if(p && typeof p.execute === 'function'){ await p.execute(sock, msg, args, from, {pushName,prefix,command}); return }
        if(p && typeof p.default === 'function'){ await p.default(sock, msg, args, from, {pushName,prefix,command}); return }
        if(p && typeof p.run === 'function'){ await p.run(sock, msg, args, from, {pushName,prefix,command}); return }
      }catch(e){
        await sock.sendMessage(from, {text:`❌ Error in *${command}*:\n${e.message}`}, {quoted: msg})
        return
      }
    }

    if(command === 'menu'){
      const s = getStats()
      const date = new Date().toLocaleDateString('en-GB')
      const uptime = formatUptime()
      let files = []
      try{ files = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')).sort() }catch{ files = [] }

      let menu = `⚡ BREAKER-ULTRA MD v${VERSION} ⚡
┌───────────────
│ 👤 *Username* : ${pushName}
│ 📱 *Number* : ${userNumber}
│ 🤖 *Bot Name* : ${BOT_NAME}
│ 👑 *Owner* : ${OWNER}
│ 🔹 *Prefix* : ${prefix}
│ 🔸 *Mode* : ${MODE}
│ 🔋 *Uptime* : ${uptime}
│ 📅 *Date* : ${date}
│ 💻 *Platform*: ${s.plat}
└───────────────

◇ ALL COMMANDS ◇
`

      for(const cmd of files){
        menu += `│ 📥 ${cmd}\n`
      }

      menu += `└───────────────
Total: ${s.count} plugins - auto fetched`

      await sock.sendMessage(from, {text: menu}, {quoted: msg})
    }

  }catch(e){ console.log(e.message) }
}