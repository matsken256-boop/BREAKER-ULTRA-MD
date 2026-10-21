const axios = require('axios');
const config = require('../config.js');

async function meganAI(endpoint, prompt) {
  const key = config.apikeys.megan;
  const base = config.apis.megan;
  
  // endpoint can be gpt, gemini, deepseek, etc
  const url = `${base}/api/${endpoint}?prompt=${encodeURIComponent(prompt)}&key=${key}`;

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    return data.result || data.data || data.answer || data.response || JSON.stringify(data);
  } catch (e) {
    // Fallback 1: direct ai
    try {
      const fallback = await axios.get(`${base}/api/ai`, {
        params: { prompt: prompt, key: key },
        timeout: 10000
      });
      return fallback.data.result || fallback.data.response;
    } catch (e2) {
      // Fallback 2: zenith free
      try {
        const zenith = await axios.get(`https://api.zenith.org/api/ai?text=${encodeURIComponent(prompt)}`);
        return zenith.data.result || zenith.data.response;
      } catch (e3) {
        return `❌ AI Error: ${e.message}. Try again later.`;
      }
    }
  }
}

async function renzAI(endpoint, prompt) {
  return await meganAI(endpoint, prompt);
}

module.exports = { meganAI, renzAI, meganAI: meganAI };