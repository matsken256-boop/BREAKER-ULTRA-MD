const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ Usage: .fbaudio <fb link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/fbdl?link=${args[0]}`)
    await sock.sendMessage(from,{audio:{url:data.result.SD},mimetype:'audio/mpeg'}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Error"}, {quoted:msg}) }
}