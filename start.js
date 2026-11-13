const path = require('path')

const sessionId = process.argv[3] || process.env.SESSION_ID || 'breaker'
const phoneNumber = process.argv[2] || process.env.PHONE_NUMBER || ''

// Load the real connection file
require(path.join(__dirname, 'Resources', 'Socket', 'index.js'))(phoneNumber, sessionId)