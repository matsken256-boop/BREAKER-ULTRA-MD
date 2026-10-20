const axios = require('axios');

module.exports = {
  command: ["translate"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ TRANSLATE ◇\n│ Usage:.translate hello to swahili\n└─⊷" }, { quoted: m });

    const apikey = global.RENZ_APIKEY;

    try {
      const prompt = `Translate this and also detect languages. Show Original -> Translated. User wrote: ${args.join(' ')}`;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`, { timeout: 30000 });

      const answer = data.data || data.result || data.answer || "No translation";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ TRANSLATE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Translate failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};