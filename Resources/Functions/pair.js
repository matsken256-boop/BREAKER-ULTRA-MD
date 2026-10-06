const PAIR_LOCK = {
    enabled: true,
    ownerOnly: true,
    password: process.env.PAIR_PASS || "BREAKER-ULTRA-MD",
    maxAttempts: 3,
    attempts: new Map(),
    codes: new Map()
};

function isLocked(jid) {
    if (!PAIR_LOCK.enabled) return false;
    const owner = (process.env.OWNER_NUMBER || "").replace(/[^0-9]/g, "");
    const user = jid.split('@')[0].replace(/[^0-9]/g, "");
    if (PAIR_LOCK.ownerOnly && owner &&!user.includes(owner)) {
        return { locked: true, reason: "PAIRING LOCKED: Only OWNER allowed!" };
    }
    const count = PAIR_LOCK.attempts.get(user) || 0;
    if (count >= PAIR_LOCK.maxAttempts) {
        return { locked: true, reason: "Too many attempts! Locked 1 hour." };
    }
    return { locked: false };
}

async function usePairingCode(conn, phoneNumber, providedPass = "") {
    try {
        const userJid = phoneNumber + '@s.whatsapp.net';
        const lockStatus = isLocked(userJid);
        if (lockStatus.locked) {
            return { success: false, message: lockStatus.reason };
        }
        if (PAIR_LOCK.password && providedPass!== PAIR_LOCK.password) {
            let attempts = PAIR_LOCK.attempts.get(phoneNumber) || 0;
            PAIR_LOCK.attempts.set(phoneNumber, attempts + 1);
            setTimeout(() => PAIR_LOCK.attempts.delete(phoneNumber), 60 * 60 * 1000);
            return { success: false, message: `WRONG PASSWORD! Left: ${PAIR_LOCK.maxAttempts - attempts - 1}` };
        }
        const code = await conn.requestPairingCode(phoneNumber);
        PAIR_LOCK.codes.set(phoneNumber, { code, expires: Date.now() + 120000 });
        PAIR_LOCK.attempts.set(phoneNumber, 0);
        setTimeout(() => PAIR_LOCK.codes.delete(phoneNumber), 2 * 60 * 1000);
        return { success: true, code: code, message: `Code: ${code} (2 min)` };
    } catch (e) {
        return { success: false, message: "Failed to generate code" };
    }
}

function getMessagePairingStatus(m) {
    if (!m.message) return false;
    const type = Object.keys(m.message)[0];
    return type === 'protocolMessage' || type === 'senderKeyDistributionMessage';
}

module.exports = { usePairingCode, getMessagePairingStatus, PAIR_LOCK };