module.exports = {
  name: "menu",
  alias: ["help"],
  category: "general",
  async run(client, m, { prefix }) {
    let txt = `*⚡ BREAKER-ULTRA MD MENU*\n\n*GENERAL:*\n• ${prefix}ping\n• ${prefix}menu\n\n*OWNER:*\n• ${prefix}pair 256xxxx\n\nPrefix: ${prefix}`;
    await client.sendMessage(m.chat, { text: txt }, { quoted: m });
  }
};
