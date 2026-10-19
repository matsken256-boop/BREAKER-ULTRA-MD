const axios = require('axios');
const config = require('../Resources/Utils/config.js');

module.exports = {
  execute: async (sock, m, args) => {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "┌─⊷ ◇ SUMMARISE ◇\n│ Usage:.summarise long text here\n└─⊷" }, { quoted: m });
    
    const textToSummarise = args.join(' ');
    const apikey = config.apikeys.renz;
    
    // Handle reply to message
    let finalText = textToSummarise;
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      finalText = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    }

    try {
     