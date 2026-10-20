const axios = require('axios');
const config = require('../../Config.js');

module.exports = {
  command: ["generate"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GENERATE ◇\n│ Usage:.generate story about cat\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = config.apikeys.megan;
    const apiBase = config.apis.megan;

    try {
      const { data } = await axios.get(`${apiBase}/api/ai/gpt`, {
        params: { prompt: "Generate creative content: " + prompt, key: apikey, text: prompt },
        timeout: 30000
      });

      const answer = data.result || data.data || data.answer || data.response || "No result";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GENERATE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Generate failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};