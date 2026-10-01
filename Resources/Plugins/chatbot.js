const axios=require('axios');
let isChatbotOn = false;

module.exports={
  execute:async(sock,m,args)=>{
    const cmd = args[0]?.toLowerCase();

    if(cmd === 'on'){
      isChatbotOn = true;
      return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ CHATBOT ◇\n│ ✅ Chatbot is now ON\n│ Bot will reply to all messages\n└─⊷\n\n🌟BREAKER v2.7.0"},{quoted:m});
    }
    if(cmd === 'off'){
      isChatbotOn = false;
      return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ CHATBOT ◇\n│ ❌ Chatbot is now OFF\n└─⊷\n\n🌟BREAKER v2.7.0"},{quoted:m});
    }
    if(!args[0]){
      return sock.sendMessage(m.key.remoteJid,{text:"┌─⊷ ◇ CHATBOT ◇\n│ Usage:\n│ ➳.chatbot on - enable\n│ ➳.chatbot off - disable\n│ ➳.chatbot hi - chat directly\n└─⊷"},{quoted:m});
    }

    // Direct chat
    try{
      const{data}=await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(args.join(' '))}`);
      await sock.sendMessage(m.key.remoteJid,{text:`┌─⊷ ◇ CHATBOT ◇\n│ ${data.data}\n└─⊷\n\n🌟BREAKER v2.7.0`},{quoted:m});
    }catch{}
  }
};