const axios = require('axios');

module.exports = {
  command: ["programming"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ PROGRAMMING ◇\n│ Usage:.programming make calculator in python\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = global.RENZ_APIKEY;

    try {
      const fullPrompt = `You are expert programmer. Write clean, working code with comments for: ${prompt}. Give explanation after code.`;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(fullPrompt)}&apikey=${apikey}`, { timeout: 40000 });

      const answer = data.data || data.result || data.answer || "No result";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ PROGRAMMING ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Code gen failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};