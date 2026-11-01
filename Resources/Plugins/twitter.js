const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .twitter <twitter link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/twitter?link=${args[0]}`)
    await sock.sendMessage(from,{video:{url:data.result.HD},caption:"✅ Twitter DL"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid link"}, {quoted:msg}) }
}