// BREAKER ULTRA MD - ANTICALL - PRO CLEAN
module.exports = async (client, config) => {
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

                // Same reply for both - tags caller
                const msg = `🚨 *CALL DETECTED!* 🚨\n\n@${from.split('@')[0]} Matsken©®, my owner\ncannot receive audio calls at the moment.\n\n⚠️ Your call has been declined.\nPlease avoid calling.`;

                await client.sendMessage(from, {
                    text: msg,
                    mentions: [from]
                });

            } catch (e) {
                console.log(e);
            }
        }
    });
};