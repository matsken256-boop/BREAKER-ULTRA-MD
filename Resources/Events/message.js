const config = require('../../settings');
const { smsg } = require('../Lib/myfunc');

module.exports = async (conn, m) => {
  try {
    if (!m) return;
    m = smsg(conn, m);
    if (!m.message) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup? m.key.participant : from;
    const pushname = m.pushName || 'No Name';

    // Message content
    const body = m.mtype === 'conversation'? m.message.conversation :
                 m.mtype === 'extendedTextMessage'? m.message.extendedTextMessage.text :
                 m.mtype === 'imageMessage'? m.message.imageMessage.caption :
                 m.mtype === 'videoMessage'? m.message.videoMessage.caption : '';

    if (!body) return;

    const prefix = config.prefix;
    const isCmd = body.startsWith(prefix);
    if (!isCmd) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    // Owner check
    const isOwner = config.ownerNumber.includes(sender.split('@')[0]) || m.key.fromMe;

    // ============= PRO COMMANDS ONLY - NO GAMES ============= //

    // No game commands like: tictactoe, chess, poker, hangman, etc.

    switch(command) {
      case 'ping':
      case 'alive': {
        await conn.sendMessage(from, { text: `⚡ *BREAKER XMD PRO*\n\n✅ Online\n⏱️ ${new Date().toLocaleString()}\n👤 ${pushname}\n\n_Mode: ${config.mode}_` }, { quoted: m });
        break;
      }

      case 'menu':
      case 'help': {
        let menu = `╔════════════════════╗
║ ⚡ *BREAKER XMD PRO* ║
╠════════════════════╣
║ Owner: ${config.ownerName}
║ Prefix: ${prefix}
║ Mode: ${config.mode}
║ Version: ${config.version}
╚════════════════════╝

*PRO COMMANDS:*
• ${prefix}ping - Check bot
• ${prefix}menu - This menu
• ${prefix}owner - Owner info
• ${prefix}support - Support group

_NO GAMES - PURE PERFORMANCE_
`;
        await conn.sendMessage(from, { text: menu }, { quoted: m });
        break;
      }

      case 'owner': {
        await conn.sendMessage(from, { text: `👑 Owner: ${config.ownerName}\n📞 Number: ${config.ownerNumber[0]}` }, { quoted: m });
        break;
      }

      // ADD YOUR PRO COMMANDS HERE - NEVER ADD GAMES

      default: {
        // Unknown command - ignore (PRO doesn't spam)
        break;
      }
    }

  } catch (e) {
    console.log('Error in messages.js:', e);
  }
};