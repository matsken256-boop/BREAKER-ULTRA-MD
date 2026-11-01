const axios = require('axios')
module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ Usage: .apk <app name>\nEx: .apk whatsapp"}, {quoted:msg})
  try{
    await sock.sendMessage(from,{text:"⏳ Searching APK..."}, {quoted:msg})
    let res = await axios.get(`https://api.akuari.my.id/downloader/apk?query=${args.join(' ')}`)
    let data = res.data
    await sock.sendMessage(from,{document:{url:data.result.download},mimetype:'application/vnd.android.package-archive',fileName:data.result.name+'.apk',caption:`✅ ${data.result.name}`}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ APK not found"}, {quoted:msg}) }
}