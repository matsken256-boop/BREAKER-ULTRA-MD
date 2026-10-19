const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ TEACH ◇\n│ Usage:.teach photosynthesis\n└─⊷" }, { quoted: m });
    
    const apikey = config.apikeys.renz;
    
    try {
      const prompt = `Explain this topic like I'm 10 years old, simple, fun, with examples and emoji: ${args.join(' ')}. Break it into: What is it, How it works, Example.`;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer;
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ TEACH ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });
      
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Teach failed\n└─⊷` }, { quoted: m });
    }
  }
};