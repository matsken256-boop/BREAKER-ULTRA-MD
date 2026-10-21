const axios = require('axios')

module.exports = {
  command: ['translate', 'trt', 'trans'],
  description: "Translate text",
  
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid
    
    const text = args.join(' ').trim()
    if (!text) {
      return await sock.sendMessage(jid, { 
        text: "┌─⊷ ◇ TRANSLATE ◇\n│ Usage: .translate hello to swahili\n│ .translate habari to english\n│ .translate how are you to luganda\n└─⊷" 
      }, { quoted: msg })
    }
    
    let query = text
    let target = "en"
    
    // Parse "to language"
    if (text.toLowerCase().includes(' to ')) {
      const parts = text.split(/ to /i)
      query = parts[0].trim()
      target = parts[1].trim().toLowerCase()
    }

    const langs = { 
      swahili:'sw', sw:'sw',
      english:'en', en:'en',
      luganda:'lg', lug:'lg', ganda:'lg',
      french:'fr', fr:'fr',
      arabic:'ar', ar:'ar',
      german:'de', de:'de',
      spanish:'es', es:'es',
      kinyarwanda:'rw', rwanda:'rw',
      zulu:'zu'
    }
    
    const langCode = langs[target] || target.substring(0,2).toLowerCase()
    
    try {
      // Add typing indicator
      await sock.sendPresenceUpdate('composing', jid)

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=auto|${langCode}`
      const res = await axios.get(url, { timeout: 10000 })
      
      const translated = res.data?.responseData?.translatedText
      
      if (!translated) {
        return await sock.sendMessage(jid, { text: `❌ Failed to translate to ${target}` }, { quoted: msg })
      }
      
      await sock.sendMessage(jid, { 
        text: `┌─⊷ ◇ TRANSLATE ◇\n│ *From:* ${query}\n│ *To ${target} (${langCode}):* ${translated}\n└─⊷\n\n🌟 BREAKER-ULTRA MD` 
      }, { quoted: msg })
      
    } catch (e) {
      console.log("[TRANSLATE ERROR]", e.message)
      await sock.sendMessage(jid, { text: `❌ Translate error: ${e.message}\nTry again later` }, { quoted: msg })
    }
  }
          }
