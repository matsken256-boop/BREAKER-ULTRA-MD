const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ EXPLAINCODE ◇\n│ Usage:.explaincode console.log('hi')\n└─⊷" }, { quoted: m });
    
    const code = args.join(' ');
    const apikey = config.apikeys.renz;
    
    try {
      const prompt = `Explain this code in simple way, line by line, for beginners:\n\n${code}`;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer;
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ EXPLAINCODE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });
      
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed to explain\n└─⊷` }, { quoted: m });
    }
  }
};