const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;
global.activeBots = {};

app.use(express.json());
app.get('/', (req, res) => res.send('<h2>⚡BREAKER -ULTRA MD ⚡ RUNNING</h2>'));
app.listen(PORT, () => console.log(`✅ BREAKER on http://allocation:${PORT}`));

// PAIR FUNCTION INSIDE SAME FILE
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
      text: `*Pair code for ${number}:* \n\n*${code}*\n\nWhatsApp > Linked Devices > Link with phone number`
    });
    tempSock.ev.on('connection.update', async ({ connection }) => {
      if (connection === 'open') {
        await sock.sendMessage(chatId, { text: `⚡BREAKER -ULTRA MD ⚡ CONNECTED ✅ AND IS ACTIVE🟢\n\nNumber ${number} now live!` });
        await startBot(number);
        try { tempSock.end(); } catch {}
      }
    });
    setTimeout(() => { try { tempSock.end(); } catch {} }, 60000);
  } catch (e) {
    await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` });
  }
}

async function startBot(number) {
  const sessionPath = `./sessions/${number}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['BREAKER-ULTRA', 'Chrome', '1.0']
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log(`✅ Connected: ${number}`);
      global.activeBots[number] = sock;
      // YOUR EXACT PRIVATE CHAT WELCOME MESSAGE
      const welcomeText = `⚡BREAKER -ULTRA MD ⚡ CONNECTED ✅ AND IS ACTIVE🟢`;
      try {
        await sock.sendMessage(sock.user.id, { text: welcomeText });
      } catch (e) {}
    }
    if (connection === 'close') {
      setTimeout(() => startBot(number), 3000);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (text.startsWith('.pair')) {
      const num = text.split(' ')[1];
      const chatId = msg.key.remoteJid;
      await pairCommand(sock, chatId, num);
    }
  });
  return sock;
}

async function loadAllSessions() {
  if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');
  const folders = fs.readdirSync('./sessions');
  for (let num of folders) {
    await startBot(num);
  }
}
loadAllSessions();
