const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .xxxvideo <xvideos link>"}, {quoted:msg})
  try{
    await sock.sendMessage(from,{text:"⏳ Downloading..."}, {quoted:msg})
    // Add your xvideos API
    await sock.sendMessage(from,{text:"✅ Add xvideos API in Plugins/xxxvideo.js"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Error"}, {quoted:msg}) }
}