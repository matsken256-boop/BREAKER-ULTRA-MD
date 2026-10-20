const axios = require('axios');
const config = require('../../Config.js'); // change to ../Config.js if needed
let isChatbotOn = false;

module.exports = {
  command: ["chatbot"],
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

    // Direct chat with MEGAN API
    try {
      const prompt = args.join(' ');
      const apikey = config.apikeys.megan; // megan_f6ef183d3b34ffee32a022e038f91847
      const apiBase = config.apis.megan;
      
      const { data } = await axios.get(`${apiBase}/api/ai/gpt`, { 
        params: { prompt: prompt, key: apikey, text: prompt },
        timeout: 30000 
      });

      const answer = data.result || data.data || data.answer || data.response || "No reply";

      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ CHATBOT ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` }, { quoted: m });
    } catch (e) {
      // Fallback to old free API
      try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3`, { 
          params: { prompt: args.join(' ') },
          timeout: 30000 
        });
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ CHATBOT ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER v2.7.0` }, { quoted: m });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed to chat: ${e.message}\n└─⊷` }, { quoted: m });
      }
    }
  },

  // For auto-reply when ON - call this from your message handler
  isOn: () => isChatbotOn
};