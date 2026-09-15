const fs = require('fs');
const path = require('path');

module.exports = {
  name: "menu",
  alias: ["allmenu", "breaker"],
  description: "Show bot menu",
  category: "general",
  async run(client, m, args) {
    try {
      const logoPath = path.join(__dirname, '../logo.jpg');
      const time = new Date().toLocaleTimeString();
      const date = new Date().toLocaleDateString();

      let menuText = `*╭───「 BREAKER-ULTRA-MD 」───*
*│*
*│* ⚡ *BOT:* BREAKER-ULTRA-MD
*│* 👑 *OWNER:* Matsken256-I
*│* ⏰ *TIME:* ${time}
*│* 📅 *DATE:* ${date}
*│* 🚀 *STATUS:* Online
*│*
*├───「 MAIN MENU 」───*
*│* • .ping
*│* • .alive
*│* • .owner
*│* • .menu
*│*
*├───「 DOWNLOADER 」───*
*│* • .play
*│* • .video
*│* • .tiktok
*│*
*├───「 GROUP 」───*
*│* • .tagall
*│* • .kick
*│* • .promote
*│*
*╰───「 POWERED BY BREAKER 」───*`;

      if (fs.existsSync(logoPath)) {
        await client.sendMessage(m.chat, { image: fs.readFileSync(logoPath), caption: menuText }, { quoted: m });
      } else {
        await client.sendMessage(m.chat, { text: menuText }, { quoted: m });
      }
    } catch (e) {
      console.log(e);
      await client.sendMessage(m.chat, { text: "Menu error: " + e.message }, { quoted: m });
    }
  }
}
