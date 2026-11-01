const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .tik-image <tiktok photo link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://tikwm.com/api/?url=${args[0]}`)
    for(let img of data.data.images){
      await sock.sendMessage(from,{image:{url:img}}, {quoted:msg})
    }
  }catch(e){ await sock.sendMessage(from,{text:"❌ Error"}, {quoted:msg}) }
}