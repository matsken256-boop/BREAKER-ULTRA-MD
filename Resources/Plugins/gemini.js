const axios = require('axios');
const config = require('../../Config.js');

module.exports = {
  command: ["gemini"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GEMINI ◇\n│ Usage:.gemini hello\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = config.apikeys.megan;
    const apiBase = config.apis.megan;

    try {
      const { data } = await axios.get(`${apiBase}/api/ai/gemini`, {
        params: { prompt: prompt, key: apikey, text: prompt },
        timeout: 30000
      });

      const answer = data.result || data.data || data.answer || data.response || "No response";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GEMINI ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gemini`, {
          params: { prompt: prompt },
          timeout: 30000
        });
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ GEMINI ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Gemini failed: ${e.message}\n└─⊷` }, { quoted: m });
      }
    }
  }
};