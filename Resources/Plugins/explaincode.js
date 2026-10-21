const axios = require('axios');

// Fix Config.js bug
let config = {}
try { config = require('../../config.js') } catch { try { config = require('../../Config.js') } catch {} }

module.exports = {
  command: ["explaincode", "explain"],
  description: "Explain code for beginners",

  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    
    if (!args[0]) {
      return await sock.sendMessage(jid, { 
        text: "┌─⊷ ◇ EXPLAINCODE ◇\n│ Usage: .explaincode console.log('hi')\n└─⊷" 
      }, { quoted: m });
    }

    const code = args.join(' ');

    try {
      await sock.sendPresenceUpdate('composing', jid);

      const prompt = `Explain this code in simple way, line by line, for beginners:\n\n${code}`;
      
      let answer = null;

      if (typeof global.MEGAN_AI === 'function') {
        answer = await global.MEGAN_AI(prompt);
      } else {
        const apikey = config.apikeys?.megan || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
        const apiBase = config.apis?.megan || global.MEGAN_BASE || "https://megan-api.vercel.app";
        
        const { data } = await axios.get(`${apiBase}/api/ai`, { 
          params: { prompt: prompt, key: apikey, text: prompt },
          timeout: 30000 
        });
        answer = data.result || data.data || data.answer || data.response;
      }

      if (!answer) answer = "No explanation returned.";

      await sock.sendMessage(jid, { 
        text: `┌─⊷ ◇ EXPLAINCODE ◇\n│ Code: ${code.slice(0,100)}\n│\n│ ${answer}\n└─⊷\n\n🌟 BREAKER v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      console.log("[EXPLAINCODE ERROR]", e.message);
      await sock.sendMessage(jid, { text: `┌─⊷ ◇ ERROR ◇\n│ ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};
