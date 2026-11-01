const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .itunes <song name>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/search/itunes?query=${args.join(' ')}`)
    let r = data.result[0]
    await sock.sendMessage(from,{image:{url:r.artworkUrl100},caption:`🎵 ${r.trackName}\n👤 ${r.artistName}\n🔗 ${r.trackViewUrl}`}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Not found"}, {quoted:msg}) }
}