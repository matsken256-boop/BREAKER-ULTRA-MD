const axios=require('axios');
module.exports={execute:async(sock,m,args)=>{
if(!args[0])return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ PROGRAMMING ◇\n│ Usage:.programming make calculator in python\n└─⊷"},{quoted:m});
try{
const{data}=await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=You are expert programmer. Write code for: ${encodeURIComponent(args.join(' '))}`);
await sock.sendMessage(m.key.remoteJid,{text:`┌─⊷ ◇ PROGRAMMING ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER v2.7.0`},{quoted:m});
}catch{}
}};