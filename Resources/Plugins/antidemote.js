// Group - Antidemote
const fs = require('fs');
const path = './database/antidemote.json';

function getDB() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

module.exports = {
  name: 'antidemote',
  alias: [],
  category: 'Group',
  desc: 'Protect admins from being demoted',
  async run(sock, m, args, { isGroup, isAdmin }) {
    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin) return m.reply('❌ Only admins');

    let db = getDB();
    let action = args[0]?.toLowerCase();

    if (action === 'on') {
      db[m.chat] = true;
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('✅ Antidemote ON - admins cannot be demoted');
    }
    if (action === 'off') {
      delete db[m.chat];
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('❌ Antidemote OFF');
    }
    return m.reply(`Antidemote is currently: *${db[m.chat] ? 'ON' : 'OFF'}*\nUsage: *.antidemote on/off*`);
  }
};