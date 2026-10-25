const axios = require('axios');
let config = {}
try { config = require('./config.js') } catch { try { config = require('../config.js') } catch { config = {} } }

const API_KEY = config.apikeys?.megan || process.env.MEGAN_KEY || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
const API_BASE = config.apis?.megan || process.env.MEGAN_BASE || global.MEGAN_BASE || "https://megan-api.vercel.app";

async function meganAI(endpoint, prompt) {
  const cleanPrompt = typeof prompt === 'string' ? prompt : String(prompt);
  if (typeof global.MEGAN_AI === 'function') {
    try { const r = await global.MEGAN_AI(cleanPrompt); if (r) return r } catch {}
  }
  try {
    const { data } = await axios.get(`${API_BASE}/api/ai`, {
      params: { prompt: cleanPrompt, text: cleanPrompt, key: API_KEY, q: cleanPrompt },
      timeout: 20000
    });
    const answer = data.result || data.data || data.answer || data.response || data.output;
    if (answer) return answer;
  } catch (e) { console.log(`[MEGAN /api/ai failed] ${e.message}`) }
  try {
    const zenith = await axios.get(`https://api.zenith.org/api/ai?text=${encodeURIComponent(cleanPrompt)}`, { timeout: 15000 });
    if (zenith.data?.result) return zenith.data.result;
  } catch {}
  return `❌ AI failed for endpoint ${endpoint}. Please try again.`;
}

async function renzAI(endpoint, prompt) { return await meganAI(endpoint, prompt) }

module.exports = { meganAI, renzAI };