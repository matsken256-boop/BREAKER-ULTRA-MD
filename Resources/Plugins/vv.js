module.exports = async (sock, msg, from) => {
  const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
  if(!quoted?.viewOnceMessageV2 && !quoted?.viewOnceMessage) return await sock.sendMessage(from,{text:"❌ Reply to ViewOnce"}, {quoted:msg})
  try{
    let m = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message
    let type = Object.keys(m)[0]
    let buffer = await sock.downloadMediaMessage({message:m})
    await sock.sendMessage(from,{[type.replace('Message','')]:buffer,caption:"✅ ViewOnce Bypassed"}, {quoted:msg})
  }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message},{quoted:msg}) }
}