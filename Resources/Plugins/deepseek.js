const axios = require('axios');

module.exports = {
  command: ["deepseek"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ DEEPSEEK ◇\n│.deepseek hi\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = global.RENZ_APIKEY;

    try {
      // Renz DeepSeek endpoint
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/deepseek?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`, { timeout: 30000 });

      const answer = data.data || data.result || data.answer || "No response";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ DEEPSEEK ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      // Fallback to siputzx
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek?prompt=${encodeURIComponent(prompt)}`, { timeout: 30000 });
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ DEEPSEEK ◇\n│ ${data.data || data.result}\n└─⊷` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ DeepSeek failed: ${e.message}\n└─⊷` }, { quoted: m });
      }
    }
  }
};