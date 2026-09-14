const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

const app = express();
const PORT = 20130;
let sock;

app.get('/', (req, res) => {
  res.send(`
    <div style="background:#000;color:#0f0;text-align:center;padding:40px;font-family:monospace">
      <h2>BREAKER-ULTRA-MD</h2>
      <input id="n" placeholder="Enter number 2567..." style="padding:10px;width:250px" value="256766800757"><br><br>
      <button onclick="getCode()" style="padding:10px 20px;background:#0f0;border:none;cursor:pointer">GET PAIR CODE</button>
      <h1 id="c" style="letter-spacing:3px"></h1>
      <p id="e" style="color:red"></p>
    </div>
    <script>
      async function getCode(){
        document.getElementById('c').innerText='Generating...';
        const r=await fetch('/pair?number='+document.getElementById('n').value);
        const d=await r.json();
        if(d.code) document.getElementById('c').innerText=d.code;
        else document.getElementById('e').innerText=d.error;
      }
    </script>
  `);
});

app.get('/pair', async (req, res) => {
  let num = req.query.number?.replace(/[^0-9]/g, '');
  if (!num) return res.json({ error: 'Enter number' });
  try {
    if (!sock) return res.json({ error: 'Bot starting, wait 5 sec then try again' });
    await delay(1500);
    let code = await sock.requestPairingCode(num);
    code = code?.match(/.{1,4}/g)?.join('-') || code;
    console.log(`\n>>> PAIR CODE FOR ${num}: ${code} <<<\n`);
    res.json({ code });
  } catch (e) {
    console.log('Pair error:', e.message);
    res.json({ error: e.message });
  }
});

async function initBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    
    if (connection === 'open') {
      console.log('✅✅✅ CONNECTED! BOT ONLINE!');
      try {
        await delay(4000);
        const myId = sock.user.id;
        console.log('Sending private message to:', myId);
        await sock.sendMessage(myId, { 
          text: `*✅ BREAKER-ULTRA-MD ONLINE!*\n\n*Your bot is now linked successfully!*\n\nType *.ping* to test\n\nPort: ${PORT}` 
        });
        console.log('✅ Private message sent successfully!');
      } catch (e) {
        console.log('Private msg failed:', e.message);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed, reconnecting:', shouldReconnect);
      if (shouldReconnect) setTimeout(initBot, 3000);
      else console.log('Logged out, delete auth_info_baileys to re-pair');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m?.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    if (text.toLowerCase() === 'ping' || text === '.ping') {
      await sock.sendMessage(m.key.remoteJid, { text: '*PONG! 🏓*\nBREAKER-ULTRA-MD Active!' });
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`container@katabump~ node /home/container/index.js`);
  console.log(`--------------------------------------------------`);
  console.log(`✅ BREAKER-ULTRA-MD IS LIVE!`);
  console.log(`Port: ${PORT}`);
  console.log(`🌐 Open your Network Tab IP:${PORT}`);
  console.log(`Example: http://51.83.6.7:${PORT}`);
  console.log(`--------------------------------------------------`);
  initBot();
});
