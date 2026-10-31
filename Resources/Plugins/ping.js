module.exports = {
  execute: async (sock, m) => {
    const from = m.key.remoteJid;
    const start = Date.now();
    const tmp = await sock.sendMessage(from, { text: "🏓" }, { quoted: m });
    const speed = (Date.now() - start).toFixed(2);
    await sock.sendMessage(from, {
      text: `🔷 Breaker-Ultra MD Speed: ${speed} ms`,
      edit: tmp.key
    });
  }
};