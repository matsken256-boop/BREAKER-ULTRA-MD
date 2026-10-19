module.exports = {
  execute: async (sock, m) => {
    const start = Date.now();
    const tmp = await sock.sendMessage(m.key.remoteJid, { text: "🏓" }, { quoted: m });
    const speed = (Date.now() - start).toFixed(2);

    await sock.sendMessage(m.key.remoteJid, {
      text: `🔷 Breaker-Ultra MD Speed: ${speed} ms`,
      edit: tmp.key
    });
  }
};