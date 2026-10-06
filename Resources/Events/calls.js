module.exports = async (client) => {
    client.ev.on('call', async (calls) => {
        for (let call of calls) {
            if (call.status!== 'offer') continue;
            const from = call.from;
            const anticall = global.db?.settings?.anticall || { decline: false, block: false };
            if (!anticall.decline &&!anticall.block) continue;
            try {
                await client.rejectCall(call.id, from);
                if (anticall.block) {
                    await client.updateBlockStatus(from, 'block');
                }
                const msg = `🚨 *CALL DETECTED!* 🚨\n\n@${from.split('@')[0]}, my owner cannot receive audio calls at the moment.\n\n⚠️ Your call has been declined.\nPlease avoid calling.`;
                await client.sendMessage(from, {
                    text: msg,
                    mentions: [from]
                });
            } catch (e) {
                console.log('[ANTICALL ERROR]', e);
            }
        }
    });
};