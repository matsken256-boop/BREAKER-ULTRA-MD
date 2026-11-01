const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ Usage: .tiktok <tiktok link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://tikwm.com/api/?url=${args[0]}`)
    await sock.sendMessage(from,{video:{url:data.data.play},caption:"✅ TikTok by BREAKER-ULTRA"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid TikTok link"}, {quoted:msg}) }
}