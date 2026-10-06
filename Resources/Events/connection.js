const { DisconnectReason } = require('@whiskeysockets/baileys');
const config = require('../../settings');

module.exports = async (conn, { update, start, close }) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'connecting') {
        console.log(`\n╔══════════════════════════════╗
║ ⚡ BREAKER-ULTRA MD - CONNECTING  ║
║ Owner: ${config.ownerName}        
║ Prefix: [ ${config.prefix} ]              
║ Mode: ${config.mode}                  
║ Version: v${config.version}             
╚══════════════════════════════╝\n`);
    }

    if (connection === 'open') {
        console.log(`✅ BREAKER-ULTRA MD CONNECTED`);
        console.log(`📱 Number: ${conn.user.id.split(':')[0]}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
        console.log(`🔗 https://t.me/breakerxmd_official\n`);
        
        // Auto status - PRO only, no game status
        await conn.sendPresenceUpdate('available');
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