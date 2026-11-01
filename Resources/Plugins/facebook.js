const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .facebook <fb link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/fbdl?link=${args[0]}`)
    await sock.sendMessage(from,{video:{url:data.result.HD},caption:"✅ FB Video"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Error"}, {quoted:msg}) }
}