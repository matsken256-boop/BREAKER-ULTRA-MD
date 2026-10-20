const fs = require('fs')
const path = require('path')
const os = require('os')
const moment = require('moment-timezone')

let welcomeSent = false

// SAFE RESOURCE LOADER - DOES NOT BLOCK PAIRING
try {
  const possibleRes = path.join(__dirname, '..', 'resources')
  if (fs.existsSync(possibleRes)) {
    fs.readdirSync(possibleRes).forEach(file => {
      if (file.endsWith('.js')) {
        try {
          const full = path.join(possibleRes, file)
          const mod = require(full)
          if (mod && typeof mod === 'object') {
            Object.keys(mod).forEach(k => {
              if (!global[k]) global[k] = mod[k]
            })
          }
        } catch {}
      }
    })
  }
  
  // Also check if resources is a single file that exports everything
  const resFile = path.join(__dirname, '..', 'resources.js')
  if (fs.existsSync(resFile)) {
    try {
      const mod = require(resFile)
      if (mod && typeof mod === 'object') {
        Object.keys(mod).forEach(k => {
          if (!global[k]) global[k] = mod[k]
        })
      }
    } catch {}
  }
} catch (e) {
  // NEVER CRASH - just log
  console.log("Resource loader skipped:", e.message)
}