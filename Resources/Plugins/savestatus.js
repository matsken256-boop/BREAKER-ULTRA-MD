module.exports = async (sock, msg, args, from) => {
  const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
  if(!quoted) return await sock.sendMessage(from,{text:"❌ Reply to a status with .savestatus"}, {quoted:msg})
  try{
    let buffer = await sock.downloadMediaMessage({message:quoted})
    let type = Object.keys(quoted)[0].replace('Message','')
    await sock.sendMessage(from,{[type]:buffer,caption:"✅ Status saved"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message},{quoted:msg}) }
}