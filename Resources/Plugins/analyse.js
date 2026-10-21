const axios = require('axios');

// Fix case bug
let config = {}
try { config = require('../../config.js') } catch { try { config = require('../../Config.js') } catch {} }

module.exports = {
  command: ["analyse", "analyze", "explain"],
  
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    
    if (!args[0]) {
      return await sock.sendMessage(jid, { 
        text: "┌─⊷ ◇ ANALYSE ◇\n│ Usage: .analyse what is love\n│ .analyse quantum physics\n│ .analyse why sky is blue\n└─⊷" 
      }, { quoted: m });
    }

    const prompt = args.join(' ');

    try {
      await sock.sendPresenceUpdate('composing', jid);

      let answer = null;

      // Try global MEGAN_AI first
      if (typeof global.MEGAN_AI === 'function') {
        answer = await global.MEGAN_AI(`Analyse this in detail, give deep explanation: ${prompt}`);
      } else {
        const apikey = config.apikeys?.megan || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
        const apiBase = config.apis?.megan || global.MEGAN_BASE || "https://megan-api.vercel.app";
        
        // Fixed endpoint: /api/ai not /api/ai/gpt
        const { data } = await axios.get(`${apiBase}/api/ai`, { 
          params: { 
            prompt: `Analyse this in detail: ${prompt}`,
            key: apikey,
            text: `Analyse this in detail: ${prompt}`
          },
          timeout: 30000 
        });
        answer = data.result || data.data || data.answer || data.response;
      }

      if (!answer) answer = "No analysis returned.";

      await sock.sendMessage(jid, { 
        text: `┌─⊷ ◇ ANALYSE ◇\n│ Topic: ${prompt}\n│\n│ ${answer}\n└─⊷\n\n🌟 BREAKER-ULTRA-MD v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      console.log("[ANALYSE ERROR]", e.message);
      await sock.sendMessage(jid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};
