const yts = require('yt-search')
const ytdl = require('@distube/ytdl-core')

module.exports = async (sock, msg, args, from) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ Use: .play njagala sente master parrot"}, {quoted:msg})
  const query = args.join(' ')
  try{
    // Search YouTube
    const search = await yts(query)
    const video = search.videos[0]
    if(!video) return await sock.sendMessage(from,{text:"❌ Not found on YouTube"}, {quoted:msg})

    await sock.sendMessage(from,{text:`🔍 *YouTube Search:* ${query}\nFound: ${video.title}`}, {quoted:msg})

    const info = await ytdl.getInfo(video.url)
    const audio = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })

    // SEND AUDIO LIKE SCREENSHOT BUT WITH YOUTUBE INFO (externalAdReply)
    await sock.sendMessage(from,{
      audio: { url: audio.url },
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`,
      contextInfo: {
        externalAdReply: {
          title: video.title,
          body: `YouTube • ${video.timestamp} • ${video.views} views`,
          thumbnailUrl: video.thumbnail,
          sourceUrl: video.url,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, {quoted:msg})

  }catch(e){
    console.log(e)
    await sock.sendMessage(from,{text:`❌ Error: ${e.message}`}, {quoted:msg})
  }
}