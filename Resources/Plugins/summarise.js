const axios = require('axios');

module.exports = {
  command: ["summarise", "summarize", "sum"],
  description: "Summarize long text",

  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;

    let finalText = args.join(' ').trim();
    
    // Get quoted message
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted) {
      finalText = quoted.conversation || quoted.extendedTextMessage?.text || finalText;
    }

    if (!finalText) {
      return await sock.sendMessage(jid, { 
        text: "┌─⊷ ◇ SUMMARISE ◇\n│ Usage: .summarise long text here\n│ or reply to a message with .summarise\n└─⊷" 
      }, { quoted: m });
    }

    try {
      await sock.sendPresenceUpdate('composing', jid);

      const prompt = `Summarize this text in short, simple points:\n\n${finalText}`;
      
      let answer = null;
      if (typeof global.MEGAN_AI === 'function') {
        answer = await global.MEGAN_AI(prompt);
      } else {
        const { data } = await axios.get(`${global.MEGAN_BASE || "https://megan-api.vercel.app"}/api/ai`, {
          params: { prompt: prompt, key: global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2", text: prompt },
          timeout: 30000
        });
        answer = data.result || data.data || data.answer || data.response;
      }

      await sock.sendMessage(jid, { 
        text: `┌─⊷ ◇ SUMMARISE ◇\n│ ${answer || "No summary"}\n└─⊷` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Summarise failed: ${e.message}` }, { quoted: m });
    }
  }
};
