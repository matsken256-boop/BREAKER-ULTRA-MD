module.exports = {
  name: "ping",
  alias: ["p"],
  category: "general",
  async run(client, m) {
    await client.sendMessage(m.chat, { text: "⚡ Pong! BREAKER Active ✅" }, { quoted: m });
  }
};
