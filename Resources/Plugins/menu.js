const { runtime } = require('../resources/utils');

module.exports = {
  execute: async (sock, m, args) => {
    const moment = require('moment-timezone');
    const date = moment().tz('Africa/Kampala').format('DD/MM/YYYY HH:mm');
    const uptime = runtime(process.uptime());

    const text = `⚡ BREAKER-ULTRA MD v2.7.0 ⚡
┌──
┐
│ 👑 *Owner* : Matsken
│ 🔣 *Prefix* : .
│ 🌐 *Mode* : public
│ 🔋 *Uptime* : ${uptime}
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