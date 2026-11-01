const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .image <query>\nEx: .image cat"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/search/gimage?query=${args.join(' ')}`)
    await sock.sendMessage(from,{image:{url:data.result[0]},caption:`✅ ${args.join(' ')}`}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ No image"}, {quoted:msg}) }
}