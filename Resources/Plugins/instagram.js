const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .instagram <ig link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/igdl?link=${args[0]}`)
    await sock.sendMessage(from,{video:{url:data.result[0].url},caption:"✅ IG by BREAKER-ULTRA"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid IG link"}, {quoted:msg}) }
}