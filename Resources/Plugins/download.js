const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .download <any link>"}, {quoted:msg})
  try{
    let url = args[0]
    if(url.includes('tiktok')) return require('./tiktok')(sock,msg,args,from)
    if(url.includes('facebook') || url.includes('fb.watch')) return require('./facebook')(sock,msg,args,from)
    if(url.includes('youtu')) return require('./ytmp4')(sock,msg,args,from)
    await sock.sendMessage(from,{text:"✅ Link detected, use specific command:\n.tiktok, .facebook, .ytmp4, .instagram"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message},{quoted:msg}) }
}