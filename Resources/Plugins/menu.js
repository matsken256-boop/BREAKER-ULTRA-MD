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

  let menu = `⚡ BREAKER-ULTRA MD v${VERSION} ⚡
┌───────────────
│ 👤 *Username* : ${pushName}
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