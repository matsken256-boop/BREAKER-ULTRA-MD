let welcomeSent = false;

function getHost() {
    if (process.env.RENDER) return "Render";
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL) return "Railway";
    if (process.env.DYNO) return "Heroku";
    if (process.env.KATBUMPS || process.env.PANEL_ID) return "Panel";
    if (process.env.PTERODACTYL) return "Panel";
    if (process.env.REPLIT_DB_URL) return "Replit";
    if (process.platform === "android") return "Android";
    if (process.platform === "linux") return "Linux Panel";
    return process.platform;
}

module.exports = async (conn, m, store) => {
    if (!m) {
        if (welcomeSent) return;
        if (!conn.user?.id) return;
        welcomeSent = true;
        await new Promise(r => setTimeout(r, 2000));

        // AUTO DETECT ALL
        const username = conn.user?.name || conn.user?.id?.split('@')[0] || "User";
        const platform = getHost();
        
        const now = new Date();
        const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Nairobi' });
        const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Nairobi' });

        const text = `┌──『 BREAKER-ULTRA MD 』──
│ » Username: ${username}
│ » Owner: Matsken
│ » Platform: ${platform}
│ » Prefix: [ . ]
│ » Mode: public
│ » Version: 2.7.0
│ » Date & Time: ${date} ${time} EAT
│ » https://whatsapp.com/channel/0029VbDoFXD8qIzjg285xu2h
│ » https://t.me/Matsken1
│ » https://github.com/matsken256-boop
└-------------------
Type *.menu* to see all commands`;

        try { await conn.sendMessage(conn.user.id, { text }); } catch {}
        return;
    }

    // Forward to message.js
    try {
        const path = require('path');
        const fs = require('fs');
        const p = path.join(__dirname, '../Events/message.js');
        if (fs.existsSync(p)) {
            delete require.cache[require.resolve(p)];
            await require(p)(conn, m, store);
        }
    } catch {}
};