module.exports = async (sock, msg, args, from) => {
  const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
  if(!quoted) return await sock.sendMessage(from,{text:"❌ Reply to image/video"}, {quoted:msg})
  try{
    const buffer = await sock.downloadMediaMessage({message:quoted})
    let type = Object.keys(quoted)[0].replace('Message','')
    await sock.sendMessage(from,{[type]:buffer,viewOnce:true}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message},{quoted:msg}) }
}