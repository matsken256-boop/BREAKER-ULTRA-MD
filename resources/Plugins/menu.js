const fs = require('fs');
const path = require('path');

module.exports = {
  name: "menu",
  alias: ["allmenu", "help", "list"],
  category: "general",
  async run(client, m, { prefix, botname }) {
    try {
      const finalBotName = botname || "BREAKER-ULTRA-MD";
      const finalPrefix = prefix || ".";
      const logoPath = path.join(__dirname, '../logo.jpg');

let str = `
┏━━━〔 *${finalBotName}* 〕━━━┓
┃ Owner : Matsken
┃ Prefix : ${finalPrefix}
┃ Total : 137 Commands
┃ Menus : 6
┗━━━━━━━━━━━━━━━┛

┏▣ ◈ *AI MENU* ◈ - 10
│➽ ${finalPrefix}analyze
│➽ ${finalPrefix}deepseek
│➽ ${finalPrefix}explaincode
│➽ ${finalPrefix}gemini
│➽ ${finalPrefix}generate
│➽ ${finalPrefix}gpt
│➽ ${finalPrefix}translate2
│➽ ${finalPrefix}imagen
│➽ ${finalPrefix}teach
│➽ ${finalPrefix}convert
┗▣

┏▣ ◈ *DOWNLOAD MENU* ◈ - 22
│➽ ${finalPrefix}tomp3
│➽ ${finalPrefix}toaudio
│➽ ${finalPrefix}apk
│➽ ${finalPrefix}download
│➽ ${finalPrefix}facebook
│➽ ${finalPrefix}gdrive
│➽ ${finalPrefix}image
│➽ ${finalPrefix}instagram
│➽ ${finalPrefix}savestatus
│➽ ${finalPrefix}song
│➽ ${finalPrefix}play
│➽ ${finalPrefix}tiktok
│➽ ${finalPrefix}tiktokaudio
│➽ ${finalPrefix}twitter
│➽ ${finalPrefix}video
│➽ ${finalPrefix}xvideos
│➽ ${finalPrefix}ytmp3
│➽ ${finalPrefix}tovideo
│➽ ${finalPrefix}toimage
│➽ ${finalPrefix}toviewonce
│➽ ${finalPrefix}tourl
│➽ ${finalPrefix}tosticker
┗▣

┏▣ ◈ *GROUP MENU* ◈ - 33
│➽ ${finalPrefix}add
│➽ ${finalPrefix}allow
│➽ ${finalPrefix}antibadword
│➽ ${finalPrefix}antibot
│➽ ${finalPrefix}antidemote
│➽ ${finalPrefix}antipromote
│➽ ${finalPrefix}antigroumention
│➽ ${finalPrefix}antilink
│➽ ${finalPrefix}antilinkgc
│➽ ${finalPrefix}antitag
│➽ ${finalPrefix}antitagadmin
│➽ ${finalPrefix}aproveall
│➽ ${finalPrefix}delppgroup
│➽ ${finalPrefix}demote
│➽ ${finalPrefix}promote
│➽ ${finalPrefix}disaproveall
│➽ ${finalPrefix}getppgroup
│➽ ${finalPrefix}setppgroup
│➽ ${finalPrefix}hidetag
│➽ ${finalPrefix}invite
│➽ ${finalPrefix}kick
│➽ ${finalPrefix}kickall
│➽ ${finalPrefix}kickinactive
│➽ ${finalPrefix}link
│➽ ${finalPrefix}listactive
│➽ ${finalPrefix}listinactive
│➽ ${finalPrefix}listrequests
│➽ ${finalPrefix}resetlink
│➽ ${finalPrefix}tagadmin
│➽ ${finalPrefix}tagall
│➽ ${finalPrefix}vcf
│➽ ${finalPrefix}tosgroup
┗▣

┏▣ ◈ *OWNER MENU* ◈ - 27
│➽ ${finalPrefix}block
│➽ ${finalPrefix}delete
│➽ ${finalPrefix}deljunk
│➽ ${finalPrefix}delstickercmd
│➽ ${finalPrefix}setstickercmd
│➽ ${finalPrefix}cmdreact
│➽ ${finalPrefix}dlvo
│➽ ${finalPrefix}vv
│➽ ${finalPrefix}join
│➽ ${finalPrefix}lastseen
│➽ ${finalPrefix}leave
│➽ ${finalPrefix}listbadword
│➽ ${finalPrefix}listblocked
│➽ ${finalPrefix}listignore
│➽ ${finalPrefix}modestatus
│➽ ${finalPrefix}online
│➽ ${finalPrefix}restart
│➽ ${finalPrefix}setpp
│➽ ${finalPrefix}getpp
│➽ ${finalPrefix}getabout
│➽ ${finalPrefix}setbio
│➽ ${finalPrefix}fliptext
│➽ ${finalPrefix}tostatus
│➽ ${finalPrefix}unblock
│➽ ${finalPrefix}unblockall
│➽ ${finalPrefix}warn
│➽ ${finalPrefix}update
┗▣

┏▣ ◈ *SETTINGS MENU* ◈ - 39
│➽ ${finalPrefix}addbadword
│➽ ${finalPrefix}addsudo
│➽ ${finalPrefix}alwaysonline
│➽ ${finalPrefix}antibug
│➽ ${finalPrefix}anticall
│➽ ${finalPrefix}antidelete
│➽ ${finalPrefix}antideletestatus
│➽ ${finalPrefix}antiedit
│➽ ${finalPrefix}autobio
│➽ ${finalPrefix}autoblock
│➽ ${finalPrefix}autoreact
│➽ ${finalPrefix}autoreactstatus
│➽ ${finalPrefix}autoread
│➽ ${finalPrefix}autorecord
│➽ ${finalPrefix}autorecordtyping
│➽ ${finalPrefix}autotype
│➽ ${finalPrefix}autoviewoncestatus
│➽ ${finalPrefix}delanticalmessages
│➽ ${finalPrefix}delignorelist
│➽ ${finalPrefix}delsudo
│➽ ${finalPrefix}getsettings
│➽ ${finalPrefix}listcountrycode
│➽ ${finalPrefix}listwarn
│➽ ${finalPrefix}mode
│➽ ${finalPrefix}resetsetting
│➽ ${finalPrefix}resetwarn
│➽ ${finalPrefix}setanticallmsg
│➽ ${finalPrefix}setbotname
│➽ ${finalPrefix}setfont
│➽ ${finalPrefix}setmenu
│➽ ${finalPrefix}setmenuimage
│➽ ${finalPrefix}setownername
│➽ ${finalPrefix}setownernumber
│➽ ${finalPrefix}setprefix
│➽ ${finalPrefix}setstatusemoji
│➽ ${finalPrefix}setstickerauthor
│➽ ${finalPrefix}settimezone
│➽ ${finalPrefix}setwarn
│➽ ${finalPrefix}showanticallmsg
┗▣

┏▣ ◈ *OTHER MENU* ◈ - 6
│➽ ${finalPrefix}botstatus
│➽ ${finalPrefix}pair
│➽ ${finalPrefix}ping
│➽ ${finalPrefix}repo
│➽ ${finalPrefix}runtime
│➽ ${finalPrefix}time
┗▣

> *BREAKER-ULTRA-MD by MATSKEN* 👑
`;

      if (fs.existsSync(logoPath)) {
        await client.sendMessage(m.chat, { image: fs.readFileSync(logoPath), caption: str }, { quoted: m });
      } else {
        await client.sendMessage(m.chat, { text: str }, { quoted: m });
      }

    } catch (e) {
      console.log(e);
      await client.sendMessage(m.chat, { text: "Menu error: " + e.message }, { quoted: m });
    }
  }
}
