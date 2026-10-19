const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ TRANSLATE ◇\n│ Usage:.translate hello to swahili\n└─⊷" }, { quoted: m });
    
    const apikey = config.apikeys.renz;
    
    try {
      const prompt = `Translate this and also detect languages. Show Original -> Translated. User wrote: ${args.join(' ')}`;
      const { data } = await axios.get(`https://api.renz.my.id/api/ai/gpt?prompt=${encodeURIComponent(prompt)}&apikey=${apikey}`);
      
      const answer = data.data || data.result || data.answer;
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `┌─⊷ ◇ TRANSLATE ◇\n│ ${answer}\n