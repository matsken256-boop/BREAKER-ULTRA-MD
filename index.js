const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;
global.activeBots = {};

app.use(express.json());
app.get('/', (req, res) => res.send('<h2>⚡BREAKER -ULTRA MD ⚡ RUNNING</h2>'));
app.listen(PORT, () => console.log(`✅ BREAKER on http://allocation:${PORT}`));

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

      // YOUR FIXED PRIVATE CHAT WELCOME MESSAGE
      const welcomeText = `⚡BREAKER -ULTRA MD ⚡ CONNECTED ✅ AND IS ACTIVE🟢`;

      try {
        await sock.sendMessage(sock.user.id, { text: welcomeText });
      } catch (e) {
        console.log('Welcome failed but bot connected');
      }
    }

    if (connection === 'close') {
      console.log(`❌ ${number} disconnected, reconnecting...`);
      setTimeout(() => startBot(number), 3000);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
  });

  return sock;
}

async function loadAllSessions() {
  if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');
  const folders = fs.readdirSync('./sessions');
  for (let num of folders) {
    console.log(`🔄 Loading: ${num}`);
    await startBot(num);
  }
}

loadAllSessions();

module.exports = { startBot };
