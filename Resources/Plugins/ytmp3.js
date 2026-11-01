const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .ytmp3 <youtube link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/youtube?link=${args[0]}`)
    await sock.sendMessage(from,{audio:{url:data.mp3},mimetype:'audio/mpeg'}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Error"}, {quoted:msg}) }
}