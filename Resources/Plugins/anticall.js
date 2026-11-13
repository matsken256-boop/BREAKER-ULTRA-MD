module.exports = {
  name: "anticall",
  alias: ["call"],
  category: "owner",
  desc: "Enable/disable anticall",
  isOwner: true,
  execute: async (client, m, args) => {
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