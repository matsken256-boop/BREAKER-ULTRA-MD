const axios = require('axios');

module.exports = {
  command: ["analyse"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ ANALYSE ◇\n│ Usage:.analyse what is love\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = global.RENZ_APIKEY; // <- FIXED, uses your socket/index.js key

    try {
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent("Analyse this in detail: " + prompt)}&apikey=${apikey}`, { timeout: 30000 });

      const answer = data.data || data.result || data.answer || "No analysis";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ ANALYSE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};