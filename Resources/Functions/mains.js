let welcomeSent = false;

// Safe require - won't crash if Lib missing
function getSmsg() {
  try { return require('../../Lib/myfunc').smsg } catch {}
  try { return require('../../lib/myfunc').smsg } catch {}
  try { return require('../../../Lib/myfunc').smsg } catch {}
  try { return require('../../Lib/myfunc.js').smsg } catch {}
  // Fallback dummy smsg
  return (conn, m) => { m.message = m.message; return m }
}

function getConfig() {
  try { return require('../../settings') } catch { return {} }
}

function getExecutor() {
  try { return require('./executor') } catch { return null }
}

module.exports = async (conn, m, store) => {
    try {
        // WELCOME - runs even without smsg
        if (!welcomeSent && conn.user && conn.user.id) {
            welcomeSent = true;
            try {
                await new Promise(r => setTimeout(r, 2000));
                const id = conn.user.id;
                await conn.sendMessage(id, { 
                    text: `✅ *BREAKER-ULTRA MD v2.7.0 🟢ONLINE✅*\n\n*Device:* Google Chrome (Ubuntu)\n*Time:* ${new Date().toLocaleString()}\n\nBot is Active 🔥\nType .ping to test\n.menu for commands` 
                });
                console.log(`[BREAKER] Welcome sent to ${id}`);
            } catch(e){ console.log('Welcome error:', e.message) }
        }

        if (!m) return;

        // Now load smsg safely
        const smsg = getSmsg();
        const config = getConfig();
        m = smsg(conn, m, store);
        if (!m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        const body = m.mtype === 'conversation'? m.message.conversation :
                     m.mtype === 'extendedTextMessage'? m.message.extendedTextMessage.text :
                     m.mtype === 'imageMessage'? m.message.imageMessage.caption :
                     m.mtype === 'videoMessage'? m.message.videoMessage.caption : '';

        if (!body) return;

        const executor = getExecutor();
        if (executor) await executor(conn, m, config, store);

    } catch (e) {
        console.log('Error in mains.js:', e);
        console.log(e.stack)
    }
};