const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const axios = require('axios');
const settings = require('./settings');

const app = express();
const PORT = process.env.PORT || settings.PORT || 3000;

app.use(express.static(__dirname));
app.get('/', (req, res) => {
    const f = path.join(__dirname, 'pair.html');
    if (fs.existsSync(f)) return res.sendFile(f);
    res.send(`<h2>${settings.botName}</h2>`);
});

async function getServerLink() {
    if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
    if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    if (process.env.HEROKU_APP_NAME) return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    try {
        let ip = process.env.SERVER_IP || process.env.ALLOCATION_IP;
        if (!ip) {
            const r = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
            ip = r.data.ip;
        }
        return `http://${ip}:${PORT}`;
    } catch {
        return `http://localhost:${PORT}`;
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(settings.MULTI || './session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: [settings.botName, "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);
    const pluginsPath = path.join(__dirname, "resources", "plugins");
    const plugins = new Map();

    if (fs.existsSync(pluginsPath)) {
        const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith(".js"));
        for (const file of files) {
            try {
                const plugin = require(path.join(pluginsPath, file));
                if (plugin.name) plugins.set(plugin.name, plugin);
            } catch {}
        }
    }

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        if (!body.startsWith(settings.prefix)) return;
        const args = body.slice(settings.prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const plugin = plugins.get(cmdName);
        if (plugin) {
            try { await plugin.execute(sock, m, args, { settings }); } catch (e) { console.error(e); }
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot();
        } else if (connection === "open") {
            console.log(`🔥 ${settings.botName} Connected`);
        }
    });
}

app.listen(PORT, '0.0.0.0', async () => {
    const link = await getServerLink();
    console.log(`Server on ${PORT}`);
    console.log(`⚡ BREAKER-ULTRA MD WEB LOGIN ⚡`);
    console.log(`Web Link: ${link}`);
    console.log(`Also open via your Katabump allocation link`);
    console.log(`- Auto-detected!`);
    startBot();
});
