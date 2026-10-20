const axios = require('axios');

module.exports = {
  command: ["translate"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ TRANSLATE ◇\n│ Usage:.translate hello to swahili\n└─⊷" }, { quoted: m });

    const API_KEY = "megan_f6ef183d3b34ffee32a022e038f91847";
    const API_BASE = "https://megan-api.vercel.app";

    try {
      const prompt = `Translate this and also detect languages. Show Original -> Translated. User wrote: ${args.join(' ')}`;
      const { data } = await axios.get(`${API_BASE}/api/ai/gpt`, {
        params: {
          prompt: prompt,
          key: API_KEY,
          text: prompt
        },
        timeout: 30000
      });

      const answer = data.result || data.data || data.answer || data.response || "No translation";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ TRANSLATE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Translate failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};