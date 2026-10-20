const axios = require('axios');

module.exports = {
  command: ["gemini"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GEMINI ◇\n│ Usage:.gemini hello\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = global.RENZ_APIKEY;

    try {
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gemini?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`, { timeout: 30000 });

      const answer = data.data || data.result || data.answer || "No response";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GEMINI ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gemini?prompt=${encodeURIComponent(prompt)}`, { timeout: 30000 });
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ GEMINI ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Gemini failed: ${e.message}\n└─⊷` }, { quoted: m });
      }
    }
  }
};