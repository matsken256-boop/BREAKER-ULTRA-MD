const fs = require('fs')
const path = require('path')
const os = require('os')

const PLUGINS_DIR = path.join(__dirname, '../Plugins')
const ROOT_DIR = path.join(__dirname, '../../')

const config = {
  botName: "BREAKER-ULTRA MD",
  ownerName: "Matsken", // change in one place only
  prefix: ".",
  version: "2.7.0",
  mode: "public"
}

function findLogo() {
  try {
    const files = fs.readdirSync(ROOT_DIR)
    for (const f of files) {
      const l = f.toLowerCase()
      if ((l.includes('logo') || l.includes('breaker') || l.includes('beauty')) && (l.endsWith('.jpg') || l.endsWith('.png') || l.endsWith('.jpeg'))) {
        return path.join(ROOT_DIR, f)
      }
    }
  } catch {}
  return null
}

function getStats() {
  let count = 0
  try { count = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).length } catch {}
  const memUsed = (process.memoryUsage().heapUsed/1024/1024).toFixed(0)
  const totalGB = (os.totalmem()/1024/1024/1024).toFixed(0)
  const percent = Math.floor((1 - os.freemem()/os.totalmem())*100)
  const bar = '█'.repeat(Math.floor(percent/10)) + '░'.repeat(10-Math.floor(percent/10))
  const platform = os.platform() // linux, win32, darwin
  const host = os.hostname()
  return { count, memUsed, totalGB, percent, bar, platform, host }
}

module.exports = async (sock, msg) => {
  try {
    if (!msg) {
      try {
        const s = getStats()
        const botWAName = sock.user?.name || config.botName // AUTO from WhatsApp account name
        const dateTime = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false })+' EAT'
        
        const welcomeMsg = `┌─⊳ ◈ ${config.botName} ◈
│ OWNER : ${config.ownerName}
│ BOT NAME : ${botWAName}
│ PREFIX : [ ${config.prefix} ]
│ HOST : ${s.host}
│ PLUGINS : ${s.count}
│ MODE : ${config.mode}
│ VERSION : ${config.version}
│ PLATFORM : ${s.platform}
│ DATE : ${dateTime}
│ RAM: [${s.bar}] ${s.percent}%
└─⊳

https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
https://t.me/Matsken1
https://github.com/matsken256-boop

Hello! I am *${botWAName}*, ready for everyone.
Type *${config.prefix}menu* to see all commands`;
        await sock.sendMessage(sock.user.id, { text: welcomeMsg })
      } catch {}
      return
    }

    if (!msg.message) return
    const from = msg.key.remoteJid
    const pushname = msg.pushName || from.split('@')[0] // AUTO WhatsApp username of user who typed
    let body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ''
    if (!body) return
    if (![".", "!", "/"].some(p => body.startsWith(p))) return
    const prefix = body[0]
    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    if