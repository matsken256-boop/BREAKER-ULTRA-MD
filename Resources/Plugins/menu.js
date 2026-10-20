module.exports = {
  execute: async (sock, m, args) => {
    const up = Math.floor(process.uptime() / 60);
    const moment = require('moment-timezone');
    const date = moment().tz('Africa/Kampala').format('DD/MM/YYYY HH:mm');

    const text = `⚡ BREAKER-ULTRA MD v2.7.0 ⚡
⚡
┌──
┐
│ 👑 *Owner* : Matsken
│ 🔣 *Prefix* : .
│ 🌐 *Mode* : public
│ 🔋 *Uptime* : ${up}m
│ 📅 *Date* : ${date} EAT
│ 🖥️ *Platform*: Linux Panel
└──
┘

┌⊡ ◇ AI MENU ◇
│ ➡️ analyse
│ ➡️ chatbot
│ ➡️ deepseek
│ ➡️ explaincode
│ ➡️ gemini
│ ➡️ generate
│ ➡️ gpt
│ ➡️ imagine
│ ➡️ programming
│ ➡️ summarise
│ ➡️ teach
│ ➡️ translate
└⊡`;

    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  }
}