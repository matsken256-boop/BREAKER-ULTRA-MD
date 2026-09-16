// settings.js for BREAKER-ULTRA-MD
const fs = require('fs')

module.exports = {
  // Owner & Bot Info
  ownerNumber: ["2567XXXXXXX"], // <--- PUT YOUR NUMBER HERE e.g. 256785123456
  ownerName: "MATSKEN",
  botName: "BREAKER-ULTRA-MD",
  
  // Session & Prefix
  sessionName: "session",
  prefix: ".",
  
  // Pairing
  usePairingCode: true, // true for pairing code, false for QR
  
  // Presence
  autoRead: true,
  autoStatusView: true,
  autoTyping: false,
  autoRecording: false,
  alwaysOnline: true,

  // Message
  packName: "BREAKER-ULTRA",
  author: "By MATSKEN 256",
  
  // Do not edit below
  port: process.env.PORT || 3000
}
