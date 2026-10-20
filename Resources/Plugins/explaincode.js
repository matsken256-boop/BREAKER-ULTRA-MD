const axios = require('axios');
const config = require('../../Config.js');

module.exports = {
  command: ["explaincode"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ EXPLAINCODE ◇\n│ Usage:.explaincode console.log('hi')\n└─⊷" }, { quoted: m });

    const code = args.join(' ');
    const apikey = config.apikeys.megan; // megan_f6ef183d3b34ffee32a022e038f91847
    const apiBase = config.apis.megan;

    try {
      const prompt = `Explain this code in simple way, line by line, for beginners:\n\n${code}`;
      const { data } = await axios.get(`${apiBase}/api/ai/gpt`, { 
        params: { prompt: prompt, key: apikey, text: prompt },
        timeout: 30000 
      });

      const answer = data.result || data.data || data.answer || data.response || "No explanation";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ EXPLAINCODE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed to explain: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};