module.exports = {
  name: "menu",
  alias: ["help", "commands"],
  category: "general",
  desc: "Show all commands",

  async run(client, m, { prefix }) {
    let text = `*⚡ BREAKER-ULTRA MD ⚡ - COMMANDS*\n\n`;
    text += `*GENERAL:*\n`;
    text += `• ${prefix}ping - Check speed\n`;
    text += `• ${prefix}menu - This menu\n\n`;
    text += `*OWNER:*\n`;
    text += `• ${prefix}pair 2567xxxx - Add 10 bots same server\n\n`;
    text += `Bot active: ${Object.keys(global.activeBots || {}).length} numbers\n`;
    text += `Prefix: ${prefix}\n`;

    await client.sendMessage(m.chat, { text: text }, { quoted: m });
  }
};
