module.exports = {
  name: 'add',
  alias: ['invite'],
  category: 'Group',
  desc: 'Add a user to group',
  async run(sock, m, args, { isGroup, isAdmin, isBotAdmin, isOwner }) {
    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin && !isOwner) return m.reply('❌ Only admins');
    if (!isBotAdmin) return m.reply('❌ Bot needs to be admin');

    let number = args[0]?.replace(/[^0-9]/g, '');
    if (!number) return m.reply('Usage: .add 2567xxxxxxxxx');
    if (number.length < 10) return m.reply('❌ Invalid number');

    let target = number + '@s.whatsapp.net';

    try {
      await sock.groupParticipantsUpdate(m.chat, [target], 'add');
      await sock.sendMessage(m.chat, {
        text: `Mission completed successfully.`
      }, { quoted: m });
    } catch {
      return m.reply('❌ Failed to add, user may have privacy settings or already in group');
    }
  }
};