const axios = require('axios');
let config = {}
try { config = require('../config.js') } catch { config = {} }

const API_KEY = config.apikeys?.megan || process.env.MEGAN_KEY || global.MEGAN_APIKEY || "megan_fc148d34fe9b3a2";
const API_BASE = config.apis?.megan || process.env.MEGAN_BASE || global.MEGAN_BASE || "https://megan-api.vercel.app";

async function meganAI(endpoint, prompt) {
  // endpoint param is ignored now - all go to /api/ai
  // Keep param for compatibility with old code
  
  const cleanPrompt = typeof prompt === 'string' ? prompt : String(prompt);

  // 1. Try global MEGAN_AI first (fastest)
  if (typeof global.MEGAN_AI === 'function') {
    try {
      const result = await global.MEGAN_AI(cleanPrompt);
      if (result) return result;
    } catch {}
  }

  // 2. Try your main API - CORRECT ENDPOINT IS /api/ai
  try {
    const { data } = await axios.get(`${API_BASE}/api/ai`, {
      params: { 
        prompt: cleanPrompt, 
        text: cleanPrompt, 
        key: API_KEY,
        q: cleanPrompt
      },
      timeout: 20000
    });
    const answer = data.result || data.data || data.answer || data.response || data.output;
    if (answer) return answer;
  } catch (e) {
    console.log(`[MEGAN /api/ai failed] ${e.message}`);
  }

  // 3. Fallback: zenith free
  try {
    const zenith = await axios.get(`https://api.zenith.org/api/ai?text=${encodeURIComponent(cleanPrompt)}`, { timeout: 15000 });
    if (zenith.data?.result) return zenith.data.result;
  } catch {}

  return `❌ AI failed for endpoint ${endpoint}. Please try again.`;
}

// Alias for backward compatibility
async function renzAI(endpoint, prompt) {
  return await meganAI(endpoint, prompt);
}

module.exports = { meganAI, renzAI };
global.MEGAN_AI_HELPER = meganAI;
