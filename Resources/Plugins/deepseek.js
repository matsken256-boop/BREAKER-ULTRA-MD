const axios = require('axios')

module.exports = {
  command: ['gpt', 'ai', 'chatgpt'],
  description: "GPT AI Chat",

  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid
    const query = args.join(' ').trim()
    
    if (!query) {
      return await sock.sendMessage(jid, { 
        text: "┌─⊷ ◇ GPT ◇\n│ Usage: .gpt hello how are you\n└─⊷" 
      }, { quoted: msg })
    }
    
    try {
      await sock.sendPresenceUpdate('composing', jid)

      let ans = null

      // Use your MEGAN API
      if (typeof global.MEGAN_AI === 'function') {
        ans = await global.MEGAN_AI(query)
      } else {
        // Fallback
        const res = await axios.get(`https://api.zenith.org/api/ai?text=${encodeURIComponent(query)}`, { timeout: 15000 })
        ans = res.data?.result || res.data?.answer
      }

      if (!ans) ans = "No response, try again"

      await sock.sendMessage(jid, { 
        text: `┌─⊷ ◇ GPT ◇\n│ ${ans}\n└─⊷` 
      }, { quoted: msg })

    } catch (e) {
      console.log("[GPT ERROR]", e.message)
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${e.message}` 
      }, { quoted: msg })
    }
  }
}
