const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .ytmp4 <youtube link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/youtube?link=${args[0]}`)
    await sock.sendMessage(from,{video:{url:data.mp4},caption:"✅ YTMP4 by BREAKER-ULTRA"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid YT link"}, {quoted:msg}) }
}