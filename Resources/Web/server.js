const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const settings = require('../../settings');

router.get('/pair', async (req,res)=>{
  // Fixed session path - same as Socket
  const baseSessionDir = path.join(__dirname, '..', 'Sessions');
  if(!fs.existsSync(baseSessionDir)) fs.mkdirSync(baseSessionDir,{recursive:true});
  
  // Use breaker folder or first folder - keep consistent
  const sessionDir = path.join(baseSessionDir, 'breaker');
  if(!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir,{recursive:true});

  // Optional password check - remove if you want open pairing
  if(settings.MASTER_PASSWORD){
    if((req.query.password||'') !== (process.env.MASTER_PASSWORD||settings.MASTER_PASSWORD||'')){
      // If you want open pairing, comment next line
      // return res.json({error:'Wrong MASTER_PASSWORD'});
    }
  }

  let num=(req.query.number||'').replace(/[^0-9]/g,'');
  if(!num) return res.json({error:'Enter number'});

  try{
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version, 
      logger:pino({level:'silent'}), 
      auth:state, 
      browser:['BREAKER-ULTRA-MD','Chrome','2.7.0']
    });

    sock.ev.on('creds.update', saveCreds);
    await delay(1200);
    const code = await sock.requestPairingCode(num);
    res.json({code, message:'┌─⊷ ◇ BREAKER PAIRED ◇\n│ ✅ Use code in WhatsApp\n└─⊷'});
  }catch(e){ 
    res.json({error:e.message}); 
  }
});

router.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = router;