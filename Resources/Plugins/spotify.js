const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .spotify <spotify link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/spotify?link=${args[0]}`)
    await sock.sendMessage(from,{audio:{url:data.result.download},mimetype:'audio/mpeg',fileName:data.result.title+'.mp3'}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid Spotify link"}, {quoted:msg}) }
}