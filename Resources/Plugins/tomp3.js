module.exports = async (sock, msg, args, from) => {
  if(!msg.message.extendedTextMessage && !msg.message.videoMessage) return await sock.sendMessage(from,{text:"❌ Reply to a video with .tomp3"}, {quoted:msg})
  try{
    const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage ? msg : msg)
    await sock.sendMessage(from,{audio:buffer,mimetype:'audio/mp4'}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ Error: "+e.message},{quoted:msg}) }
}