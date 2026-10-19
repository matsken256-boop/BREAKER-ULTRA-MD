const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GENERATE ◇\n│ Usage:.generate story about cat\n└─⊷" }, { quoted: m });
    
    const prompt = args.join(' ');
    const apikey = config.apikeys.renz;
    
    try {
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent("Generate creative content: " + prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer;
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GENERATE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });
      
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Generate failed\n└─⊷` }, { quoted: m });
    }
  }
};