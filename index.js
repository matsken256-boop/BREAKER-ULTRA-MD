const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const settings = require("./settings");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(settings.MULTI_SESSION.sessionFolder || "./auth");
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
                if (plugin.name) {
                    plugins.set(plugin.name, plugin);
                    console.log(`✅ Loaded: ${plugin.name}`);
                }
            } catch (e) {
                console.log(`❌ Failed ${file}: ${e.message}`);
            }
        }
    }

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const prefix = settings.prefix;
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const plugin = plugins.get(cmdName);

        if (plugin) {
            try {
                await plugin.execute(sock, m, args, { settings });
            } catch (err) {
                console.error(err);
            }
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log(`🔥 ${settings.botName} Multi-Session Connected! Owner: ${settings.ownerNumber}`);
        }
    });
}

startBot();
