const fs = require('fs');
const path = require('path');

module.exports = {
  execute: async (sock, m, args) => {
    const pluginPath = __dirname;
    const count = fs.readdirSync(pluginPath).filter(f => f.endsWith('.js')).length;
    const speed = (Math.random() * 0.6 + 0.2).toFixed(4);
    const used = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);
    const ramPercent = Math.floor(Math.random() * 8) + 80;
    const filled = Math.floor(ramPercent / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);

    const text = `╭─── • ────╮
│ OWNER : MATSKEN
│ PREFIX : [ . ]
│ HOST : Panel
│ PLUGINS : ${count}
│ MODE : Public
│ VERSION : 2.7.0
│ SPEED : ${speed} ms
│ USAGE : ${used} MB of 31 GB
│ RAM: [${bar}] ${ramPercent}%
╰─── • ────╯

┌─⊷ ◇ AI MENU ◇
│ ➳ analyse
│ ➳ chatbot
│ ➳ deepseek
│ ➳ explaincode
│ ➳ gemini
│ ➳ generate
│ ➳ gpt
│ ➳ imagine
│ ➳ programming
│ ➳ summarise
│ ➳ teach
│ ➳ translate
└─⊷

🌟BREAKER-ULTRA-MD🌟 by MATSKEN`;

    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  }
};