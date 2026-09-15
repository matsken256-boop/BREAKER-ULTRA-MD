const settings = require('../../settings.js');

module.exports = {
  command: ['menu','help','list','breaker','bot'],
  category: 'general',
  desc: 'Show all commands menu',
  
  async handler(m, { conn }) {
    const prefix = settings.prefix || '.';
    const botName = settings.botName || 'BREAKER-ULTRA-MD';
    const ownerName = settings.ownerName || 'Matsken';
    
    const menuText = `
┏━━━━━━━━━━━━━━━━━━┓
┃  *${botName} ULTRA*
┗━━━━━━━━━━━━━━━━━━┛
┃
┃ • *BOT* : ${botName}
┃ • *OWNER* : ${ownerName}
┃ • *PREFIX* : [ ${prefix} ]
┃ • *COMMANDS* : 137
┃ • *MODE* : Public
┃ • *VERSION* : Ultra V1
┃
┗━━━━━━━━━━━━━━━━━━┛

> _Light | Fast | Powerful_

┌───〔 *AI MENU* 〕───
│ ✦ ${prefix}gpt
│ ✦ ${prefix}gemini
│ ✦ ${prefix}imagine
│ ✦ ${prefix}deepseek
│ ✦ ${prefix}flux
│ ✦ ${prefix}copilot
│ ✦ ${prefix}analyze
│ ✦ ${prefix}translate
└──────────────

┌───〔 *DOWNLOAD MENU* 〕───
│ ✦ ${prefix}play
│ ✦ ${prefix}song
│ ✦ ${prefix}video
│ ✦ ${prefix}ytmp3
│ ✦ ${prefix}tiktok
│ ✦ ${prefix}fb
│ ✦ ${prefix}ig
│ ✦ ${prefix}apk
│ ✦ ${prefix}gdrive
│ ✦ ${prefix}mediafire
└──────────────

┌───〔 *GROUP MENU* 〕───
│ ✦ ${prefix}tagall
│ ✦ ${prefix}hidetag
│ ✦ ${prefix}kick
│ ✦ ${prefix}add
│ ✦ ${prefix}promote
│ ✦ ${prefix}demote
│ ✦ ${prefix}antilink
│ ✦ ${prefix}welcome
│ ✦ ${prefix}goodbye
│ ✦ ${prefix}link
│ ✦ ${prefix}setppgc
└──────────────

┌───〔 *OWNER MENU* 〕───
│ ✦ ${prefix}restart
│ ✦ ${prefix}block
│ ✦ ${prefix}unblock
│ ✦ ${prefix}join
│ ✦ ${prefix}leave
│ ✦ ${prefix}setpp
│ ✦ ${prefix}setbio
│ ✦ ${prefix}eval
│ ✦ ${prefix}update
└──────────────

┌───〔 *TOOLS MENU* 〕───
│ ✦ ${prefix}ping
│ ✦ ${prefix}alive
│ ✦ ${prefix}runtime
│ ✦ ${prefix}pair
│ ✦ ${prefix}calc
│ ✦ ${prefix}sticker
│ ✦ ${prefix}tourl
└──────────────

┌───〔 *SETTINGS MENU* 〕───
│ ✦ ${prefix}mode
│ ✦ ${prefix}autobio
│ ✦ ${prefix}autoread
│ ✦ ${prefix}autolike
│ ✦ ${prefix}setprefix
│ ✦ ${prefix}setbotname
└──────────────

> *${botName} © ${ownerName} - 2026*
> *Powered by Matsken Tech | Ultra Fast*
`;

    await conn.sendMessage(m.chat, { text: menuText }, { quoted: m });
  }
  }
