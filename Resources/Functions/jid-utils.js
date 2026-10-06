function decodeJid(jid) {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = jid.split('@')[0].split(':')[0] + '@' + jid.split('@')[1];
        return decode;
    } else return jid;
}

function getPhoneNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].replace(/[^0-9]/g, '');
}

function isGroup(jid) {
    return jid.endsWith('@g.us');
}

function isPrivate(jid) {
    return jid.endsWith('@s.whatsapp.net');
}

function areJidsSameUser(jid1, jid2) {
    return decodeJid(jid1) === decodeJid(jid2);
}

module.exports = {
    decodeJid,
    getPhoneNumber,
    isGroup,
    isPrivate,
    areJidsSameUser
};