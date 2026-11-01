const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ .gdrive <gdrive link>"}, {quoted:msg})
  try{
    let {data} = await axios.get(`https://api.akuari.my.id/downloader/gdrive?link=${args[0]}`)
    await sock.sendMessage(from,{document:{url:data.result.download},fileName:data.result.fileName,mimetype:data.result.mimetype}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid GDrive link"}, {quoted:msg}) }
}