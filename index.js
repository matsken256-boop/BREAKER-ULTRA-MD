const {default default: makeWASocket, defaultuseMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');

const pino = require('pino');

let sock;

async function startBot(){

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const s = makeWASocket({

    auth: {

      creds: state.creds,

      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),

    },

    logger: pino({ level: "silent" }),

    printQRInTerminal: false,

    browser: ["BREAKER-ULTRA-MD", "Chrome", "1.0.0"],
