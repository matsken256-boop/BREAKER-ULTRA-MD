module.exports = {
  command: ["anticall"],
  async execute(client, m, args) {
    if (!global.db.settings) global.db.settings = {};
    if (!global.db.settings.anticall) global.db.settings.anticall = { decline: false, block: false };

    const mode = args[0]?.toLowerCase();

    if (!mode) {
      return client.sendMessage(m.key.remoteJid, { text: `📞 *ANTICALL*\n\nCurrent: Decline=${global.db.settings.anticall.decline ? 'ON' : 'OFF'} | Block=${global.db.settings.anticall.block ? 'ON' : 'OFF'}\n\n.anticall decline - Only reject\n.anticall block - Reject + Block\n.anticall off - Turn off` }, { quoted: m });
    }

    if (mode === "decline") {
      global.db.settings.anticall.decline = true;
      global.db.settings.anticall.block = false;
      return client.sendMessage(m.key.remoteJid, { text: "✅ Anticall set to DECLINE mode" }, { quoted: m });
    }
    if (mode === "block") {
      global.db.settings.anticall.decline = true;
      global.db.settings.anticall.block = true;
      return client.sendMessage(m.key.remoteJid, { text: "✅ Anticall set to BLOCK mode" }, { quoted: m });
    }
    if (mode === "off") {
      global.db.settings.anticall.decline = false;
      global.db.settings.anticall.block = false;
      return client.sendMessage(m.key.remoteJid, { text: "❌ Anticall OFF" }, { quoted: m });
    }
  }
};