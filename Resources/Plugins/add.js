// Group - Add
module.exports = {
  name: 'add',
  alias: [],
  category: 'Group',
  desc: 'Add a member to group by number',
  async run(sock, m, args, { isGroup, isAdmin, isBotAdmin }) {
    if (!isGroup) return m.reply('❌ This command is for groups only');
    if (!isAdmin) return m.reply('❌ Only group admins can use this');
    if (!isBotAdmin) return m.reply('❌ Make me admin first');

    let number = args[0]?.replace(/[^0-9]/g, '');
    if (!number) return m.reply('Usage: *.add 256700000000*');

    let jid = number + '@s.whatsapp.net';
    try {
      await sock.groupParticipantsUpdate(m.chat, [jid], 'add');
      await m.reply(`✅ Added @${number}`, { mentions: [jid] });
    } catch (e) {
      await m.reply('❌ Could not add. User has privacy on, or number is invalid / already in group.');
    }
  }
};