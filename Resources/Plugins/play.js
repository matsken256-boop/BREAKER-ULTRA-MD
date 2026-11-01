const axios = require('axios')

module.exports = async (sock, msg, args, from, {pushName}) => {
  if(!args[0]) return await sock.sendMessage(from,{text:"❌ Usage: *.play <song name>*\n\nEx: .play calm down\n.play alan walker faded"}, {quoted:msg})

  let query = args.join(' ')
  try{
    await sock.sendMessage(from,{text:`🎧 *Searching...* \n🔍 Query: ${query}\n👤 For: ${pushName}`}, {quoted:msg})

    // Search YouTube then download
    let search = await axios.get(`https://api.akuari.my.id/search/youtube?query=${encodeURIComponent(query)}`)
    let video = search.data.result[0]
    if(!video) throw new Error("No results")

    let dl = await axios.get(`https://api.akuari.my.id/downloader/youtube?link=${video.link}`)

    // Send thumbnail + info
    await sock.sendMessage(from,{
      image:{url:video.thumbnail},
      caption:`┌─ ◇ PLAY ◇
│ 🎵 Title: ${video.title}
│ ⏱️ Duration: ${video.duration}
│ 👀 Views: ${video.views}
│ 🔗 Link: ${video.link}
│ 👤 Requested by: ${pushName}
└─
⏳ *Downloading audio...*`
    }, {quoted:msg})

    // Send audio
    await sock.sendMessage(from,{
      audio:{url:dl.data.mp3},
      mimetype:'audio/mpeg',
      fileName: video.title+'.mp3',
      ptt:false
    }, {quoted:msg})

    // Optional: also send video button
    await sock.sendMessage(from,{text:`✅ Done! Want video? Type *.ytmp4 ${video.link}*`}, {quoted:msg})

  }catch(e){
    console.log(e)
    await sock.sendMessage(from,{text:`❌ Error for "${query}": ${e.message}\nTry: .song ${query} or .ytmp3 <link>`}, {quoted:msg})
  }
}