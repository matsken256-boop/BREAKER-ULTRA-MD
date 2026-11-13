const fs = require('fs');
const path = './database/antibot.json';

function getDB() {
  if (!fs.existsSync(path)) return {};
  try { return JSON.parse(fs.readFileSync(path)); } catch { return {}; }
}

module.exports = {
  name: 'antibot',
  alias: [],
  category: 'Group',
  desc: 'Kick other bots from group',
  async run(sock, m, args, { isGroup, isAdmin, isBotAdmin }) {
    if (!m.chat) m.chat = m.key?.remoteJid;
    if (!m.reply) {
      m.reply = async (text) => {
        return await sock.sendMessage(m.chat, { text: text }, { quoted: m });
      };
    }

    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin) return m.reply('❌ Only admins');

    let db = getDB();
    let action = args[0]?.toLowerCase();

    if (action === 'on') {
      db[m.chat] = true;
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('✅ Antibot ON - other bots will be kicked');
    }
    if (action === 'off') {
      delete db[m.chat];
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('❌ Antibot OFF');
    }
    return m.reply(`Antibot is currently: *${db[m.chat] ? 'ON' : 'OFF'}*\nUsage: *.antibot on/off*`);
  },
  async onMessage(sock, m, { isGroup }) {
    if (!isGroup) return;
    if (!m.chat) m.chat = m.key?.remoteJid;
    if (!m.sender) m.sender = m.key?.participant || m.key?.remoteJid;
    let db = getDB();
    if (!db[m.chat]) return;
    if (m.key.fromMe) return;

    const sender = m.sender || '';
    const isOtherBot = m.isBot || sender.includes('bot') || m.key?.id?.startsWith('BAE5') && !m.key.fromMe && m.pushName?.toLowerCase().includes('bot');

    if (isOtherBot) {
      try {
        await sock.groupParticipantsUpdate(m.chat, [sender], 'remove');
        await sock.sendMessage(m.chat, { text: `🤖 Antibot: Removed another bot @${sender.split('@')[0]}`, mentions: [sender] });
      } catch {}
    }
  }
};