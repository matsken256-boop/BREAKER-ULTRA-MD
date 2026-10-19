const axios = require('axios');
const config = require('../Resources/Utils/config.js');
let isChatbotOn = false;

module.exports = {
  execute: async (sock, m, args) => {
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'on') {
      isChatbotOn = true;
      return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ CHATBOT ◇\n│ ✅ Chatbot is now ON\n│ Bot will reply to all messages\n└─⊷\n\n🌟BREAKER v2.7.0" }, { quoted: m });
    }
    if (cmd === 'off') {
      isChatbotOn = false;
      return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ CHATBOT ◇\n│ ❌ Chatbot is now OFF\n└─⊷\n\n🌟BREAKER v2.7.0" }, { quoted: m });
    }
    if (!args[0]) {
      return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ CHATBOT ◇\n│ Usage:\n│ ➳.chatbot on - enable\n│ ➳.chatbot off - disable\n│ ➳.chatbot hi - chat directly\n└─⊷" }, { quoted: m });
    }

    // Direct chat with Renz API
    try {
      const prompt = args.join(' ');
      const apikey = config.apikeys.renz;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer;
      
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ CHATBOT ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` }, { quoted: m });
    } catch (e) {
      // Fallback to old API
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(args.join(' '))}`);
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ CHATBOT ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ ERROR ◇\n│ Failed to chat\n└─⊷" }, { quoted: m });
      }
    }
  },
  
  // For auto-reply when ON - call this from your message handler
  isOn: () => isChatbotOn
};