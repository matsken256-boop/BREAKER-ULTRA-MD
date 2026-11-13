// Group - Antilink
const fs = require('fs');
const path = './database/antilink.json';
const allowPath = './database/allowed.json';

function getDB(p) {
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p));
}

const LINK_REGEX = /(https?:\/\/|www\.|wa\.me\/|t\.me\/|chat\.whatsapp\.com\/)/i;

module.exports = {
  name: 'antilink',
  alias: [],
  category: 'Group',
  desc: 'Turn antilink on/off',
  async run(sock, m, args, { isGroup, isAdmin }) {
    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin) return m.reply('❌ Only admins');

    let db = getDB(path);
    let action = args[0]?.toLowerCase();

    if (action === 'on') {
      db[m.chat] = 'kick'; // default action = kick
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('✅ Antilink ON - links will be deleted + sender kicked');
    }
    if (action === 'off') {
      delete db[m.chat];
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('❌ Antilink OFF');
    }
    // .antilink warn - only warn, don't kick
    if (action === 'warn') {
      db[m.chat] = 'warn';
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('⚠️ Antilink set to WARN only');
    }
    return m.reply(`Antilink is currently: *${db[m.chat] ? 'ON ('+db[m.chat]+')' : 'OFF'}*\nUsage: *.antilink on / warn / off*`);
  },
  // For your main handler - checks every message
  async onMessage(sock, m, { isGroup, isAdmin }) {
    if (!isGroup) return;
    if (isAdmin) return; // admins can send links
    if (m.key.fromMe) return;
    let db = getDB(path);
    if (!db[m.chat]) return;

    let allowed = getDB(allowPath);
    if (allowed[m.chat]?.includes(m.sender)) return; // allowed by .allow

    let text = m.text || '';
    if (!LINK_REGEX.test(text)) return;

    try {
      await sock.sendMessage(m.chat, { delete: m.key });
      if (db[m.chat] === 'kick') {
        await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
        await sock.sendMessage(m.chat, { text: `🚫 @${m.sender.split('@')[0]} kicked for sending link`, mentions: [m.sender] });
      } else {
        await sock.sendMessage(m.chat, { text: `⚠️ @${m.sender.split('@')[0]} Links are not allowed here`, mentions: [m.sender] });
      }
    } catch {}
  }
};