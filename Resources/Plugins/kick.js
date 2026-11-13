module.exports = {
  name: 'kick',
  alias: ['remove'],
  category: 'Group',
  desc: 'Kick a user from group',
  async run(sock, m, args, { isGroup, isAdmin, isBotAdmin, isOwner }) {
    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin && !isOwner) return m.reply('❌ Only admins');
    if (!isBotAdmin) return m.reply('❌ Bot needs to be admin');

    let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
    if (!target) return m.reply('Reply to user message with .kick or tag them: .kick @user');

    let owners = [];
    try { owners = require('../config').owner || require('../config').OWNER || []; } catch {}
    if (!Array.isArray(owners)) owners = [owners];
    let ownerJids = owners.map(v => String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net');

    if (ownerJids.includes(target)) return m.reply('❌ Cannot kick the owner');
    if (target === sock.user.id) return m.reply('❌ I cannot kick myself');

    try {
      await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
      await sock.sendMessage(m.chat, {
        text: `✅ User removed successfully!`
      }, { quoted: m });
    } catch {
      return m.reply('❌ Failed to kick, make sure bot is admin');
    }
  }
};