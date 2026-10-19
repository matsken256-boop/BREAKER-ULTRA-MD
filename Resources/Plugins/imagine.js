const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ IMAGINE ◇\n│.imagine cat\n└─⊷" }, { quoted: m });
    
    const prompt = args.join(' ');
    const apikey = config.apikeys.renz;
    
    await sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ IMAGINE ◇\n│ ⏳ Generating image...\n│ " + prompt + "\n└─⊷" }, { quoted: m });
    
    try {
      // Renz image endpoint
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/text2img?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`);
      
      const imageUrl = data.data || data.result || data.image || data.url;
      
      if (imageUrl) {
        await sock.sendMessage(m.key.remoteJid, { 
          image: { url: imageUrl }, 
          caption: `┌─⊷ ◇ IMAGINE ◇\n│ ${prompt}\n└─⊷\n\n🌟BREAKER v2.7.0` 
        }, { quoted: m });
      } else {
        throw new Error("No image URL");
      }
      
    } catch (e) {
      // Fallback to siputzx
      try {
        const url = `https://api.siputzx.my.id/api/ai/dalle?prompt=${encodeURIComponent(prompt)}`;
        await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `┌─⊷ ◇ IMAGINE ◇\n│ ${prompt}\n└─⊷\nBREAKER v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Image gen failed: ${e.message}\n└─⊷` }, { quoted: m });
      }
    }
  }
};