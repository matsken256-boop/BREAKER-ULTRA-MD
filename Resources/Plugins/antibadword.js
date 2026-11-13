// Group - Antibadword
const fs = require('fs');
const path = './database/antibadword.json';

function getDB() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

const BAD_WORDS = ['fuck','shit','bitch','dick','pussy','asshole','motherfucker','f*ck'];

module.exports = {
  name: 'antibadword',
  alias: ['antibad'],
  category: 'Group',
  desc: 'Turn antibadword on/off',
  badwords: BAD_WORDS, // your main handler will use this
  async run(sock, m, args, { isGroup, isAdmin }) {
    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin) return m.reply('❌ Only admins');

    let db = getDB();
    let action = args[0]?.toLowerCase();

    if (action === 'on') {
      db[m.chat] = true;
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('✅ Antibadword ON - bad words will be deleted');
    }
    if (action === 'off') {
      delete db[m.chat];
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('❌ Antibadword OFF');
    }
    return m.reply(`Antibadword is currently