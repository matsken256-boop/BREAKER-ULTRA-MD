const axios = require('axios');
const config = require('../../Config.js');

module.exports = {
  command: ["programming"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ PROGRAMMING ◇\n│ Usage:.programming make calculator in python\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = config.apikeys.megan;
    const apiBase = config.apis.megan;

    try {
      const fullPrompt = `You are expert programmer. Write clean, working code with comments for: ${prompt}. Give explanation after code.`;
      const { data } = await axios.get(`${apiBase}/api/ai/gpt`, {
        params: { prompt: fullPrompt, key: apikey, text: fullPrompt },
        timeout: 40000
      });

      const answer = data.result || data.data || data.answer || data.response || "No result";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ PROGRAMMING ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Code gen failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};