const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { startBot } = require('./index');

async function pairCommand(sock, chatId, rawNumber) {
  let number = rawNumber.replace(/[^0-9]/g, '');
  if (!number) {
    return await sock.sendMessage(chatId, { text: '❌ Example:.pair 256712345678' });
  }

  const sessionPath = `./sessions/${number}`;

  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  await sock.sendMessage(chatId, { text: `⏳ Generating pair code for ${number}...` });

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

    await sock.sendMessage(chatId, {
      text: `*Pair code for ${number}:* \n\n*${code}*\n\nGo to WhatsApp > Linked Devices > Link with phone number > Enter code.\n\n_Expires in 60 seconds_`
    });

    tempSock.ev.on('connection.update', async ({ connection }) => {
      if (connection === 'open') {
        await sock.sendMessage(chatId, { text: `⚡BREAKER -ULTRA MD ⚡ CONNECTED ✅ AND IS ACTIVE🟢\n\nNumber ${number} now live on same server!` });
        await startBot(number);
        try { tempSock.end(); } catch {}
      }
    });

    setTimeout(() => {
      try { tempSock.end(); } catch {}
    }, 60000);

  } catch (e) {
    await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` });
  }
}

module.exports = pairCommand;
