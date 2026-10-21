module.exports = {
  execute: async (sock, m, args) => {
    const from = m.key.remoteJid;
    
    if (!args[0]) {
      return await sock.sendMessage(from, { text: "┌─⊷ ◇ IMAGINE ◇\n│ Usage: .imagine beautiful cat\n│ Example: .imagine cyberpunk city\n└─⊷" }, { quoted: m });
    }

    try {
      const prompt = args.join(' ');
      
      // Send loading
      await sock.sendMessage(from, { text: `┌─⊷ ◇ IMAGINE ◇\n│ Generating: ${prompt}\n│ Please wait...\n└─⊷` }, { quoted: m });

      // FIX: Added await and proper error handling
      const imageUrl = await global.MEGAN_IMG(prompt);
      
      if (!imageUrl) {
        return await sock.sendMessage(from, { text: `┌─⊷ ◇ ERROR ◇\n│ AI image API offline\n│ Try: .ai ${prompt}\n└─⊷` }, { quoted: m });
      }

      // Handle both string URL and object
      const url = typeof imageUrl === 'string' ? imageUrl : imageUrl.url || imageUrl.image;

      await sock.sendMessage(from, { 
        image: { url: url }, 
        caption: `┌─⊷ ◇ IMAGINE ◇\n│ ${prompt}\n└─⊷\n\n🌟 BREAKER v2.7.0 | MEGAN` 
      }, { quoted: m });

    } catch (e) {
      console.log("[IMAGINE ERROR]", e.message);
      await sock.sendMessage(from, { text: `┌─⊷ ◇ ERROR ◇\n│ ${e.message}\n│ Check MEGAN API key\n└─⊷` }, { quoted: m });
    }
  }
};
