const fs = require('fs');
module.exports = {
  name: "menu",
  alias: ["help","list"],
  category: "general",
  async run(client, m, { prefix }) {
    let logoPath = './logo.jpg';
    let menuText = `*⚡ BREAKER-ULTRA-MD ⚡*
*The Most Powerful MD Bot*

┏━━ *GENERAL* ━━
┃ • ${prefix}ping
┃ • ${prefix}menu
┗━━━━━━━━━━━━

┏━━ *INFO* ━━
┃ Bot: BREAKER-ULTRA-MD
┃ Prefix: ${prefix}
┃ Status: Active ✅
┗━━━━━━━━━━━━`;

    if (fs.existsSync(logoPath)) {
      await client.sendMessage(m.chat, { image: fs.readFileSync(logoPath), caption: menuText }, { quoted: m });
    } else {
      await client.sendMessage(m.chat, { text: menuText }, { quoted: m });
    }
  }
};
