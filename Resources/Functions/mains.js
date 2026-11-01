const fs = require('fs')
const path = require('path')
const os = require('os')

const PLUGINS_DIR = path.join(__dirname, '../Plugins')

const config = {
  botName: "BREAKER-ULTRA MD",
  ownerName: "Matsken",
  prefix: ".",
  version: "2.7.0",
  mode: "public"
}

function getHost(){
  let h = os.hostname()
  if(h.length > 20 && h.includes('-')) return "Katabump Host"
  return h
}

function getStats(){
  let count = 0
  try{ count = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).length }catch{}
  const mem = (process.memoryUsage().heapUsed/1024/1024).toFixed(0)
  const tot = (os.totalmem()/1024/1024/1024).toFixed(0)
  const pct = Math.min(99,Math.floor((1-os.freemem()/os.totalmem())*100))
  const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10))
  return { count, mem, tot, pct, bar, host: getHost(), plat: os.platform() }
}

module.exports = async (sock, msg) => {
  try{
    // === WELCOME LIKE TAYLOR'S ULTRAX BOT ===
    if(!msg){
      try{
        const s = getStats()
        let botName = sock.user?.name || config.botName
        if(botName.toLowerCase().includes('beauty')) botName = config.botName
        const dt = new Date().toLocaleString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' EAT'
        
        const welcome = `┌──『 ${config.botName} 』──
│ » Username: ${botName}
│ » Owner: ${config.ownerName}
│ » Platform: ${s.plat}
│ » Host: ${s.host}
│ » Prefix: [ ${config.prefix} ]
│ » Mode: ${config.mode}
│ » Version: v${config.version}
│ » Date & Time: ${dt}
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└──────────────────

Type *${config.prefix}menu* to see all commands`

        await sock.sendMessage(sock.user.id, {text: welcome})
      }catch(e){} return
    }

    if(!msg.message) return
    const from = msg.key.remoteJid
    const pushname = msg.pushName || from.split('@')[0]
    let body = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    if(!body) return
    if(![".", "!", "/"].some(p=>body.startsWith(p))) return
    const prefix = body[0]
    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    if(!command) return
    const start = Date.now()

    const cmdFile = path.join(PLUGINS_DIR, `${command}.js`)
    if(fs.existsSync(cmdFile)){
      try{
        delete require.cache[require.resolve(cmdFile)]
        const p = require(cmdFile)
        if(typeof p === 'function'){ await p(sock, msg, args, from, {pushName:pushname,prefix}); return }
        if(p.execute){ await p.execute(sock, msg, args, from); return }
      }catch(e){}
    }

    // === MENU LIKE CYPHER-X BOX ===
    if(command === 'menu'){
      const files = fs.existsSync(PLUGINS_DIR) ? fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')) : []
      const s = getStats()
      const speed = (Date.now()-start).toFixed(4)
      let botName = sock.user?.name || config.botName
      if(botName.toLowerCase().includes('beauty')) botName = config.botName

      let menu = `┌─⊳ ◈ ${botName} ◈
│ OWNER : ${config.ownerName}
│ USER : ${pushname}
│ PREFIX : [ ${prefix} ]
│ HOST : ${s.host}
│ PLUGINS : ${s.count}
│ MODE : ${config.mode}
│ VERSION : ${config.version}
│ SPEED : ${speed} ms
│ USAGE : ${s.mem} MB of ${s.tot} GB
│ PLATFORM : ${s.plat}
│ RAM: [${s.bar}] ${s.pct}%
└─⊳

┌─⊳ ◈ AI MENU ◈
`
      const aiList = files.filter(f=>['analyze','blackbox','cat','chatbot','dalle','dare','deepseek','dog','explaincode','gemini','generate','gpt'].includes(f))
      const show = aiList.length > 0 ? aiList : files.slice(0,20)
      for(const c of show){ menu += `│ ➳ ${c}\n` }
      menu += `└─⊳`

      await sock.sendMessage(from, {text: menu}, {quoted: msg})
    }

  }catch(e){ console.log(e.message) }
}