const axios = require('axios');
let config = {}
try { config = require('../../config.js') } catch { try { config = require('../../Config.js') } catch {} }

module.exports = {
  command: ["generate", "gen", "create"],
  description: "Generate creative content",

  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    if (!args[0]) return await sock.sendMessage(jid, { text: "┌─⊷ ◇ GENERATE ◇\n│ Usage: .generate story about cat\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');

    try {
      await sock.sendPresenceUpdate('composing', jid);
      
      let answer = null;
      if (typeof global.MEGAN_AI === 'function') {
        answer = await global.MEGAN_AI(`Generate creative content: ${prompt}`);
      } else {
        const apikey = config.apikeys?.megan || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
        const apiBase = config.apis?.megan || global.MEGAN_BASE || "https://megan-api.vercel.app";
        const { data } = await axios.get(`${apiBase}/api/ai`, {
          params: { prompt: `Generate: ${prompt}`, key: apikey, text: prompt },
          timeout: 30000
        });
        answer = data.result || data.data || data.answer || data.response;
      }

      await sock.sendMessage(jid, { text: `┌─⊷ ◇ GENERATE ◇\n│ ${answer || "No result"}\n└─⊷` }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(jid, { text: `┌─⊷ ◇ ERROR ◇\n│ ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};
