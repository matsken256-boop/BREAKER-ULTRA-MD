// Group - Antibot (CypherX style, clean version for breaker-ultra-md)
const fs = require('fs');
const path = './database/antibot.json';

function getDB() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

module.exports = {
  name: 'antibot',
  alias: [],
  category: 'Group',
  desc: 'Kick other bots from group',
  async run(sock, m, args, { isGroup, isAdmin, isBotAdmin }) {
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
  // This part runs on every message - like CypherX does
  async onMessage(sock, m, { isGroup }) {
    if (!isGroup) return;
    let db = getDB();
    if (!db[m.chat]) return;
    if (m.key.fromMe) return;

    // Detect other bots: bot JIDs usually end with @lid or have bot in ID, or message has bot tag
    const sender = m.sender || '';
    const isOtherBot = m.isBot || sender.includes('bot') || m.key?.id?.startsWith('BAE5') && !m.key.fromMe && m.pushName?.toLowerCase().includes('bot');

    // CypherX also checks: if sender is NOT group admin and message looks like bot message
    if (isOtherBot) {
      try {
        await sock.groupParticipantsUpdate(m.chat, [sender], 'remove');
        await sock.sendMessage(m.chat, { text: `🤖 Antibot: Removed another bot @${sender.split('@')[0]}`, mentions: [sender] });
      } catch {}
    }
  }
};