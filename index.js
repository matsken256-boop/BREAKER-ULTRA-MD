
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 20130;
let sock;

async function initBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
        },
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ BREAKER-ULTRA-MD CONNECTED! Bot is now online');
            console.log('✅ SENDING CONNECTED MESSAGE TO OWNER...');
            try {
                const jid = sock.user.id;
                await delay(3000);
                await sock.sendMessage(jid, {
                    text: `*✅ BREAKER-ULTRA-MD CONNECTED!* 🔥

Your bot is now ACTIVE as linked device!
Device: Google Chrome (Ubuntu)

*Commands to test:*
• Send *.ping* or *hi* - bot will reply
• Your bot is now online 24/7 on Katabump

_Now restore full commands folder if you want full menu_`
                });
                console.log('✅ Message sent to owner private chat!');
            } catch (e) {
                console.log('Could not send owner message:', e.message);
            }
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('Connection closed, reason:', reason);
            if (reason!== DisconnectReason.loggedOut) {
                initBot();
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.fromMe) return;
        const txt = m.message.conversation || m.message.extendedTextMessage?.text || "";
        console.log(`MSG from ${m.key.remoteJid}: ${txt}`);

        const lower = txt.toLowerCase();
        if (lower === 'hi' || lower === 'hello' || lower === 'ping' || txt === '.ping' || txt === '.menu' || txt === '!menu' || txt === '!ping') {
            await sock.sendMessage(m.key.remoteJid, { text: "*BREAKER-ULTRA-MD IS ONLINE* 🔥\n\n✅ Bot is working!\n\nType *.menu* for commands\nPowered by Chrome Ubuntu" });
        }
    });
}

app.get('/', (req, res) => {
    res.send(`
    <html><head><title>BREAKER ULTRA</title><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>body{background:#0a0a0a;color:#00ff00;font-family:monospace;text-align:center;padding-top:40px}
    input{padding:12px;width:260px;text-align:center} button{padding:12px 30px;background:#00ff00;color:#000;font-weight:bold;border:none;cursor:pointer}
    #code{margin-top:40px;letter-spacing:8px;font-size:28px}#status{color:#fff}</style></head>
    <body><h2>BREAKER-ULTRA-MD</h2><p>✅ LINKED AS Chrome Ubuntu</p>
    <p>Bot is ACTIVE - Check WhatsApp private chat for connected message</p>
    <input id="num" placeholder="2567XXXXXXXX" value="256766800757"><br><br>
    <button onclick="getCode()">GET PAIR CODE</button>
    <h1 id="code"></h1><p id="info"></p>
    <script>
    async function getCode(){
        const n=document.getElementById('num').value;
        if(!n) return alert('Enter number');
        document.getElementById('info').innerText='WAIT... Generating code...';
        const r=await fetch('/pair?number='+n);const d=await r.json();
        document.getElementById('code').innerText=d.code||d.error;
        document.getElementById('info').innerText=d.code?'Enter in WhatsApp > Linked Devices > Link with phone number':'';
    }</script></body></html>`);
});

app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.json({ error: 'Number required' });
    number = number.replace(/[^0-9]/g, '');
    try {
        if (!sock) return res.json({ error: 'Bot starting, wait 5 sec and retry' });
        await delay(1500);
        let code = await sock.requestPairingCode(number);
        code = code.match(/.{1,4}/g)?.join('-') || code;
        console.log(`PAIR CODE: ${code} FOR ${number}`);
        res.json({ code: code });
    } catch (e) {
        console.log(e);
        res.json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ BREAKER-ULTRA-MD IS LIVE! Port: ${PORT}`);
    initBot();
});
