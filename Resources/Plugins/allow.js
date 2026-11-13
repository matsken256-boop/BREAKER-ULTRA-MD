// Group - Allow user to bypass antilink
const fs = require('fs');
const path = './database/allowed.json';

function getAllowed() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

module.exports = {
  name: 'allow',
  alias: ['allowuser'],
  category: 'Group',
  desc: 'Allow user to send links in group',
  async run(sock, m, args, { isGroup, isAdmin }) {
    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin) return m.reply('❌ Only admins');

    let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
    if (!target) return m.reply('Usage: *.allow @user*');

    let db = getAllowed();
    if (!db[m.chat]) db[m.chat] = [];
    if (db[m.chat].includes(target)) return m.reply('✅ Already allowed');

    db[m.chat].push(target);
    fs.writeFileSync(path, JSON.stringify(db, null, 2));
    await m.reply(`✅ @${target.split('@')[0]} is now allowed to send links`, { mentions: [target] });
  }
};