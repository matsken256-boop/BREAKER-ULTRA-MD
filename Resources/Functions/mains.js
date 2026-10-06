const { smsg } = require('./smsg');
const config = require('../../settings');

module.exports = async (conn, m) => {
    try {
        if (!m) return;
        m = smsg(conn, m);
        if (!m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup? m.key.participant : from;
        const pushname = m.pushName || 'No Name';

        const body = m.mtype === 'conversation'? m.message.conversation :
                     m.mtype === 'extendedTextMessage'? m.message.extendedTextMessage.text :
                     m.mtype === 'imageMessage'? m.message.imageMessage.caption :
                     m.mtype === 'videoMessage'? m.message.videoMessage.caption : '';

        if (!body) return;

        const prefix = config.prefix;
        const isCmd = body.startsWith(prefix);
        if (!isCmd) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        const isOwner = config.ownerNumber.includes(sender.split('@')[0]) || m.key.fromMe;

        // Load executor
        const executor = require('./executor');
        await executor(conn, m, config);

    } catch (e) {
        console.log('Error in mains.js:', e);
    }
};