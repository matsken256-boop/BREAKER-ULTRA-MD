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
    image: { url: "https://i.ibb.co/YOUR-LOGO-LINK-HERE.jpg" }, 
    caption: menuText 
  }, { quoted: m });

  // If you want to use local logo:
  // Put this logo image I made into resources/logo.jpg
  // Then use: { image: fs.readFileSync('./resources/logo.jpg'), caption: menuText }
 }
}
