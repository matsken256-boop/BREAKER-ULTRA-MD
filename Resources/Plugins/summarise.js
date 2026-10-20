const axios = require('axios');

module.exports = {
  command: ["summarise", "summarize"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ SUMMARISE ◇\n│ Usage:.summarise long text here\n└─⊷" }, { quoted: m });

    let finalText = args.join(' ');
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      finalText = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    }

    const apikey = global.RENZ_APIKEY;

    try {
      const prompt = `Summarize this text in short, simple points:\n\n${finalText}`;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`, { timeout: 30000 });

      const answer = data.data || data.result || data.answer || "No summary";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ SUMMARISE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Summarise failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};