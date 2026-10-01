module.exports = {
  execute: async (sock, m) => {
    await sock.sendMessage(m.key.remoteJid, { text: '*PONG!* 🏓\nBREAKER-ULTRA-MD Active ✅' }, { quoted: m });
  }
};
