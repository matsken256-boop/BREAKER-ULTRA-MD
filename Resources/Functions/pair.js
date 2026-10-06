const { makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function usePairingCode(conn, phoneNumber) {
    try {
        const code = await conn.requestPairingCode(phoneNumber);
        console.log(`\n[ BREAKER-ULTRA MD PAIRING ]\nYour Pair Code: ${code}\n`);
        return code;
    } catch (e) {
        console.log('Pairing error:', e.message);
        return null;
    }
}

function getMessagePairingStatus(m) {
    if (!m.message) return false;
    const type = Object.keys(m.message)[0];
    return type === 'protocolMessage' || type === 'senderKeyDistributionMessage';
}

module.exports = { usePairingCode, getMessagePairingStatus };