const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs'); const path = require('path'); const pino = require('pino');
const express = require('express'); const settings = require('./settings');

const app = express(); const PORT = process.env.PORT || settings.PORT || 3000;
app.use(express.static(__dirname));
const isPaired = () => fs.existsSync(path.join(__dirname, settings.MULTI || './session', 'creds.json'));

app.get('/', (req, res) => {
  if (isPaired()) return res.send('<h2 style="color:green;text-align:center;margin-top:40vh">🔒 Already Paired - Portal Locked</h2>');
  res.sendFile(path.join(__dirname, 'pair.html'));
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(settings.MULTI || './session');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, logger: pino({ level: "silent" }), auth: state, browser: [settings.botName,"Chrome","1.0.0"] });
  sock.ev.on("creds.update", saveCreds);
  const pluginsPath = path.join(__dirname,"resources","plugins"); const plugins = new Map();
  if (fs.existsSync(pluginsPath)) fs.readdirSync(pluginsPath).filter(f=>f.endsWith(".js")).forEach(f=>{
    try{ const p=require(path.join(pluginsPath,f)); if(p.name) plugins.set(p.name,p);}catch{}
  });
  sock.ev.on("messages.upsert", async ({messages}) => {
    const m=messages[0]; if(!m.message||m.key.fromMe) return;
    const body=m.message.conversation||m.message.extendedTextMessage?.text||"";
    if(!body.startsWith(settings.prefix)) return;
    const args=body.slice(settings.prefix.length).trim().split(/ +/); const cmd=args.shift().toLowerCase();
    const plugin=plugins.get(cmd); if(plugin) try{ await plugin.execute(sock,m,args,{settings}); }catch{}
  });
  sock.ev.on("connection.update", u=>{
    if(u.connection==="close" && u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();
    if(u.connection==="open") console.log(`🔥 ${settings.botName} Connected`);
  });
}

app.listen(PORT,'0.0.0.0',()=>{ console.log(`Server on ${PORT}`); console.log(`Web Link: http://YOUR-IP:${PORT} - Auto-detected`); startBot(); });
