const { DisconnectReason } = require('@whiskeysockets/baileys');
let config = {}
try { config = require('../../settings') } catch { try { config = require('../../settings.js') } catch { config = {} } }

module.exports = async (conn, { update, start, close }) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'connecting') {
        console.log(`\n╔══════════════════════════════╗\n║ ⚡ BREAKER-ULTRA MD - CONNECTING  ║\n║ Owner: ${config.ownerName}        \n║ Prefix: [ ${config.prefix} ]              \n║ Mode: ${config.mode}                  \n║ Version: v${config.version}             \n╚══════════════════════════════╝\n`);
    }

    if (connection === 'open') {
        console.log(`✅ BREAKER-ULTRA MD CONNECTED`);
        console.log(`📱 Number: ${conn.user.id.split(':')[0]}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
        
        await conn.sendPresenceUpdate('available');

        // ✅ WELCOME MESSAGE - LIKE YOUR SCREENSHOT
        try {
            const ownerNumber = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : (config.ownerNumber || '256');
            const ownerJid = ownerNumber.includes('@') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;
            
            // Auto detect
            const botNumber = conn.user.id.split(':')[0];
            const botNameFromWA = conn.user.name || 'WhatsApp User';
            const platform = process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Linux Panel';
            const dateTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' EAT';
            
            const welcomeMsg = `┌──『 BREAKER-ULTRA MD 』──
│ » *Username:* ${botNumber}:36
│ » *Name:* ${botNameFromWA}
│ » *Owner:* ${config.ownerName || 'Matsken'}
│ » *Platform:* ${platform}
│ » *Prefix:* [ ${config.prefix || '.'} ]
│ » *Mode:* ${config.mode || 'public'}
│ » *Version:* ${config.version || '2.7.0'}
│ » *Date & Time:* ${dateTime}
│
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└----------------

Type ${config.prefix || '.'}menu to see all commands`;

            setTimeout(async () => {
                await conn.sendMessage(ownerJid, { text: welcomeMsg });
                console.log(`✅ Welcome DM sent to ${ownerNumber}`);
            }, 3500);

        } catch (e) {
            console.log(`❌ Welcome DM failed: ${e.message}`);
        }
    }

    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
            console.log(`♻️ Reconnecting...`);
            start();
        } else {
            console.log(`❌ Logged Out - Delete session and re-pair`);
            close();
        }
    }
};
