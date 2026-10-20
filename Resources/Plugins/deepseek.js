const axios = require('axios');
const config = require('../../Config.js'); // adjust path if Config is in root: use ../../Config.js or ../Config.js

module.exports = {
  command: ["deepseek"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ DEEPSEEK ◇\n│.deepseek hi\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = config.apikeys.megan; // megan_f6ef183d3b34ffee32a022e038f91847
    const apiBase = config.apis.megan;

    try {
      // MEGAN DeepSeek endpoint
      const { data } = await axios.get(`${apiBase}/api/ai/deepseek`, { 
        params: { prompt: prompt, key: apikey, text: prompt },
        timeout: 30000 
      });

      const answer = data.result || data.data || data.answer || data.response || "No response";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ DEEPSEEK ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      // Fallback to siputzx (free, no key)
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek`, { 
          params: { prompt: prompt },
          timeout: 30000 
        });
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ DEEPSEEK ◇\n│ ${data.data || data.result}\n└─⊷` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ DeepSeek failed: ${e.message}\n└─⊷` }, { quoted: m });
      }
    }
  }
};