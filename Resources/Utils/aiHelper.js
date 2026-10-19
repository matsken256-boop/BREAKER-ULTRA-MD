const axios = require('axios');
const config = require('./config.js');

async function renzAI(endpoint, prompt) {
    const key = config.apikeys.renz;
    const url = `${config.apis.renz}/api/ai/${endpoint}?prompt=${encodeURIComponent(prompt)}&apikey=${key}`;
    try {
        const { data } = await axios.get(url);
        return data.result || data.data || data.answer || JSON.stringify(data);
    } catch (e) {
        return "❌ AI Error: " + (e.response?.data?.msg || e.message);
    }
}

module.exports = { renzAI };