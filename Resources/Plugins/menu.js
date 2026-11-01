const fs = require('fs')
const path = require('path')
const os = require('os')

const BOT_NAME = "BREAKER-ULTRA MD"
const OWNER = "matsken"
const VERSION = "2.7.0"
const MODE = "public"
const PLUGINS_DIR = __dirname

function getStats(){
  let count = 0
  try{ count = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).length }catch{}
  return { count, plat: os.platform() }
}

function formatUptime(){
  let s = process.uptime()
  let h = Math.floor(s/3600)
  let m = Math.floor((s%3600)/60)
  let sec = Math.floor(s%60)
  return `${h}h ${m}m ${sec}s`
}

function findLogo(){
  const bases = [
    path.join(__dirname, '..'),
    process.cwd(),
    '/home/container',
    path.join(__dirname, '../..'),
    __dirname
  ]
  const names = ['logo.jpg','logo.png','logo.jpeg','breaker.jpg','breaker.png','thumb.jpg']
  for(const base of bases){
    for(const name of names){
      const p = path.join(base, name)
      if(fs.existsSync(p)) return p
    }
  }
  return null
}

module.exports = async (sock, msg, args, from, {pushName, prefix}) => {
  const s = getStats()
  const date = new Date().toLocaleDateString('en-GB')
  const uptime = formatUptime()

  let files = []
  try{
    files = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')).sort()
    files = files.filter(f => f !== 'menu')
  }catch{ files = [] }

  // ONLY TWO MENUS!
  const aiCmds = ["analyse","chatbot","deepseek","explaincode","gemini","gpt","ai","blackbox","dalle","imagine","perplexity","llama","generate","programming","summarise","teach","translate","ping"]
  const downloadCmds = ["tomp3","toaudio","tovideo","tosticker","vv","toviewonce","apk","download","facebook","fbaudio","gdrive","image","instagram","itunes","savestatus","song","spotify","tik-image","tiktok","tiktokaudio","twitter","video","xxxvideo","ytmp3","ytmp4","play","tiktokimage"]

  let ai = files.filter(f=>aiCmds.includes(f))
  let dl = files.filter(f=>downloadCmds.includes(f))
  // REMOVED OTHER MENU - Everything else goes to AI if not download

  let menu = `┌─ ◇ ${BOT_NAME} ◇
│ 👤 *Username* : ${pushName}
│ 👑 *Owner* : ${OWNER}
│ 🔹 *Prefix* : [ ${prefix} ]
│ 🔸 *Mode* : ${MODE}
│ 🔋 *Uptime* : ${uptime}
│ 📅 *Date* : ${date}
│ 💻 *Platform* : ${s.plat}
│ 📦 *Plugins* : ${s.count}
└─
`

  // AI MENU FIRST!
  if(ai.length){
    menu += `\n┌─ ◇ AI MENU ◇\n`
    for(const cmd of ai){
      menu += `│ ➡️ ${cmd}\n`
    }
    menu += `└─\n`
  }

  // DOWNLOAD MENU SECOND!
  if(dl.length){
    menu += `\n┌─ ◇ DOWNLOAD MENU ◇\n`
    for(const cmd of dl){
      menu += `│ ➡️ ${cmd}\n`
    }
    menu += `└─\n`
  }

  menu += `\nTotal: ${s.count} plugins`

  const logoPath = findLogo()
  console.log("LOGO FOUND:", logoPath)
  if(logoPath){
    try{
      await sock.sendMessage(from, {image: fs.readFileSync(logoPath), caption: menu}, {quoted: msg})
    }catch(e){
      console.log("LOGO SEND ERROR:", e)
      await sock.sendMessage(from, {text: menu}, {quoted: msg})
    }
  }else{
    await sock.sendMessage(from, {text: menu}, {quoted: msg})
  }
}