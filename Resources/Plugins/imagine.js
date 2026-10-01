module.exports={execute:async(sock,m,args)=>{
if(!args[0])return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ IMAGINE ◇\n│.imagine cat\n└─⊷"},{quoted:m});
const url=`https://api.siputzx.my.id/api/ai/dalle?prompt=${encodeURIComponent(args.join(' '))}`;
await sock.sendMessage(m.key.remoteJid,{image:{url},caption:`┌─⊷ ◇ IMAGINE ◇\n│ ${args.join(' ')}\n└─⊷\nBREAKER v2.7.0`},{quoted:m});
}};