const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.json');

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: {}, groups: {}, settings: {} }, null, 2));
}

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(dbPath));
    } catch {
        return { users: {}, groups: {}, settings: {} };
    }
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getUser(jid) {
    const db = loadDB();
    if (!db.users[jid]) {
        db.users[jid] = {
            afk: false,
            afkReason: '',
            banned: false,
            warnings: 0,
            premium: false,
            lastSeen: Date.now()
        };
        saveDB(db);
    }
    return db.users[jid];
}

function getGroup(jid) {
    const db = loadDB();
    if (!db.groups[jid]) {
        db.groups[jid] = {
            antilink: false,
            antibadword: false,
            antisticker: false,
            antidelete: false,
            welcome: false,
            goodbye: false,
            nsfw: false,
            muted: false
        };
        saveDB(db);
    }
    return db.groups[jid];
}

function updateUser(jid, data) {
    const db = loadDB();
    if (!db.users[jid]) db.users[jid] = {};
    db.users[jid] = {...db.users[jid],...data };
    saveDB(db);
}

function updateGroup(jid, data) {
    const db = loadDB();
    if (!db.groups[jid]) db.groups[jid] = {};
    db.groups[jid] = {...db.groups[jid],...data };
    saveDB(db);
}

module.exports = {
    loadDB,
    saveDB,
    getUser,
    getGroup,
    updateUser,
    updateGroup,
    dbPath
};