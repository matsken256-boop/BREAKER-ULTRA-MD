module.exports = async (sock, msg, args, from) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted) return sock.sendMessage(from, { text: "❌ Reply to a ViewOnce!" }, { quoted: msg })

    let viewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension
    if (!viewOnce) viewOnce = quoted
    if (viewOnce?.message) viewOnce = viewOnce.message

    // Extract actual media
    const type = Object.keys(viewOnce)[0]
    const media = viewOnce[type]

    if (!media) return sock.sendMessage(from, { text: "❌ No ViewOnce found!" }, { quoted: msg })

    await sock.sendMessage(from, { text: "🔓 Converting ViewOnce..." }, { quoted: msg })

    // Send back as normal (not view once)
    if (type === 'imageMessage') {
      await sock.sendMessage(from, { image: media, caption: media.caption || "" }, { quoted: msg })
    } else if (type === 'videoMessage') {
      await sock.sendMessage(from, { video: media, caption: media.caption || "", viewOnce: false }, { quoted: msg })
    } else if (type === 'audioMessage') {
      await sock.sendMessage(from, { audio: media, mimetype: 'audio/mp4' }, { quoted: msg })
    } else {
      await sock.sendMessage(from, { text: "✅ ViewOnce opened!" }, { quoted: msg })
    }

  } catch (e) {
    await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: msg })
  }
}