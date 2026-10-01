const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const settings = require('../../settings');

router.get('/pair', async (req,res)=>{
  const sessionDir = path.join(__dirname,'..','Sessions','breaker');
  if(!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir,{recursive:true});
  if(fs.existsSync(path.join(sessionDir,'creds.json'))) return res.json({error: settings.mess.sessionLimit});
  if((req.query.password||'') !== (process.env.MASTER_PASSWORD||settings.MASTER_PASSWORD||'')) return res.json({error:'Wrong MASTER_PASSWORD'});
  let num=(req.query.number||'').replace(/[^0-9]/g,'');
  if(!num) return res.json({error:'Enter number'});
  try{
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({version, logger:pino({level:'silent'}), auth:state, browser:[settings.botName,'Chrome',settings.botVersion]});
    sock.ev.on('creds.update', saveCreds);
    await delay(1200);
    const code = await sock.requestPairingCode(num);
    res.json({code});
  }catch(e){ res.json({error:e.message}); }
});

module.exports = router;
