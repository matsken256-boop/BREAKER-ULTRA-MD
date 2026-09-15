const fs = require('fs');
module.exports = {
 command: ["menu", "help", "allmenu"],
 handler: async (m, { conn }) => {
  const menuText = `
┌ ◇ *BREAKER-ULTRA-MD* ◇
│ *OWNER* : BREAKER
│ *PREFIX* : [ . ]
│ *HOST* : Panel
│ *PLUGINS* : 250
│ *MODE* : Public
│ *VERSION* : 3.0.0 ULTRA
└───────────────

╭──〔 *MAIN MENU* 〕──
│ • .ping
│ • .alive
│ • .owner
│ • .botinfo
╰───────────────

╭──〔 *GROUP MENU* 〕──
│ • .tagall
│ • .kick
│ • .add
│ • .promote
╰───────────────

╭──〔 *DOWNLOAD MENU* 〕──
│ • .play
│ • .ytmp3
│ • .ytmp4
│ • .tiktok
╰───────────────

> *© BREAKER-ULTRA-MD 2026*
`;

  await conn.sendMessage(m.key.remoteJid, { 
    image: fs.readFileSync('./resources/logo.jpg'),
    caption: menuText 
  }, { quoted: m });
 }
}
