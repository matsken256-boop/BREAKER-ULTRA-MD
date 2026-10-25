const { DisconnectReason } = require('@whiskeysockets/baileys');
let config = {}
try { config = require('../../settings') } catch { try { config = require('../../settings.js') } catch { config = {} } }

config.ownerName = config.ownerName || 'Matsken'
config.botName = config.botName || 'Breaker-Ultra MD'
config.prefix = config.prefix || '.'
config.mode = 'public'
config.version = config.version || '2.7.0'

module.exports = async (conn, { update, start, close }) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
        console.log(`\n╔══════════════════════════════╗\n║ ⚡ BREAKER-ULTRA MD - CONNECTING  ║\n║ Owner: ${config.ownerName}        \n║ Prefix: [ ${config.prefix} ]              \n║ Mode: public                  \n║ Version: v${config.version}             \n╚══════════════════════════════╝\n`);
    }

    if (connection === 'open') {
        console.log(`✅ BREAKER-ULTRA MD CONNECTED`);
        console.log(`📱 Bot ID: ${conn.user.id}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);

        try { await conn.sendPresenceUpdate('available'); } catch {}

        // ✅ WELCOME MESSAGE - PUBLIC VERSION, NO FIXED NUMBER
        try {
            // Send to SELF (the bot's own chat), not to ownerNumber - works for public
            const selfJid = conn.user.id
            const botNameFromWA = conn.user.name || config.botName
            const platform = process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.PTERODACTYL ? 'Katabump Panel' : 'Linux Panel';
            const dateTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' EAT';

            const welcomeMsg = `┌──『 ${config.botName.toUpperCase()} 』──
│ » *Name:* ${botNameFromWA}
│ » *Owner:* ${config.ownerName}
│ » *Platform:* ${platform}
│ » *Prefix:* [ ${config.prefix} ]
│ » *Mode:* public ✅
│ » *Version:* ${config.version}
│ » *Date & Time:* ${dateTime}
│
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└----------------

Hello! I am *${config.botName}*, ready for everyone.

Type *${config.prefix}menu* to see all commands`;

            setTimeout(async () => {
                try {
                    await conn.sendMessage(selfJid, { text: welcomeMsg });
                    console.log(`✅ Welcome DM sent to SELF (bot)`);
                } catch (e) {
                    console.log(`❌ Welcome to self failed, trying owner fallback: ${e.message}`);
                    // Fallback: if self fails, try first owner number if exists
                    if (config.ownerNumber) {
                        const ownerNum = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber
                        const ownerJid = ownerNum.includes('@') ? ownerNum : `${ownerNum}@s.whatsapp.net`
                        await conn.sendMessage(ownerJid, { text: welcomeMsg }).catch(()=>{})
                    }
                }
            }, 3500);

        } catch (e) {
            console.log(`❌ Welcome DM failed: ${e.message}`);
        }
    }

    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
            console.log(`♻️ Reconnecting...`);
            if (typeof start === 'function') start();
        } else {
            console.log(`❌ Logged Out - Delete session and re-pair`);
            if (typeof close === 'function') close();
        }
    }
};