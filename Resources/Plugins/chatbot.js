const axios = require('axios');
const fs = require('fs');
const path = require('path');

let config = {}
try { config = require('../../config.js') } catch { try { config = require('../../Config.js') } catch { config = {} } }

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

// CORE AI FUNCTION - FAST
async function getAIResponse(prompt, m) {
  try {
    // 1. Try your main MEGAN_AI first
    if (typeof global.MEGAN_AI === 'function') {
      const res = await global.MEGAN_AI(prompt);
      if (res) return res;
    }

    // 2. Fallback API
    const apikey = config.apikeys?.megan || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
    const apiBase = config.apis?.megan || global.MEGAN_BASE || "https://megan-api.vercel.app";
    
    const { data } = await axios.get(`${apiBase}/api/ai`, {
      params: { q: prompt, apikey },
      timeout: 15000
    });

    return data?.result || data?.answer || data?.response || null;

  } catch (e) {
    console.log("AI Error:", e.message);
    return null;
  }
}

module.exports = {
  command: ["chatbot", "autochat", "aichat", "bot"],

  // For command .chatbot on/off
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const cmd = args[0]?.toLowerCase();
    const sender = m.key.participant || m.key.remoteJid;

    // Prevent bot replying to itself
    if (m.key.fromMe) return;

    if (cmd === 'on') {
      isChatbotOn = true;
      saveState();
      return await sock.sendMessage(jid, { text: "┌─⊷ ◇ CHATBOT ◇\n│ ✅ Auto-Chatbot is now ON\n│ Bot will reply to every message without prefix\n│ Send .chatbot off to disable\n└─⊷\n\n🌟 BREAKER v2.7.0" }, { quoted: m });
    }

    if (cmd === 'off') {
      isChatbotOn = false;
      saveState();
      return await sock.sendMessage(jid, { text: "┌─⊷ ◇ CHATBOT ◇\n│ ❌ Auto-Chatbot is now OFF\n└─⊷\n\n🌟 BREAKER v2.7.0" }, { quoted: m });
    }

    if (!args[0]) {
      return await sock.sendMessage(jid, { text: `┌─⊷ ◇ CHATBOT ◇\n│ Current: ${isChatbotOn ? 'ON ✅' : 'OFF ❌'}\n│\n│ ➳ .chatbot on - enable\n│ ➳ .chatbot off - disable\n│ ➳ .chatbot hi - chat once\n└─⊷` }, { quoted: m });
    }

    // Single chat
    const prompt = args.join(' ');
    await sock.sendPresenceUpdate('composing', jid);
    const answer = await getAIResponse(prompt, m);
    if (answer) {
      await sock.sendMessage(jid, { text: answer }, { quoted: m });
    } else {
      await sock.sendMessage(jid, { text: "❌ AI is busy, try again." }, { quoted: m });
    }
  },

  // THIS IS THE MISSING PART - Auto reply for every message
  // Call this from your main index.js / message handler
  auto: async (sock, m) => {
    try {
      if (!isChatbotOn) return false;
      if (m.key.fromMe) return false;
      if (!m.message) return false;
      
      const jid = m.key.remoteJid;
      const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
      
      // Don't reply to commands (starting with . ! etc)
      if (/^[.!\/]/.test(text)) return false;
      // Don't reply to empty / media
      if (!text || text.length < 2) return false;

      // Don't reply in groups unless bot is tagged? (optional)
      // if (jid.endsWith('@g.us')) return false;

      await sock.sendPresenceUpdate('composing', jid);
      const answer = await getAIResponse(text, m);
      
      if (answer) {
        // Small delay to look natural but not slow
        await new Promise(r => setTimeout(r, 800));
        await sock.sendMessage(jid, { text: answer }, { quoted: m });
        return true;
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
};