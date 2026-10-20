const axios = require('axios');
const config = require('./config.js');

async function meganAI(endpoint, prompt) {
    const key = config.apikeys.megan; // megan_f6ef183d3b34ffee32a022e038f91847
    // endpoint can be gpt, teach, imagine, etc
    const url = `${config.apis.megan}/api/ai/${endpoint}?prompt=${encodeURIComponent(prompt)}&key=${key}`;
    try {
        const { data } = await axios.get(url);
        return data.result || data.data || data.answer || data.response || JSON.stringify(data);
    } catch (e) {
        // try fallback direct ai endpoint
        try {
            const fallback = await axios.get(`${config.apis.megan}/ai`, {
                params: { key: key, text: prompt, prompt: prompt }
            });
            return fallback.data.result || fallback.data.response;
        } catch(e2){
            return "❌ AI Error: " + (e.response?.data?.msg || e.message);
        }
    }
}

// Keep old name for compatibility with plugins that call renzAI
async function renzAI(endpoint, prompt) {
    return await meganAI(endpoint, prompt);
}

module.exports = { meganAI, renzAI, megan_f6ef183d3b34ffee32a022e038f91847: meganAI };