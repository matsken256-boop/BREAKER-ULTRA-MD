const axios = require('axios');
const config = require('../../Config.js');

module.exports = {
  command: ["gpt"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GPT ◇\n│.gpt hello\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = config.apikeys.megan;
    const apiBase = config.apis.megan;

    try {
      const { data } = await axios.get(`${apiBase}/api/ai/gpt`, {
        params: { prompt: prompt, key: apikey, text: prompt },
        timeout: 30000
      });

      const answer = data.result || data.data || data.answer || data.response || "No response";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GPT ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3`, {
          params: { prompt: prompt },
          timeout: 30000
        });
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ GPT ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ AI Error, try again boss.\nError: ${e.message}` }, { quoted: m });
      }
    }
  }
};