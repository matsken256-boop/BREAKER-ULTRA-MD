const axios = require('axios');

module.exports = {
  command: ["explaincode"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ EXPLAINCODE ◇\n│ Usage:.explaincode console.log('hi')\n└─⊷" }, { quoted: m });

    const code = args.join(' ');
    const apikey = global.RENZ_APIKEY;

    try {
      const prompt = `Explain this code in simple way, line by line, for beginners:\n\n${code}`;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`, { timeout: 30000 });

      const answer = data.data || data.result || data.answer || "No explanation";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ EXPLAINCODE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed to explain: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};