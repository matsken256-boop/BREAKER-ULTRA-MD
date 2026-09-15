module.exports = {
  command: ['ping','speed','pong'],
  category: 'general',
  desc: 'Check bot speed',
  async handler(m, { conn }) {
    const start = Date.now();
    let msg = await conn.sendMessage(m.chat, { text: '*BREAKER* pinging...' }, { quoted: m });
    const end = Date.now();
    await conn.sendMessage(m.chat, { text: `*PONG! 🔥*\n\nSpeed: ${end - start}ms\n*ULTRA-MD ALIVE*`, edit: msg.key });
  }
}
