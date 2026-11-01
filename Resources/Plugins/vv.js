const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (sock, msg, args, from) => {
  try{
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if(!quoted){
      return await sock.sendMessage(from,{text:"Reply to viewonce with .vv"}, {quoted:msg})
    }
    let m = quoted
    if(m.viewOnceMessage) m = m.viewOnceMessage.message
    if(m.viewOnceMessageV2) m = m.viewOnceMessageV2.message
    
    const type = Object.keys(m)[0]
    const stream = await downloadContentFromMessage(m[type], type.replace('Message',''))
    let buffer = Buffer.from([])
    for await (const chunk of stream){
      buffer = Buffer.concat([buffer, chunk])
    }
    
    if(type.includes('image')){
      await sock.sendMessage(from,{image: buffer, caption: "ViewOnce opened ✅"}, {quoted:msg})
    }else{
      await sock.sendMessage(from,{video: buffer}, {quoted:msg})
    }
  }catch(e){
    await sock.sendMessage(from,{text: "Error: " + e.message}, {quoted:msg})
  }
}