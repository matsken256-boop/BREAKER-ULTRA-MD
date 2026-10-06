const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.join(__dirname, 'Sessions', 'breaker');
const PAIR_FILE = path.join(__dirname, 'pair_code.txt');

if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

async function startBot(phoneNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
        },
        browser: Browsers.macOS('Desktop'),
        markOnlineOnConnect: true,
        syncFullHistory: false
    });

    if (!sock.authState.creds.registered) {
        let num = phoneNumber;
        if (!num) {
            try {
                const settings = require('./settings');
                num = settings.BOT_NUMBER || null;
            } catch {}
        }

        if (num) {
            num = num.toString().replace(/[^0-9]/g, '');
            console.log(`\n⚡ BREAKER ULTRA-MD v2.7.0`);
            console.log(`📱 Requesting REAL WhatsApp code for: ${num}`);

            await delay(3000);

            try {
                let code = await sock.requestPairingCode(num);
                code = code.match(/.{1,4}/g).join('-');

                console.log(`\n================================`);
                console.log(` REAL CODE: ${code}`);
                console.log(`================================\n`);
                console.log(`WhatsApp > Linked Devices > Link with phone number > Enter: ${code}\n`);

                fs.writeFileSync(PAIR_FILE, code);
                global.pairCode = code;

            } catch (err) {
                console.log('Pair Failed:', err.message);
            }
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                if (fs.existsSync(SESSION_DIR)) {
                    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
                    fs.mkdirSync(SESSION_DIR, { recursive: true });
                }
                await delay(2000);
                startBot(phoneNumber);
            } else {
                await delay(3000);
                startBot(phoneNumber);
            }
        } else if (connection === 'open') {
            console.log('\n✅ BREAKER ULTRA-MD CONNECTED!');
            console.log('⚡ BOX LOCKED v2.7.0 ONLINE!\n');
            if (fs.existsSync(PAIR_FILE)) fs.unlinkSync(PAIR_FILE);

            try {
                if (fs.existsSync(path.join(__dirname, 'breaker.js'))) {
                    require('./breaker')(sock);
                }
            } catch {}
        }
    });

    global.sock = sock;
    return sock;
}

module.exports = startBot;

if (require.main === module) {
    startBot(process.argv[2]);
}