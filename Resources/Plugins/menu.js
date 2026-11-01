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
  const root = path.join(__dirname, '..')
  const possible = [
    path.join(root, 'logo.jpg'),
    path.join(root, 'logo.png'),
    path.join(root, 'logo.jpeg'),
    path.join(root, 'breaker.jpg'),
    path.join(root, 'breaker.png')
  ]
  for(const p of possible){
    if(fs.existsSync(p)) return p
  }
  return null
}

module.exports = async (sock, msg, args, from, {pushName, prefix, command}) => {
  const s = getStats()
  const date = new Date().toLocaleDateString('en-GB')
  const uptime = formatUptime()

  let files = []
  try{
    files = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')).sort()
    files = files.filter(f => f !== 'menu')
  }catch{ files = [] }

  // CATEGORIES - AI FIRST!
  const aiCmds = ["analyse","chatbot","deepseek","explaincode","gemini","gpt","ai","blackbox","dalle","imagine","perplexity","llama"]
  const downloadCmds = ["tomp3","toaudio","tovideo","tosticker","vv","toviewonce","apk","download","facebook","fbaudio","gdrive","image","instagram","itunes","savestatus","song","spotify","tik-image","tiktok","tiktokaudio","twitter","video","xxxvideo","ytmp3","ytmp4","play"]

  let ai = files.filter(f=>aiCmds.includes(f))
  let dl = files.filter(f=>downloadCmds.includes(f))
  let other = files.filter(f=>!aiCmds.includes(f) && !downloadCmds.includes(f))

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

  // OTHER
  if(other.length){
    menu += `\n┌─ ◇ OTHER MENU ◇\n`
    for(const cmd of other){
      menu += `│ ➡️ ${cmd}\n`
    }
    menu += `└─\n`
  }

  menu += `\nTotal: ${s.count} plugins`

  const logoPath = findLogo()
  if(logoPath){
    await sock.sendMessage(from, {image: fs.readFileSync(logoPath), caption: menu}, {quoted: msg})
  }else{
    await sock.sendMessage(from, {text: menu}, {quoted: msg})
  }
}