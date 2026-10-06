const { smsg } = require('../../Lib/myfunc');
const config = require('../../settings');

module.exports = async (conn, m, store) => {
    try {
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