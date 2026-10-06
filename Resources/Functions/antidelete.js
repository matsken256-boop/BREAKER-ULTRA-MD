const config = require('../../settings');

module.exports = async (conn, m) => {
    if (!config.antiDelete) return;
    if (!m.message || m.mtype!== 'protocolMessage') return;

    const type = m.message.protocolMessage.type;
    if (type!== 0) return;

    try {
        const deletedKey = m.message.protocolMessage.key;
        const chat = deletedKey.remoteJid;
        const isGroup = chat.endsWith('@g.us');

        // Load message from store
        const store = conn.store || {};
        const loadMessage = await store.loadMessage?.(chat, deletedKey.id);
        if (!loadMessage) return;

        const sender = loadMessage.key.participant || loadMessage.key.remoteJid;
        const pushname = loadMessage.pushName || 'Unknown';

        let text = `*🚨 BREAKER-ULTRA ANTIDELETE 🚨*\n\n`;
        text += `*From:* @${sender.split('@')[0]}\n`;
        text += `*Name:* ${pushname}\n`;
        text += `*Chat:* ${isGroup? 'Group' : 'Private'}\n`;
        text += `*Time:* ${new Date().toLocaleString()}\n\n`;
        text += `*Deleted Message Recovered Below:*`;

        await conn.sendMessage(chat, { text: text, mentions: [sender] }, { quoted: loadMessage });
        await conn.copyNForward(chat, loadMessage, false);

    } catch (e) {
        console.log('Antidelete error:', e.message);
    }
};