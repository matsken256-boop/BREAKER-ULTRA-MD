let welcomeSent = false;

function getSmsg() {
  try { return require('../../Lib/myfunc').smsg } catch {}
  try { return require('../../lib/myfunc').smsg } catch {}
  try { return require('../../../Lib/myfunc').smsg } catch {}
  return (conn, m) => m
}
function getConfig() { 
  try { return require('../../settings') } 
  catch { return { PREFIX: '.', PREFIXES: ['.'] } } 
}
function getExecutor() { 
  try { return require('./executor') } 
  catch (e) { 
    console.log('Executor load fail:', e.message)
    return null 
  } 
}

module.exports = async (conn, m, store) => {
    try {
        // WELCOME MESSAGE - Called once when bot connects
        if (!m && !welcomeSent && conn.user && conn.user.id) {
            welcomeSent = true;
            try {
                await new Promise(r => setTimeout(r, 2500));
                const id = conn.user.id;
                await conn.sendMessage(id, { 
                    text: `✅ *BREAKER-ULTRA MD v2.7.0 🟢ONLINE✅*

*Device:* Google Chrome (Ubuntu)
*Time:* ${new Date().toLocaleString()}

*Bot is Active* 🔥
Type *.ping* to test
*.menu* for commands

🔔 *Follow main channel for updates:*
https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h

_Your bot auto-followed it for you✅_` 
                });
                console.log(`[BREAKER] Welcome sent to ${id}`);
            } catch(e){ console.log('Welcome fail:', e.message) }
            return;
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

        console.log(`[MSG] ${from} | ${isFromMe ? 'ME' : 'OTHER'} | ${body}`)

        // Quick built-in commands for test - these will always work even if executor crashes
        if (lower === '.p' || lower === '.ping') {
            await conn.sendMessage(from, { text: `⚡ *BREAKER ONLINE* - Pong! ${new Date().toLocaleTimeString()}\n\n✅ Executor: ${getExecutor() ? 'OK' : 'FAILED'}` })
            // Don't return, let executor also try to run Resources/Plugins/ping.js
        }
        if (lower === '.menu') {
            await conn.sendMessage(from, { text: `*BREAKER MENU*\n\n.p / .ping - test bot\n.menu - this menu\n\n_Your plugins from Resources/Plugins will load below..._`, 
            footer: "BREAKER-ULTRA MD" })
            // Don't return, let executor load menu.js
        }

        // LOAD ALL PLUGINS FROM Resources/Plugins
        const executor = getExecutor();
        if (executor) {
          try {
            await executor(conn, m, config, store);
          } catch(e) {
            console.log('Executor exec fail:', e.message)
            console.log(e.stack)
          }
        } else {
          console.log('[BREAKER] No executor found - only built-in .p/.menu work')
        }

    } catch (e) {
        console.log('Error in mains.js:', e.message)
        console.log(e.stack)
    }
};