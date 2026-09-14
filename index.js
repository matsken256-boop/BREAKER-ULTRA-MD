const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 20130;

let sock;
let latestCode = null;

async function initBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
        },
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"], // FIXED - Chrome 20 works
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ BREAKER-ULTRA-MD CONNECTED! Bot is now online');
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('Connection closed, reason:', reason);
            if (reason!== DisconnectReason.loggedOut) {
                initBot();
            }
        }
    });

    // Optional: log incoming messages to see bot is alive
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message) return;
        const txt = m.message.conversation || m.message.extendedTextMessage?.text || "";
        console.log(`MSG from ${m.key.remoteJid}: ${txt}`);
    });
}

app.get('/', (req, res) => {
    res.send(`
    <html>
    <head><title>BREAKER ULTRA</title><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>body{background:#0a0a0a;color:#00ff00;font-family:monospace;text-align:center;padding-top:60px}
    input{padding:12px;width:260px;text-align:center} button{padding:12px 30px;background:#00ff00;color:#000;font-weight:bold;border:none;cursor:pointer}
    #code{margin-top:40px;letter-spacing:8px;font-size:32px}</style>
    </head>
    <body>
    <h2>BREAKER-ULTRA-MD</h2>
    <p>Pairing Dashboard</p>
    <p>Enter your WhatsApp number with country code</p>
    <input id="num" placeholder="2567XXXXXXXX" value="256766800757"><br><br>
    <button onclick="getCode()">GET PAIR CODE</button>
    <h1 id="code"></h1><p id="info"></p>
    <script>
    async function getCode(){
        const n=document.getElementById('num').value;
        if(!n) return alert('Enter number');
        document.getElementById('info').innerText='WAIT... Generating code...';
        const r=await fetch('/pair?number='+n);
        const d=await r.json();
        document.getElementById('code').innerText=d.code || d.error;
        document.getElementById('info').innerText=d.code? 'Enter this code in WhatsApp > Linked Devices > Link with phone number' : '';
    }
    </script>
    </body></html>
    `);
});

app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.json({ error: 'Number required' });
    number = number.replace(/[^0-9]/g, '');

    try {
        if (!sock) return res.json({ error: 'Bot starting, wait 5 sec and retry' });

        const { state } = await useMultiFileAuthState('./auth_info_baileys');
        if (state.creds.registered) {
            return res.json({ error: 'Already registered. Delete auth_info_baileys to pair new number' });
        }

        await delay(1500); // IMPORTANT FIX - Wait for socket to be ready
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
    console.log(`✅ BREAKER-ULTRA-MD IS LIVE!`);
    console.log(`Port: ${PORT}`);
    console.log(`Open your Network Tab IP:${PORT}`);
    console.log(`Example: http://51.83.6.7:${PORT}`);
    initBot();
});
