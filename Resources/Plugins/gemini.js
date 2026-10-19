const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GEMINI ◇\n│ Usage:.gemini hello\n└─⊷" }, { quoted: m });
    
    const prompt = args.join(' ');
    const apikey = config.apikeys.renz;
    
    try {
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gemini?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer;
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GEMINI ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });
      
    } catch (e) {
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gemini?prompt=${encodeURIComponent(prompt)}`);
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ GEMINI ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Gemini failed\n└─⊷` }, { quoted: m });
      }
    }
  }
};