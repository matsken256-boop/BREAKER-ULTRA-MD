const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = async (sock, msg, args, from) => {
  try{
    // Must reply to an image/video
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    
    if(!quoted){
      return await sock.sendMessage(from, {
        text: "❌ *How to use .toviewonce:*\n\n1. Send any photo/video OR reply to it\n2. Type .toviewonce\n\nIt will convert to ViewOnce!"
      }, { quoted: msg })
    }

    await sock.sendMessage(from, { text: "⏳ Converting to ViewOnce..." }, { quoted: msg })

    // Get type
    const type = Object.keys(quoted)[0]
    let buffer
    let isVideo = false
    let caption = ""

    // Download the quoted media
    const quotedMsg = {
      key: msg.message.extendedTextMessage.contextInfo.stanzaId ? { id: msg.message.extendedTextMessage.contextInfo.stanzaId } : msg.key,
      message: quoted
    }

    // Try to download
    try{
      buffer = await downloadMediaMessage(
        { message: quoted },
        'buffer',
        {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      )
    }catch{
      // Fallback method
      const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
      const stream = await downloadContentFromMessage(quoted[type], type.replace('Message',''))
      let buf = Buffer.from([])
      for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
      buffer = buf
    }

    if(quoted[type]?.caption) caption = quoted[type].caption
    if(type.includes('video')) isVideo = true

    if(!buffer){
      return await sock.sendMessage(from, { text: "❌ Failed to download media" }, { quoted: msg })
    }

    // Send as ViewOnce
    if(isVideo){
      await sock.sendMessage(from, {
        video: buffer,
        caption: caption,
        viewOnce: true
      }, { quoted: msg })
    }else{
      await sock.sendMessage(from, {
        image: buffer,
        caption: caption,
        viewOnce: true
      }, { quoted: msg })
    }

    await sock.sendMessage(from, { text: "✅ Sent as ViewOnce!" }, { quoted: msg })

  }catch(e){
    console.log("TOVIEWONCE ERROR:", e)
    await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: msg })
  }
}