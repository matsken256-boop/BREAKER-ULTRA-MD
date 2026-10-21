const axios = require('axios');
let config = {}
try { config = require('../../config.js') } catch { try { config = require('../../Config.js') } catch {} }

module.exports = {
  command: ["programming", "code", "program"],
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    if (!args[0]) return await sock.sendMessage(jid, { text: "┌─⊷ ◇ PROGRAMMING ◇\n│ Usage: .programming make calculator in python\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    try {
      await sock.sendPresenceUpdate('composing', jid);
      let answer;
      if (typeof global.MEGAN_AI === 'function') {
        answer = await global.MEGAN_AI(`You are expert programmer. Write clean, working code with comments for: ${prompt}. Give explanation after code.`);
      } else {
        const apikey = config.apikeys?.megan || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
        const apiBase = config.apis?.megan || global.MEGAN_BASE || "https://megan-api.vercel.app";
        const { data } = await axios.get(`${apiBase}/api/ai`, {
          params: { prompt: `Write code for: ${prompt}`, key: apikey, text: prompt },
          timeout: 40000
        });
        answer = data.result || data.data || data.answer || data.response;
      }
      await sock.sendMessage(jid, { text: `┌─⊷ ◇ PROGRAMMING ◇\n│ ${answer || "No result"}\n└─⊷` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ ${e.message}` }, { quoted: m });
    }
  }
};
