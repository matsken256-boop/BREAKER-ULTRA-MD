module.exports = {
  formatDate: () => new Date().toLocaleString('en-UG', { timeZone: 'Africa/Kampala' }),
  
  isOwner: (jid, ownerNumber) => {
    return jid.includes(ownerNumber);
  },
  
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  runtime: (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  },

  box: (title, content) => {
    return `┌─⊷ ◇ ${title.toUpperCase()} ◇\n${content}\n└─⊷\n\n🌟BREAKER v2.7.0`;
  },

  getBuffer: async (url) => {
    const axios = require('axios');
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data, 'binary');
  }
};