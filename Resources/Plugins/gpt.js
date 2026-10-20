const axios = require('axios')

module.exports = {
  command: ['gpt','chatgpt','gemini','deepseek','chatbot','ai'],
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid
    const query = args.join(' ')
    if (!query) return await sock.sendMessage(jid, { text: "Usage: .gpt hello" }, { quoted: msg })
    
    if (typeof global.MEGAN_AI === 'function') {
      const ans = await global.MEGAN_AI(query)
      return await sock.sendMessage(jid, { text: ans }, { quoted: msg })
    }
    
    const res = await axios.get(`https://api.zenith.org/api/ai?text=${encodeURIComponent(query)}`)
    const ans = res.data?.result || "No response"
    await sock.sendMessage(jid, { text: ans }, { quoted: msg })
  }
}