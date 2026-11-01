module.exports = async (sock, msg, args, from) => {
  try {
    // Get quoted message (the normal photo/video you want to turn to ViewOnce)
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const quotedMessage = contextInfo?.quotedMessage
    
    if (!quotedMessage) {
      return await sock.sendMessage(from, { 
        text: "❌ *Reply to a Photo/Video!*\n\nExample:\n1. Send a photo\n2. Reply to it with *.toviewonce*" 
      }, { quoted: msg })
    }

    const quotedType = Object.keys(quotedMessage)[0]
    
    // Check if it's image or video
    if (quotedType === 'imageMessage') {
      const imageMessage = quotedMessage.imageMessage
      
      // Download image
      await sock.sendMessage(from, { text: "🔄 Converting to ViewOnce..." }, { quoted: msg })
      
      await sock.sendMessage(from, {
        image: imageMessage,
        caption: imageMessage.caption || "",
        viewOnce: true
      }, { quoted: msg })

    } else if (quotedType === 'videoMessage') {
      const videoMessage = quotedMessage.videoMessage
      
      await sock.sendMessage(from, { text: "🔄 Converting to ViewOnce..." }, { quoted: msg })
      
      await sock.sendMessage(from, {
        video: videoMessage,
        caption: videoMessage.caption || "",
        viewOnce: true
      }, { quoted: msg })

    } else {
      return await sock.sendMessage(from, { 
        text: "❌ Only Photo/Video can be converted to ViewOnce!" 
      }, { quoted: msg })
    }

  } catch (e) {
    console.log("toviewonce error:", e.message)
    await sock.sendMessage(from, { 
      text: `❌ Error: ${e.message}` 
    }, { quoted: msg })
  }
}