const axios = require('axios')

module.exports = {
  command: ['translate'],
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid
    const text = args.join(' ')
    if (!text) return await sock.sendMessage(jid, { text: "Usage: .translate hello to swahili" }, { quoted: msg })
    
    let query = text
    let target = "en"
    if (text.includes(' to ')) {
      const parts = text.split(' to ')
      query = parts[0].trim()
      target = parts[1].trim().toLowerCase()
    }
    const langs = { swahili:'sw', english:'en', luganda:'lg', french:'fr', arabic:'ar', german:'de', spanish:'es' }
    const langCode = langs[target] || target.substring(0,2)
    
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=auto|${langCode}`
    const res = await axios.get(url)
    const translated = res.data?.responseData?.translatedText
    
    await sock.sendMessage(jid, { text: `*${query}* -> *${target}:* ${translated}` }, { quoted: msg })
  }
}
