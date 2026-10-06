const config = require('../../settings');

module.exports = async (conn, m, store) => {
    if (!m.isGroup) return;

    try {
        const metadata = await conn.groupMetadata(m.chat);
        const isBotAdmin = metadata.participants.find(p => p.id === conn.user.id)?.admin;
        if (!isBotAdmin) return;

        const sender = m.sender;
        const isAdmin = metadata.participants.find(p => p.id === sender)?.admin;
        const isOwner = config.ownerNumber.includes(sender.split('@')[0]);
        if (isAdmin || isOwner) return;

        if (config.antiLink) {
            if (/(https:\/\/chat\.whatsapp\.com|https:\/\/wa\.me|wa\.me)/gi.test(m.text)) {
                await conn.sendMessage(m.chat, { text: `*⚠️ BREAKER-ULTRA ANTI-LINK*\nLink detected from @${sender.split('@')[0]}`, mentions: [sender] });
                await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
            }
        }
    } catch {}
};