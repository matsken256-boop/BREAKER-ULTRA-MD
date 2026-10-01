const axios=require('axios');
module.exports={execute:async(sock,m,args)=>{
if(!args[0])return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ GPT ◇\n│.gpt hello\n└─⊷"},{quoted:m});
const{data}=await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(args.join(' '))}`);
await sock.sendMessage(m.key.remoteJid,{text:`┌─⊷ ◇ GPT ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER-ULTRA-MD🌟 v2.7.0`},{quoted:m});
}};