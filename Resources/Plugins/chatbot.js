const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Fix case sensitivity - try both
let config = {}
try { config = require('../../config.js') } catch { try { config = require('../../Config.js') } catch { config = {} } }

// Save ON/OFF state to file so it survives restart
const stateFile = path.join(__dirname, '../../session/chatbot_state.json');
let isChatbotOn = false;

try {
  if (fs.existsSync(stateFile)) {
    const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    isChatbotOn = data.isOn || false;
  }
} catch {}

function saveState() {
  try {
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify({ isOn: isChatbotOn }));
  } catch {}
}

module.exports = {
  command: ["chatbot", "autochat", "aichat"],
  
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'on') {
      isChatbotOn = true;
      saveState();
      return await sock.sendMessage(jid, { text: "┌─⊷ ◇ CHATBOT ◇\n│ ✅ Auto-Chatbot is now ON\n│ Bot will reply to every message without prefix\n│ Send .chatbot off to disable\n└─⊷\n\n🌟 BREAKER v2.7.0" }, { quoted: m });
    }
    
    if (cmd === 'off') {
      isChatbotOn = false;
      saveState();
      return await sock.sendMessage(jid, { text: "┌─⊷ ◇ CHATBOT ◇\n│ ❌ Auto-Chatbot is now OFF\n│ Bot will only reply to commands\n└─⊷\n\n🌟 BREAKER v2.7.0" }, { quoted: m });
    }
    
    if (!args[0]) {
      return await sock.sendMessage(jid, { text: `┌─⊷ ◇ CHATBOT ◇\n│ Current: ${isChatbotOn ? 'ON ✅' : 'OFF ❌'}\n│\n│ Usage:\n│ ➳ .chatbot on - enable auto-reply\n│ ➳ .chatbot off - disable\n│ ➳ .chatbot hello - chat once\n└─⊷` }, { quoted: m });
    }

    // Direct chat once
    try {
      const prompt = args.join(' ');
      await sock.sendPresenceUpdate('composing', jid);

      // Use global MEGAN_AI first (your main key)
      let answer = null;
      if (typeof global.MEGAN_AI === 'function') {
        answer = await global.MEGAN_AI(prompt);
      } else {
        const apikey = config.apikeys?.megan || config.apikeys?.megan || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
        const apiBase = config.apis?.megan || global.MEGAN_BASE || "https://megan-api.vercel.app";
        const { data } = await axios.get(`${apiBase}/api/ai`,
