module.exports = async (sock, msg, args, from) => {
  const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
  if(!quoted?.stickerMessage) return await sock.sendMessage(from,{text:"❌ Reply to sticker with .tovideo"}, {quoted:msg})
  try{
    const buffer = await sock.downloadMediaMessage({message:quoted})
    await sock.sendMessage(from,{video:buffer,caption:"✅ Converted to video"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message},{quoted:msg}) }
}