// COPY THIS - SHORT SAFE VERSION
const fs=require('fs');
const path=require('path');
const os=require('os');
const PLUGINS_DIR=path.join(__dirname,'../Plugins');
const ROOT_DIR=path.join(__dirname,'../../');
const config={botName:"BREAKER-ULTRA MD",ownerName:"Matsken",prefix:".",version:"2.7.0",mode:"public"};

function findLogo(){
 try{
  const files=fs.readdirSync(ROOT_DIR);
  for(const f of files){
   const l=f.toLowerCase();
   if((l.includes('logo')||l.includes('breaker')||l.includes('ultra'))&&(l.endsWith('.jpg')||l.endsWith('.png')||l.endsWith('.jpeg'))){
    return path.join(ROOT_DIR,f)
   }
  }
 }catch{}
 return null;
}

function getStats(){
 let count=0;
 try{count=fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).length}catch{}
 const mem=(process.memoryUsage().heapUsed/1024/1024).toFixed(0);
 const tot=(os.totalmem()/1024/1024/1024).toFixed(0);
 const pct=Math.floor((1-os.freemem()/os.totalmem())*100);
 const bar='█'.repeat(Math.floor(pct/10))+'░'.repeat(10-Math.floor(pct/10));
 return{count,mem,tot,pct,bar,plat:os.platform(),host:os.hostname()};
}

module.exports=async(sock,msg)=>{
 try{
  if(!msg){
   try{
    const s=getStats();
    const botName=sock.user?.name||config.botName;
    const dt=new Date().toLocaleString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' EAT';
    const welcome='┌─⊳ ◈ '+config.botName+' ◈\n│ OWNER : '+config.ownerName+'\n│ BOT NAME : '+botName+'\n│ PREFIX : [ '+config.prefix+' ]\n│ HOST : '+s.host+'\n│ PLUGINS : '+s.count+'\n│ MODE : '+config.mode+'\n│ VERSION : '+config.version+'\n│ PLATFORM : '+s.plat+'\n│ DATE : '+dt+'\n│ RAM: ['+s.bar+'] '+s.pct+'%\n└─⊳';
    await sock.sendMessage(sock.user.id,{text:welcome});
   }catch{}return;
  }
  if(!msg.message)return;
  const from=msg.key.remoteJid;
  const pushname=msg.pushName||from.split('@')[0];
  let body=msg.message.conversation||msg.message.extendedTextMessage?.text||'';
  if(!body)return;
  if(![".", "!", "/"].some(p=>body.startsWith(p)))return;
  const prefix=body[0];
  const args=body.slice(1).trim().split(/ +/);
  const command=args.shift()?.toLowerCase();
  const start=Date.now();
  const cmdFile=path.join(PLUGINS_DIR,command+'.js');
  if(fs.existsSync(cmdFile)){
   try{delete require.cache[require.resolve(cmdFile)];const plugin=require(cmdFile);
   if(typeof plugin==='function'){await plugin(sock,msg,args,from,{pushName:pushname,prefix});return;}
   if(plugin.execute){await plugin.execute(sock,msg,args,from);return;}}catch(e){console.log(e.message)}}
  if(command==='menu'){
   const files=fs.existsSync(PLUGINS_DIR)?fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')):[];
   const ai=['analyze','blackbox','cat','chatbot','dalle','dare','deepseek','dog'];
   const aiExist=ai.filter(c=>files.includes(c));
   const s=getStats();const speed=(Date.now()-start).toFixed(4);
   const botName=sock.user?.name||config.botName;
   let menu='┌─⊳ ◈ '+botName+' ◈\n│ USER : '+pushname+'\n│ HOST : '+s.host+'\n│ PLUGINS : '+s.count+'\n│ SPEED : '+speed+' ms\n│ PLATFORM : '+s.plat+'\n│ RAM: ['+s.bar+'] '+s.pct+'%\n└─⊳\n\n┌─⊳ ◈ AI MENU ◈\n';
   for(const c of aiExist)menu+='│ ➳ '+c+'\n';menu+='└─⊳';
   await sock.sendMessage(from,{text:menu},{quoted:msg});
  }
 }catch(e){console.log('Fatal',e.message)}
};