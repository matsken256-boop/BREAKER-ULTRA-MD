const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs'); const path = require('path'); const pino = require('pino');
const settings = require('./settings');

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState(settings.MULTI_SESSION.sessionFolder);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, logger: pino({ level: 'silent' }), auth: state, browser: [settings.botName, 'Chrome', settings.botVersion] });
  sock.ev.on('creds.update', saveCreds);

  // Load plugins from Resources/plugins
  const plugins = new Map();
  const pPath = path.join(__dirname, 'Resources', 'plugins');
  if (fs.existsSync(pPath)){
    for(const f of fs.readdirSync(pPath).filter(x=>x.endsWith('.js'))){
      try{ const pl=require(path.join(pPath,f)); if(pl.name) plugins.set(pl.name, pl); }catch{}
    }
  }

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m=messages[0]; if(!m.message||m.key.fromMe) return;
    const body=m.message.conversation||m.message.extendedTextMessage?.text||"";
    if(!body.startsWith(settings.prefix)) return;
    if(settings.mode!=='public'){
      const sender=(m.key.participant||m.key.remoteJid).replace(/[^0-9]/g,'');
      if(!settings.ownerNumbers.includes(sender)) return;
    }
    const args=body.slice(settings.prefix.length).trim().split(/ +/);
    const cmd=args.shift().toLowerCase();
    const plugin=plugins.get(cmd);
    if(plugin) await plugin.execute(sock,m,args,{settings});
  });

  sock.ev.on('connection.update', u=>{
    if(u.connection==='close'&&u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();
    if(u.connection==='open') console.log(`${settings.botName} v${settings.botVersion} Connected`);
  });
}

module.exports = startBot;
