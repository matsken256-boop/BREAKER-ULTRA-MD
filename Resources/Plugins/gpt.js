const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ GPT ◇\n│.gpt hello\n└─⊷" }, { quoted: m });
    
    const prompt = args.join(' ');
    const apikey = config.apikeys.renz;
    
    try {
      // Use your Renz key - stable
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer || "No response";
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ GPT ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` 
      }, { quoted: m });
      
    } catch (e) {
      // Fallback to siputzx if Renz fails
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`);
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ GPT ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ AI Error, try again boss.\nError: ${e.message}` }, { quoted: m });
      }
    }
  }
};