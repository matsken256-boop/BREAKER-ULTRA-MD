const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .song <song name>\nEx: .song calm down"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/youtube?link=https://www.youtube.com/results?search_query=${args.join('+')}`)
    await sock.sendMessage(from,{audio:{url:data.mp3},mimetype:'audio/mpeg',fileName:args.join(' ')+'.mp3'}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Not found"}, {quoted:msg}) }
}