/*
╔═══════════════════════════════════════╗
║ BREAKER-ULTRA-MD v2.7.0 BOX LOCKED ║
║ Developer: Matsken ║
║ ROOT: LOCKED | Resources: LOCKED ║
║ HOST: Random (Anywhere) PRO ║
╚═══════════════════════════════════════╝
*/

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const settings = require('./settings');

const SESSION_DIR = path.join(__dirname, settings.SESSION_FOLDER || settings.MULTI_SESSION?.sessionFolder || './Sessions/breaker');
const PLUGINS_PATH = path.join(__dirname, 'Resources', 'plugins');

async function startBot(){
  if(!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, {recursive:true});

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`
┌─⊷ ◇ BREAKER ULTRA MD ◇ ⊶┐
│ Version: v${settings.BOT_VERSION || settings.botVersion || '2.7.0'} BOX
│ Session: ${SESSION_DIR}
│ Mode: ${settings.mode}
└─⊷ INITIALIZING...
  `);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: [settings.BOT_NAME || settings.botName || 'BREAKER-ULTRA-MD', 'Chrome', settings.BOT_VERSION || settings.botVersion || '2.7.0'],
    printQRInTerminal: false,
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  // ── LOCKED PLUGINS LOADER (BOX) ──
  const plugins = new Map();
  const loadPlugins = () => {
    if(!fs.existsSync(PLUGINS_PATH)) return;
    const files = fs.readdirSync(PLUGINS_PATH).filter(x=>x.endsWith('.js'));
    for(const f of files){
      try{
        delete require.cache[require.resolve(path.join(PLUGINS_PATH,f))];
        const pl = require(path.join(PLUGINS_PATH,f));
        if(pl.name){
          plugins.set(pl.name.toLowerCase(), pl);
          if(pl.alias) pl.alias.forEach(a=>plugins.set(a.toLowerCase(), pl));
        }
      }catch(e){ console.log(`[PLUGIN ERR] ${f}: ${e.message}`); }
    }
    console.log(`┌─⊷ ${plugins.size} Plugins Loaded - BOX LOCKED`);
  };
  loadPlugins();

  // ── MESSAGE HANDLER - FIXED MODE LOGIC ──
  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0];
    if(!m.message || m.key.fromMe) return;

    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
    if(!body.startsWith(settings.prefix)) return;

    const sender = (m.key.participant || m.key.remoteJid).replace(/[^0-9]/g,'');
    const isOwner = settings.ownerNumbers.includes(sender) || sender === settings.ownerNumber;

    // FIXED: public = everyone, private/self = owner only
    if((settings.mode === 'private' || settings.mode === 'self') &&!isOwner) return;

    const args = body.slice(settings.prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const plugin = plugins.get(cmd);

    if(plugin){
      try{
        await plugin.execute(sock, m, args, { settings, plugins });
      }catch(e){
        console.log(`[CMD ERR] ${cmd}: ${e.message}`);
        await sock.sendMessage(m.key.remoteJid, { text: `┌─⊷ ◇ ERROR ◇ ⊶┐\n│ ${e.message}\n└─⊷` }, { quoted: m });
      }
    }
  });

  // ── CONNECTION - RANDOM HOST PRO ──
  sock.ev.on('connection.update', async (u)=>{
    const { connection, lastDisconnect } = u;
    if(connection === 'close'){
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`Connection closed: ${reason}`);
      if(reason!== DisconnectReason.loggedOut){
        console.log('Reconnecting...');
        setTimeout(startBot, 3000);
      }else{
        console.log('Logged out! Delete Sessions/breaker and re-pair.');
      }
    }
    if(connection === 'open'){
      console.log(`
┌─⊷ ◇ BREAKER ULTRA MD ◇ ⊶┐
│ ✅ ${settings.BOT_NAME || settings.botName} v${settings.BOT_VERSION || settings.botVersion} Connected
│ 👑 Owner: ${settings.ownerNumber}
│ 📁 Plugins: ${plugins.size} Locked
└─⊷ READY TO DEPLOY ANYWHERE
      `);
    }
  });
}

module.exports = startBot;

// Auto-start if called directly
if(require.main === module){
  startBot();
}