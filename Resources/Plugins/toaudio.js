module.exports = async (sock, msg, from) => {
  const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
  if(!quoted) return await sock.sendMessage(from,{text:"❌ Reply to video to convert to audio"}, {quoted:msg})
  try{
    const buffer = await sock.downloadMediaMessage({message:quoted})
    await sock.sendMessage(from,{audio:buffer,mimetype:'audio/mpeg'}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message},{quoted:msg}) }
}