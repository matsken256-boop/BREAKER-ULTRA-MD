module.exports = {
  name: "anticall",
  alias: ["call"],
  category: "owner",
  desc: "Enable/disable anticall",
  isOwner: true,
  async run(sock, m, args) {
    return this.execute(sock, m, args);
  },
  execute: async (client, m, args) => {
    if (!m.chat) m.chat = m.key?.remoteJid;
    if (!m.reply) {
      m.reply = async (text) => {
        return await client.sendMessage(m.chat, { text: text }, { quoted: m });
      };
    }

    if (!global.db) global.db = {};
    if (!global.db.settings) global.db.settings = {};
    if (!global.db.settings.anticall) global.db.settings.anticall = { decline: false, block: false };

    const mode = args[0]?.toLowerCase();

    if (!mode) {
      const s = global.db.settings.anticall;
      return m.reply(`*BREAKER-ULTRA MD ANTICALL*\n\n> Decline: ${s.decline ? 'ON' : 'OFF'}\n> Block: ${s.block ? 'ON' : 'OFF'}\n\n.anticall decline\n.anticall block\n.anticall off`);
    }

    if (mode === "decline") {
      global.db.settings.anticall = { decline: true, block: false };
      return m.reply("✅ Anticall set to *DECLINE* only");
    }
    if (mode === "block") {
      global.db.settings.anticall = { decline: true, block: true };
      return m.reply("✅ Anticall set to *BLOCK* (reject + block)");
    }
    if (mode === "off") {
      global.db.settings.anticall = { decline: false, block: false };
      return m.reply("❌ Anticall OFF");
    }
  }
};