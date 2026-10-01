const axios=require('axios');
module.exports={execute:async(sock,m,args)=>{
if(!args[0])return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ ANALYSE ◇\n│ Usage:.analyse what is love\n└─⊷"},{quoted:m});
try{const{data}=await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=Analyse: ${encodeURIComponent(args.join(' '))}`);
await sock.sendMessage(m.key.remoteJid,{text:`╭─── • ────╮\n│ OWNER : MATSKEN\n│ VERSION : 2.7.0\n╰─── • ────╯\n\n┌─⊷ ◇ ANALYSE ◇\n│ ${data.data}\n└─⊷`},{quoted:m});
}catch{ sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ ERROR ◇\n│ Failed\n└─⊷"},{quoted:m});}
}};