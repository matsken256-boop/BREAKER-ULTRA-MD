let welcomeSent = false;

function getSmsg() {
  try { return require('../../Lib/myfunc').smsg } catch {}
  try { return require('../../lib/myfunc').smsg } catch {}
  try { return require('../../../Lib/myfunc').smsg } catch {}
  return (conn, m) => m
}
function getConfig() { try { return require('../../settings') } catch { return {} } }
function getExecutor() { try { return require('./executor') } catch { return null } }

module.exports = async (conn, m, store) => {
    try {
        if (!welcomeSent && conn.user && conn.user.id) {
            welcomeSent = true;
            try {
                await new Promise(r => setTimeout(r, 2000));
                const id = conn.user.id;
                await conn.sendMessage(id, { 
                    text: `✅ *BREAKER-ULTRA MD v2.7.0 🟢ONLINE✅*\n\n*Device:* Google Chrome (Ubuntu)\n*Time:* ${new Date().toLocaleString()}\n\nBot is Active 🔥\nType .ping to test\n.menu for commands` 
                });
                console.log(`[BREAKER] Welcome sent to ${id}`);
            } catch(e){}
        }

        if (!m) return;
        const smsg = getSmsg();
        const config = getConfig();
        m = smsg(conn, m, store);
        if (!m.message) return;

        const from = m.key.remoteJid;
        const body = m.mtype === 'conversation'? m.message.conversation :
                     m.mtype === 'extendedTextMessage'? m.message.extendedTextMessage.text :
                     m.mtype === 'imageMessage'? m.message.imageMessage.caption :
                     m.mtype === 'videoMessage'? m.message.videoMessage.caption : '';
        if (!body) return;

        const lower = body.toLowerCase().trim()
        const isCmd = lower.startsWith('.')
        const isFromMe = m.key.fromMe

        // ALLOW self-commands like .p .menu .ping when you message yourself
        if (isFromMe && !isCmd) return
        // If it's from you AND it's a command, ALLOW IT

        console.log(`[MSG] ${from} | ${isFromMe ? 'ME' : 'OTHER'} | ${body}`)

        // Quick built-in commands for test
        if (lower === '.p' || lower === '.ping') {
            await conn.sendMessage(from, { text: `⚡ BREAKER ONLINE - Pong! ${new Date().toLocaleTimeString()}` })
            return
        }
        if (lower === '.menu') {
            await conn.sendMessage(from, { text: `*BREAKER MENU*\n\n.p / .ping - test\n.menu - this menu\n\nYour plugins from executor will load below...` })
            return
        }

        const executor = getExecutor();
        if (executor) await executor(conn, m, config, store);

    } catch (e) {
        console.log('Error in mains.js:', e.message)
    }
};