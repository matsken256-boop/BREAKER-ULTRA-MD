const fs = require('fs');
const path = require('path');
const settings = require('../../settings');

module.exports = (sock) => {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
    const from = m.key.remoteJid;

    // Chatbot auto reply when ON
    try {
      const botPath = path.join(__dirname, '..', 'Plugins', 'chatbot.js');
      if (fs.existsSync(botPath)) {
        // check if chatbot on logic is inside file
        if (global.chatbotOn &&!body.startsWith(settings.prefix)) {
          const plugin = require(botPath);
          await plugin.execute(sock, m, body.split(/ +/), settings);
        }
      }
    } catch {}

    if (!body.startsWith(settings.prefix)) return;

    const args = body.slice(settings.prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const filePath = path.join(__dirname, '..', 'Plugins', cmd + '.js');

    if (fs.existsSync(filePath)) {
      try {
        delete require.cache[require.resolve(filePath)];
        const plugin = require(filePath);
        await plugin.execute(sock, m, args, settings);
      } catch (e) {
        console.log(`Error in ${cmd}:`, e);
        await sock.sendMessage(from, { text: `┌─⊷ ◇ ERROR ◇\n│ Command ${cmd} failed\n└─⊷` }, { quoted: m });
      }
    }
  });
};