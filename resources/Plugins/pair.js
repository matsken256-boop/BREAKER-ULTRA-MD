const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

module.exports = {
  name: "pair",
  alias: ["addbot", "link"],
  category: "owner",
  desc: "Pair new number to run on same server",

  async run(client, m, { args }) {
    let rawNumber = args[0] || "";
    let number = rawNumber.replace(/[^0-9]/g, '');
    if (!number) {
      return await client.sendMessage(m.chat, { text: '❌ Example:.pair 256712345678' }, { quoted: m });
    }

    const sessionPath = path.join(__dirname, '../../sessions', number);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    await client.sendMessage(m.chat, { text: `⏳ Generating pair code for ${number}...` }, { quoted: m });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const tempSock = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      browser: ['BREAKER-ULTRA', 'Chrome', '1.0']
    });
    tempSock.ev.on('creds.update', saveCreds);
    await delay(2000);

    try {
      let code = await tempSock.requestPairingCode(number);
      code = code.match(/.{1,4}/g).join('-');

      await client.sendMessage(m.chat, {
        text: `*Pair code for ${number}:*\n\n*${code}*\n\nGo to WhatsApp > Linked Devices > Link with phone number`
      }, { quoted: m });

      tempSock.ev.on('connection.update', async ({ connection }) => {
        if (connection === 'open') {
          await client.sendMessage(m.chat, { text: `⚡BREAKER -ULTRA MD ⚡ CONNECTED ✅ AND IS ACTIVE🟢\n\nNumber ${number} now live on same server!` }, { quoted: m });
          // restart to load new session
          const { startBot } = require('../../index');
          if(startBot) await startBot(number);
          try { tempSock.end(); } catch {}
        }
      });

      setTimeout(() => { try { tempSock.end(); } catch {} }, 60000);

    } catch (e) {
      await client.sendMessage(m.chat, { text: `❌ Failed: ${e.message}` }, { quoted: m });
    }
  }
};
