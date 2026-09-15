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
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"><title>BREAKER-ULTRA-MD</title></head>
<body style="background:#000;color:#0F0;text-align:center;padding:30px;font-family:monospace">
<h1>⚡ BREAKER-ULTRA-MD ⚡</h1>
<h3 style="color:white">PAIR CODE LOGIN</h3>
<input id="n" placeholder="2567XXXXXXXX" style="padding:12px;width:260px;border-radius:8px;border:2px solid #0F0;background:#111;color:#0F0;text-align:center">
<br><br>
<button onclick="getCode()" style="padding:12px 25px;background:#0F0;color:#000;border:none;border-radius:8px;font-weight:bold;cursor:pointer">GET PAIR CODE</button>
<h1 id="c" style="letter-spacing:5px;color:#FFF;margin-top:20px"></h1>
<p id="e" style="color:red"></p>
<p style="color:#888;margin-top:30px">Enter number with country code<br>Example: 2567680075</p>
</div>
<script>
async function getCode(){
document.getElementById('c').innerText='⏳ Generating...';
document.getElementById('e').innerText='';
const r=await fetch('/pair?number='+document.getElementById('n').value);
const d=await r.json();
if(d.code){document.getElementById('c').innerText=d.code;}
else{document.getElementById('c').innerText='';document.getElementById('e').innerText=d.error;}
}
</script>
</body></html>
`);
});

app.get('/pair', async (req, res) => {
 let num = req.query.number?.replace(/[^0-9]/g, '');
 if (!num) return res.json({ error: 'Enter number with country code' });
 try {
  if (!sock) return res.json({ error: 'Bot not ready yet, wait 10 sec and retry' });
  await delay(1000);
  let code = await sock.requestPairingCode(num);
  code = code?.match(/.{1,4}/g)?.join('-') || code;
  console.log(`>>> PAIR CODE FOR ${num}: ${code} <<<`);
  res.json({ code });
 } catch (e) {
  console.log('Pair error:', e.message);
  res.json({ error: 'Failed: '+e.message+' - Maybe number already paired? Delete auth_info_baileys folder to re-pair.' });
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
   console.log('✅✅✅ BOT CONNECTED SUCCESSFULLY!');
   if (!sentWelcome) {
    try {
     await delay(3000);
     const myId = sock.user.id;
     await sock.sendMessage(myId, { text: "✅ BREAKER-ULTRA MD CONNECTED ✅ AND ONLINE\n\nBot is now active!\n\nCommands: .ping .menu" });
     sentWelcome = true;
     console.log('✅ Welcome message sent to private chat!');
    } catch (e) {
     console.log('Welcome send failed:', e.message);
    }
   }
  }
  if (connection === 'close') {
   const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
   console.log(`Connection closed, reconnect: ${shouldReconnect}`);
   if (shouldReconnect) setTimeout(initBot, 3000);
   else console.log('LOGGED OUT - Delete auth_info_baileys folder to login again!');
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
    const fp = path.join(pluginsPath, file);
    delete require.cache[require.resolve(fp)];
    const plugin = require(fp);
    if (plugin.command && plugin.command.includes(cmdName)) {
     await plugin.handler(m, { conn: sock, args, text });
    }
   } catch (e) {
    console.log(`Plugin ${file} error:`, e.message);
   }
  }
 });
}

app.listen(PORT, '0.0.0.0', () => {
 console.log(`--------------------------------------------`);
 console.log(`✅ BREAKER-ULTRA-MD IS LIVE!`);
 console.log(`✅ PORT: ${PORT}`);
 console.log(`✅ LOGIN LINK -> Check your Network Tab!`);
 console.log(`✅ Look for: 51.83.x.x:${PORT} or 65.108.x.x:${PORT}`);
 console.log(`✅ Open that IP:${PORT} in browser to get pair code`);
 console.log(`--------------------------------------------`);
 initBot();
});
