const axios=require('axios');
module.exports={execute:async(sock,m,args)=>{
if(!args[0])return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ DEEPSEEK ◇\n│.deepseek hi\n└─⊷"},{quoted:m});
try{const{data}=await axios.get(`https://api.siputzx.my.id/api/ai/deepseek?prompt=${encodeURIComponent(args.join(' '))}`);
await sock.sendMessage(m.key.remoteJid,{text:`┌─⊷ ◇ DEEPSEEK ◇\n│ ${data.data||data.result}\n└─⊷`},{quoted:m});
}catch{}
}};