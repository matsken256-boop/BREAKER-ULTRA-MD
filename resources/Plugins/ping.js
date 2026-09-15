module.exports = {
  command: ['ping','speed','pong'],
  category: 'general',
  desc: 'Check bot speed',
  async handler(m, { conn }) {
    const start = Date.now();
    await conn.sendMessage(m.chat, { text: 'Pinging...' }, { quoted: m });
    const end = Date.now();
    await conn.sendMessage(m.chat, { text: '*PONG*\nSpeed: ' + (end - start) + 'ms\nBREAKER ULTRA ALIVE' }, { quoted: m });
  }
}
