const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

async function startBot(phoneNumberArg, sessionIdArg) {
  const phoneNumber = phoneNumberArg || process.env.PHONE_NUMBER || ''
  const sessionId = sessionIdArg || process.env.SESSION_ID || 'breaker'

  const ROOT = path.join(__dirname, '..', '..')
  const SESSION_DIR = path.join(ROOT, 'Sessions', sessionId)
  const PAIR_FILE = path.join(ROOT, `pair_${sessionId}.txt`)

  let MAINS_PATH = path.join(__dirname, '..', 'Functions', 'mains.js')
  if (!fs.existsSync(MAINS_PATH)) MAINS_PATH = path.join(__dirname, '..', 'functions', 'mains.js')

  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  let version = [2, 3000, 1015901307]
  try {
    const v = await fetchLatestBaileysVersion()
    if (v?.version) version = v.version
  } catch {}

  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
  })

  sock.ev.on('creds.update', saveCreds)

  let mainsHandler = null
  const loadMains = () => {
    try {
      if (fs.existsSync(MAINS_PATH)) {
        delete require.cache[require.resolve(MAINS_PATH)]
        mainsHandler = require(MAINS_PATH)
        return true
      }