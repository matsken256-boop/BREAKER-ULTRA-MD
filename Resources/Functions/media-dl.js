const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');

async function downloadMedia(url, ext = 'mp4') {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
        const fileName = `${Date.now()}.${ext}`;
        const filePath = path.join(tmpdir(), fileName);
        fs.writeFileSync(filePath, res.data);
        return filePath;
    } catch (e) {
        console.log('Media DL error:', e.message);
        return null;
    }
}

async function getBuffer(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', headers: { 'User-Agent': 'BREAKER-ULTRA-MD' } });
        return Buffer.from(res.data);
    } catch {
        return null;
    }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(2) + ' KB';
    return (bytes/(1024*1024)).toFixed(2) + ' MB';
}

module.exports = { downloadMedia, getBuffer, formatSize };