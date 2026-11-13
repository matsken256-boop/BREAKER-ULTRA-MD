// Group - Kick
module.exports = {
  name: 'kick',
  alias: ['remove'],
  category: 'Group',
  desc: 'Kick a member from group',
  async run(sock, m, args, { isGroup, isAdmin, isBotAdmin }) {
    if (!isGroup) return m.reply('❌ This command is for groups only');
    if (!isAdmin) return m.reply('❌ Only group admins can use this');
    if (!isBotAdmin) return m.reply('❌ Make me admin first');

    let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
    if (!target) return m.reply('Usage: *.kick @user* or reply to their message');

    await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
    await m.reply('✅ User kicked');
  }
};