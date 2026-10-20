module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ IMAGINE ◇\n│ .imagine beautiful cat\n└─⊷" }, { quoted: m });
    try {
      const prompt = args.join(' ');
      // Uses MEGAN KEY from resources/socket/index.js
      const url = global.MEGAN_IMG(prompt);
      await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `┌─⊷ ◇ IMAGINE ◇\n│ ${prompt}\n└─⊷\n\n🌟BREAKER v2.7.0 | MEGAN` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇\n│ ${e.message}\n└─⊷` }, { quoted: m });
    }
  }
};