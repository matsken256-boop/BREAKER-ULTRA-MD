const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '..', 'Sessions', 'auth.json');

function initAuth() {
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(dbFile)) {
        fs.writeFileSync(dbFile, '{}');
    }
}

function getAuth(category, id) {
    initAuth();
    const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    return data[`${category}_${id}`] || null;
}

function setAuth(category, id, value) {
    initAuth();
    const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    data[`${category}_${id}`] = value;
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

module.exports = { initAuth, getAuth, setAuth };