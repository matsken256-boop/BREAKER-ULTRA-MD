const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ ANALYSE ◇\n│ Usage:.analyse what is love\n└─⊷" }, { quoted: m });
    
    const prompt = args.join(' ');
    const apikey = config.apikeys.renz;
    
    try {
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent("Analyse this in detail: " + prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer || "No analysis";
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ ANALYSE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` 
      }, { quoted: m });
      
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};