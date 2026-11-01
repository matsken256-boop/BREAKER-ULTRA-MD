const fs = require('fs')
const path = require('path')
const os = require('os')
const chalk = require('chalk')
const moment = require('moment-timezone')

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

module.exports = async (sock, msg) => {
  try{
    if(!msg){
      try{
        const s = getStats()
        const dt = new Date().toLocaleString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' EAT'
        const linkedName = sock.user?.name || OWNER
        const welcome = `┌─ ◇ ${BOT_NAME} ◇
│ *Username* : ${linkedName}
│ *Owner* : ${OWNER}
│ *Platform* : ${s.plat}
│ *Host* : ${s.host}
│ *Prefix* : [ ${PREFIX} ]
│ *Mode* : ${MODE}
│ *Version* : v${VERSION}
│ *Date&Time* : ${dt}
│ https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ https://t.me/Matsken1
│ https://github.com/matsken256-boop
└─

Type *${PREFIX}menu* to see all commands`
        await sock.sendMessage(sock.user.id, {text: welcome})
      }catch(e){} return
    }

    if(!msg.message) return
    const from = msg.key.remoteJid
    const sender = msg.key.participant || from
    const pushName = msg.pushName || from.split('@')[0]

    let body = ""
    let mtype = "unknown"
    try {
      // Get real message, unwrap new Baileys 6.7.19 senderKeyDistributionMessage
      let messageContent = msg.message
      mtype = Object.keys(messageContent)[0] || "unknown"
      
      if (messageContent.senderKeyDistributionMessage) {
        // New WhatsApp encryption wrapper - extract inner
        const inner = messageContent.senderKeyDistributionMessage.groupMessage || 
                      messageContent.senderKeyDistributionMessage.axolotlSenderKeyDistributionMessage
        if (inner) {
          messageContent = inner
          mtype = Object.keys(messageContent)[0] || mtype
        }
      }
      
      // Also handle ephemeralMessage wrapper
      if (messageContent.ephemeralMessage) {
        messageContent = messageContent.ephemeralMessage.message
        mtype = Object.keys(messageContent)[0] || mtype
      }
      
      // Also handle viewOnceMessage wrapper
      if (messageContent.viewOnceMessage) {
        messageContent = messageContent.viewOnceMessage.message
        mtype = Object.keys(messageContent)[0] || mtype
      }

      body = messageContent.conversation || 
             messageContent.extendedTextMessage?.text || 
             messageContent.imageMessage?.caption || 
             messageContent.videoMessage?.caption || 
             messageContent.reactionMessage?.text || 
             ""

      // Only mark as Sticker if truly sticker and no text
      if (!body && messageContent.stickerMessage) {
        body = "Sticker"
        mtype = "stickerMessage"
      }
      
      if (!body) body = ""
    } catch (e) {
      body = ""
      mtype = "error"
    }

    try{
      const start = Date.now()
      const time = moment.tz('Africa/Kampala').format('dddd, HH:mm:ss')
      const speed = ((Date.now() - start)/1000).toFixed(3)
      let speedTag = "FAST"
      if(parseFloat(speed) > 1) speedTag = "MODERATE"
      if(parseFloat(speed) > 2) speedTag = "SLOW"

      if(from !== 'status@broadcast'){
        console.log(chalk.hex('#00FFFF')("┌─ ◇ BREAKER-ULTRA ◇"))
        console.log(chalk.hex('#FFD700')(`│ Message Type: ${mtype}`))
        console.log(chalk.hex('#FF69B4')(`│ Message Time: ${time} EAT`))
        console.log(chalk.hex('#7FFF00')(`│ Speed: ${speed}s [ ${speedTag} ]`))
        console.log(chalk.hex('#1E90FF')(`│ Sender: ${sender}`))
        console.log(chalk.hex('#FFA500')(`│ Name: ${pushName}`))
        console.log(chalk.hex('#ADFF2F')(`│ Chat ID: ${from}`))
        const shortMsg = String(body).substring(0,80).replace(/\n/g, " ")
        console.log(chalk.hex('#FFFFFF')(`│ Message: ${shortMsg}`))
        console.log(chalk.hex('#00FFFF')("└──────────────────────────────\n"))
      }
    }catch(e){}

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
        console.log(chalk.red(`❌ Error in ${command}: ${e.message}`))
        await sock.sendMessage(from, {text:`❌ Error in *${command}*:\n${e.message}`}, {quoted: msg})
        return
      }
    }
  }catch(e){ console.log(e.message) }
}