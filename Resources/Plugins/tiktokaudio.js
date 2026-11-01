const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .tiktokaudio <tiktok link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://tikwm.com/api/?url=${args[0]}`)
    await sock.sendMessage(from,{audio:{url:data.data.music},mimetype:'audio/mpeg'}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Error"}, {quoted:msg}) }
}