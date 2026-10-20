const axios = require('axios');
const config = require('../../Config.js'); // change to ../Config.js if Config is in root

module.exports = {
  command: ["analyse"],
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ ANALYSE ◇\n│ Usage:.analyse what is love\n└─⊷" }, { quoted: m });

    const prompt = args.join(' ');
    const apikey = config.apikeys.megan; // megan_f6ef183d3b34ffee32a022e038f91847
    const apiBase = config.apis.megan;

    try {
      const { data } = await axios.get(`${apiBase}/api/ai/gpt`, { 
        params: { 
          prompt: "Analyse this in detail: " + prompt,
          key: apikey,
          text: "Analyse this in detail: " + prompt
        },
        timeout: 30000 
      });

      const answer = data.result || data.data || data.answer || data.response || "No analysis";

      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ ANALYSE ◇\n│ ${answer}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0` 
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ Failed: ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};