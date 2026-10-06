const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');

async function startBot(sessionId) {
    if (!sessionId) sessionId = (process.env.OWNER_NUMBER || "BREAKER-ULTRA").replace(/[^0-9]/g, "");
    
    const sessionPath = path.join(__dirname, '..', 'Sessions', sessionId);
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
        },
        browser: ['BREAKER-ULTRA MD', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        console.log(`[BREAKER-ULTRA MD] New Session: ${sessionId} - Waiting for pairing... LOCKED`);
        setTimeout(async () => {
            try {
                const phone = sessionId.replace(/[^0-9]/g, "");
                const code = await sock.requestPairingCode(phone);
                console.log(`\n========== MULTI-SESSION ==========\nSession: ${sessionId}\nPAIR CODE: ${code}\nExpires: 2 mins\nPortal: LOCKED Owner Only\n==================================\n`);
            } catch (e) {
                console.log('Pair error:', e.message);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot(sessionId);
            else {
                console.log(`[BREAKER-ULTRA] Session ${sessionId} logged out - deleting...`);
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            console.log(`[BREAKER-ULTRA MD] ✅ Session ${sessionId} Connected!`);
        }
    });

    return sock;
}

module.exports = { startBot };