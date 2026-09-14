const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const fs = require('fs');

const app = express();
const PORT = 20130;
let sock;

// ===== EXPRESS SERVER =====
app.get('/', (req, res) => {
    res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#000;color:#0f0;text-align:center;padding:30px;font-family:monospace}input{padding:15px;width:260px}button{padding:15px 30px;background:#0f0;color:#000;font-weight:bold;border:none}h1{letter-spacing:7px;font-size:32px;color:#0f0}</style></head><body><h2>BREAKER-ULTRA-MD PAIR</h2><input id="n" value="256766800757"><br><br><button onclick="go()">GET PAIR CODE</button><h1 id="c"></h1><p id="i"></p><script>async function go(){const n=document.getElementById('n').value;document.getElementById('i').innerText='Generating...';const r=await fetch('/pair?number='+n);const d=await r.json();document.getElementById('c').innerText=d.code||d.error;document.getElementById('i').innerText=d.code?'WhatsApp > Linked Devices > Link with phone number':'Error'}</script></body></html>`);
});

app.get('/pair', async (req, res) => {
    let num = req.query.number?.replace(/[^0-9]/g, '');
    if (!num) return res.json({ error: 'Number required' });
    try {
        if (!sock) return res.json({ error: 'Bot starting, wait 5 sec' });
        await delay(1500);
        let code = await sock.requestPairingCode(num);
        code = code.match(/.{1,4}/g).join('-');
        console.log(`\n🔑 PAIR CODE FOR ${num}: ${code}\n`);
        res.json({ code });
    } catch (e) {
        res.json({ error: e.message });
    }
});

// ===== WHATSAPP BOT =====
async function initBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })) },
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') {
            console.log('\n✅✅✅ BREAKER-ULTRA-MD CONNECTED SUCCESSFULLY! ✅✅✅\n');
            try {
                await delay(2000);
                await sock.sendMessage(sock.user.id, { text: "*✅ BREAKER-ULTRA-MD ONLINE!* 🔥\n\nLinked as Chrome Ubuntu\nSend.ping to test" });
            } catch {}
        }
        if (connection === 'close') {
            const r = lastDisconnect?.error?.output?.statusCode;
            if (r!== DisconnectReason.loggedOut) setTimeout(initBot, 3000);
        }
    });
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.fromMe) return;
        const t = m.message.conversation || m.message.extendedTextMessage?.text || "";
        if (t.toLowerCase() === 'ping' || t === '.ping') {
            await sock.sendMessage(m.key.remoteJid, { text: "*PONG!* BREAKER Active!" });
        }
    });
}

// ===== START SERVER AND PRINT LOGIN LINK ON CONSOLE =====
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n\n');
    console.log('--------------------------------------------------');
    console.log('✅ BREAKER-ULTRA-MD IS LIVE!');
    console.log(`✅ Port: ${PORT}`);
    console.log('--------------------------------------------------');
    console.log(`🔗 LOGIN LINK: http://localhost:${PORT}`);
    console.log(`🔗 ON KATABUMP: Click NETWORK TAB > Port ${PORT} > OPEN`);
    console.log(`🔗 DIRECT LINK WILL BE: https://YOUR-WORKSPACE-${PORT}.katabump.com`);
    console.log('--------------------------------------------------');
    console.log('👉 Open that Network link to get Pair Code');
    console.log('--------------------------------------------------\n\n');
    initBot();
});
