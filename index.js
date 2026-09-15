const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 20130;
let sock;
let sentWelcome = false;

app.get('/', (req, res) => {
 res.send(`
<div style="background:#000;color:#0F0;text-align:center;padding:40px;font-family:monospace">
<h2>BREAKER-ULTRA-MD</h2>
<input id="n" placeholder="Enter number 2567..." style="padding:10px;width:250px" value="2567680075">
<button onclick="getCode()" style="padding:10px 20px;background:#0F0;border:none;cursor:pointer">GET PAIR CODE</button>
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
  console.log(`>> PAIR CODE FOR ${num}: ${code} <<`);
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
   if (!sentWelcome) {
    try {
     await delay(4000);
     const myId = sock.user.id;
     await sock.sendMessage(myId, {
      text: "✅ BREAKER-ULTRA MD CONNECTED ✅ AND ONLINE\n\nYour bot is now linked successfully!\n\nType.ping and.menu to test!\n\nPort: 20130"
     });
     sentWelcome = true;
     console.log('✅ Private message sent!');
    } catch (e) {
     console.log('Private msg failed:', e.message);
    }
   }
  }
  if (connection === 'close') {
   const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
   if (shouldReconnect) setTimeout(initBot, 3000);
   else console.log('Logged out, delete auth_info_baileys to re-pair');
  }
 });

 sock.ev.on('messages.upsert', async ({ messages }) => {
  const m = messages[0];
  if (!m.message || m.key.fromMe) return;
  const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
  if (!text.startsWith('.')) return;
  const args = text.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const pluginsPath = path.join(__dirname, 'resources', 'Plugins');
  if (!fs.existsSync(pluginsPath)) return;
  const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
   try {
    const pluginPath = path.join(pluginsPath, file);
    delete require.cache[require.resolve(pluginPath)];
    const plugin = require(pluginPath);
    if (plugin.command && plugin.command.includes(cmdName)) {
     await plugin.handler(m, { conn: sock, args, text });
    }
   } catch (e) {
    console.log(`Error in ${file}:`, e.message);
   }
  }
 });
}

app.listen(PORT, '0.0.0.0', () => {
 console.log(`✅ BREAKER-ULTRA-MD IS LIVE on ${PORT}`);
 initBot();
});
