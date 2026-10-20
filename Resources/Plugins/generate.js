const axios = require('axios');

module.exports = {
  command: ["generate"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GENERATE ◇\n│ Usage:.generate story about cat\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = global.RENZ_APIKEY;

    try {
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent("Generate creative content: " + prompt)}&apikey=${apikey}`, { timeout: 30000 });

      const answer = data.data || data.result || data.answer || "No result";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GENERATE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Generate failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};