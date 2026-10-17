const { smsg } = require('../../Lib/myfunc');
const config = require('../../settings');
let welcomeSent = false;

module.exports = async (conn, m, store) => {
    try {

        if (!welcomeSent && conn.user && conn.user.id) {
            welcomeSent = true;
            try {
                await new Promise(r => setTimeout(r, 3000));
                const id = conn.user.id;
                await conn.sendMessage(id, { 
                    text: `✅ *BREAKER-ULTRA MD v2.7.0 🟢ONLINE✅*\n\n*Device:* Google Chrome (Ubuntu)\n*Time:* ${new Date().toLocaleString()}\n\nBot is Active 🔥\nType .ping to test\n.menu for commands` 
                });
                console.log(`[BREAKER] Welcome sent to ${id}`);
            } catch(e){ console.log('Welcome error:', e.message) }
        }

        if (!m) return;
        m = smsg(conn, m, store);
        if (!m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? m.key.participant : from;

        const body = m.mtype === 'conversation'? m.message.conversation :
                     m.mtype === 'extendedTextMessage'? m.message.extendedTextMessage.text :
                     m.mtype === 'imageMessage'? m.message.imageMessage.caption :
                     m.mtype === 'videoMessage'? m.message.videoMessage.caption : '';

        if (!body) return;

        // Call executor - this loads Plugins
        const executor = require('./executor');
        await executor(conn, m, config, store);

    } catch (e) {
        console.log('Error in mains.js:', e);
    }
};