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
  const userNumber = from.split('@')[0]

  let files = []
  try{
    files = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')).sort()
    files = files.filter(f => f !== 'menu')
  }catch{ files = [] }

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

┌─ ◇ ALL COMMANDS ◇
`

  for(const cmd of files){
    menu += `│ ➡️ ${cmd}\n`
  }

  menu += `└─
Total: ${s.count} plugins`

  const logoPath = findLogo()
  if(logoPath){
    await sock.sendMessage(from, {image: fs.readFileSync(logoPath), caption: menu}, {quoted: msg})
  }else{
    await sock.sendMessage(from, {text: menu}, {quoted: msg})
  }
}