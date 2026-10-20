const axios = require('axios');

module.exports = {
  command: ["summarise", "summarize"],
  execute: async (sock, m, args) => {
    if (!args[0] && !m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ SUMMARISE ◇\n│ Usage:.summarise long text here\n│ or reply to message with .summarise\n└─⊷" }, { quoted: m });
    }

    let finalText = args.join(' ');
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      finalText = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    }
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text) {
      finalText = m.message.extendedTextMessage.contextInfo.quotedMessage.extendedTextMessage.text;
    }

    const API_KEY = "megan_f6ef183d3b34ffee32a022e038f91847";
    const API_BASE = "https://megan-api.vercel.app";

    try {
      const prompt = `Summarize this text in short, simple points:\n\n${finalText}`;
      const { data } = await axios.get(`${API_BASE}/api/ai/gpt`, {
        params: { 
          prompt: prompt,
          key: API_KEY,
          text: prompt
        },
        timeout: 30000
      });

      const answer = data.result || data.data || data.answer || data.response || "No summary";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ SUMMARISE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Summarise failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};