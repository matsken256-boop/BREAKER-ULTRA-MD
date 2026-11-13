const fs = require('fs');
const path = './database/antilink.json';
const warnPath = './database/warns.json';
const allowPath = './database/allowed.json';

function getDB(p) {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p)); } catch { return {}; }
}

const LINK_REGEX = /(https?:\/\/|www\.|wa\.me\/|t\.me\/|chat\.whatsapp\.com\/|discord\.gg\/)/i;

module.exports = {
  name: 'antilink',
  alias: [],
  category: 'Group',
  desc: 'Antilink kick / delete / warn',
  async run(sock, m, args, { isGroup, isAdmin }) {
    // FIX: Make m.reply work
    if (!m.reply) {
      m.reply = async (text) => {
        return await sock.sendMessage(m.chat || m.key.remoteJid, { text: text });
      };
    }
    if (!m.chat) m.chat = m.key.remoteJid;

    if (!isGroup) return m.reply('❌ Groups only');
    if (!isAdmin) return m.reply('❌ Only admins');

    let db = getDB(path);
    let mode = args[0]?.toLowerCase();
    let action = args[1]?.toLowerCase();

    if (mode === 'kick' && action === 'on') {
      db[m.chat] = 'kick';
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('Successfully enabled antilink kick mode!');
    }
    if (mode === 'delete' && action === 'on') {
      db[m.chat] = 'delete';
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('Successfully enabled antilink delete mode!');
    }
    if (mode === 'warn' && action === 'on') {
      db[m.chat] = 'warn';
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('Successfully enabled antilink warn mode!');
    }
    if (mode === 'off' || action === 'off') {
      delete db[m.chat];
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      return m.reply('Successfully disabled antilink!');
    }

    return m.reply(`Antilink: *${db[m.chat] ? db[m.chat] + ' mode' : 'OFF'}*\nUsage:\n.antilink kick on\n.antilink delete on\n.antilink warn on\n.antilink off`);
  },

  async onMessage(sock, m, { isGroup, isAdmin }) {
    if (!isGroup) return;
    if (isAdmin) return;
    if (m.key.fromMe) return;
    
    if (!m.chat) m.chat = m.key.remoteJid;
    if (!m.sender) m.sender = m.key.participant || m.key.remoteJid;
    if (!m.text) m.text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';

    let db = getDB(path);
    if (!db[m.chat]) return;

    let allowed = getDB(allowPath);
    if (allowed[m.chat]?.includes(m.sender)) return;

    let text = m.text || '';
    if (!LINK_REGEX.test(text)) return;

    try {
      let mode = db[m.chat];

      if (mode === 'kick') {
        await sock.sendMessage(m.chat, { delete: m.key });
        await sock.sendMessage(m.chat, {
          text: `LINK DETECTED\n\n@${m.sender.split('@')[0]} Beware, links are not allowed in this group! ⚠️`,
          mentions: [m.sender]
        });
        await new Promise(r => setTimeout(r, 800));
        await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
        await sock.sendMessage(m.chat, {
          text: `@${m.sender.split('@')[0]} removed successfully ✅`,
          mentions: [m.sender]
        });
      }

      if (mode === 'delete') {
        await sock.sendMessage(m.chat, { delete: m.key });
        await sock.sendMessage(m.chat, {
          text: `LINK DETECTED\n\n@${m.sender.split('@')[0]} Beware, links are not allowed in this group! ⚠️`,
          mentions: [m.sender]
        });
      }

      if (mode === 'warn') {
        let warns = getDB(warnPath);
        let key = m.chat + '_' + m.sender;
        if (!warns[key]) warns[key] = { count: 0, reasons: [] };
        warns[key].count += 1;
        warns[key].reasons.push('antilink');
        let remaining = 5 - warns[key].count;
        fs.writeFileSync(warnPath, JSON.stringify(warns, null, 2));

        await sock.sendMessage(m.chat, { delete: m.key });

        if (remaining <= 0) {
          await sock.sendMessage(m.chat, {
            text: `LINK DETECTED\n\n@${m.sender.split('@')[0]} Beware, links are not allowed in this group! ⚠️\nRemaining warnings: 0\nYou have used all warnings, you will be kicked.`,
            mentions: [m.sender]
          });
          delete warns[key];
          fs.writeFileSync(warnPath, JSON.stringify(warns, null, 2));
          await new Promise(r => setTimeout(r, 800));
          await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
          await sock.sendMessage(m.chat, {
            text: `@${m.sender.split('@')[0]} removed successfully ✅`,
            mentions: [m.sender]
          });
        } else {
          await sock.sendMessage(m.chat, {
            text: `LINK DETECTED\n\n@${m.sender.split('@')[0]} Beware, links are not allowed in this group! ⚠️\nRemaining warnings: ${remaining}\nUse resetwarn to reset.`,
            mentions: [m.sender]
          });
        }
      }

    } catch {}
  }
};