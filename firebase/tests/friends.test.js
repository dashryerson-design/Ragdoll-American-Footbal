// Friends: the essential checks with two accounts (Auth + Firestore + Realtime Database emulators): request + accept, online/offline,
// public profile without private data, invite sent + accepted into the lobby.
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const adm=q=>fetch(FS+q,{headers:{Authorization:'Bearer owner'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const until=async(f,ms=20000)=>{const t=Date.now();while(Date.now()-t<ms){try{if(await f())return true;}catch(e){}await sleep(300);}return false;};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--disable-features=WebRtcHideLocalIpsWithMdns','--autoplay-policy=no-user-gesture-required']});const errs=[];
const dev=async(name,email)=>{const ctx=await b.newContext({viewport:{width:1100,height:760}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
 await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080,dbPort:9000};window.PAF_ICE=[];});
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1800);
 await p.evaluate(f=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first=f;ED.last='Pal';saveCre();show('mm');},name);await p.waitForTimeout(800);
 const idle=async()=>{for(let i=0;i<80;i++){const s=await p.evaluate(()=>{const s=ACCT.state();return s.busy||s.mode==='loading'||s.mode==='wait';});if(!s)return;await p.waitForTimeout(200);}};
 await p.click('#macct');await idle();await p.click('#acctb [data-t="new"]');for(const[k,v]of Object.entries({acun:name.toLowerCase()+'_fr',acem:email,acpw:'password1',acpw2:'password1'}))await p.fill('#'+k,v);await p.check('#acok');await p.click('#acctb [data-aa="create"]');await idle();
 const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email===email).oobLink);await p.click('#acctb [data-aa="recheck"]');await idle();
 await p.click('#acctb [data-aa="atab"][data-t="fr"]');const fa=(a,x='')=>p.click(`#acctb [data-fa="${a}"]${x}`);return{p,ctx,fa};};
const A=await dev('Amy','a@x.com'),B=await dev('Ben','b@x.com');
const st=(D)=>D.p.evaluate(()=>FRIENDS.state());
// ---- request + accept
await A.p.fill('#frq','Nobody_Here');await A.fa('add');ok('unknownUsername',await until(async()=>/No player called nobody_here/.test(await A.p.textContent('#acctb')),8000));
await A.p.fill('#frq','amy_fr');await A.fa('add');ok('cannotAddYourself',await until(async()=>/your own username/.test(await A.p.textContent('#acctb')),8000));
await A.p.fill('#frq','BEN_FR');await A.fa('add');ok('requestSent',await until(async()=>(await st(A)).out.length===1&&/request sent to ben_fr/.test(await A.p.textContent('#acctb')),8000));
await A.p.fill('#frq','ben_fr');await A.fa('add');ok('noDuplicateRequest',await until(async()=>/already sent/.test(await A.p.textContent('#acctb')),8000));
ok('incomingWithNotification',await until(async()=>(await st(B)).inc.length===1&&/amy_fr sent you a friend request/.test(await B.p.textContent('#frnote'))&&!(await B.p.evaluate(()=>$m('macbadge').hidden)),10000));
await B.fa('tab','[data-t="inc"]');await B.fa('acc');
ok('bothFriends',await until(async()=>(await st(A)).friends.length===1&&(await st(B)).friends.length===1&&(await st(A)).out.length===0&&(await st(B)).inc.length===0,10000));
ok('acceptedNotification',await until(async()=>/ben_fr accepted your friend request/.test(await A.p.textContent('#frnote')),8000));
// ---- online status
ok('friendShownOnline',await until(async()=>{await A.fa('tab','[data-t="list"]');return await A.p.evaluate(()=>!!document.querySelector('#acctb .frrow .frdot.on'))&&(await A.p.textContent('#acctb')).includes('ben_fr');},15000));
// ---- public profile: what exists, nothing private
await A.fa('prof');ok('profileShown',await until(async()=>{const t=await A.p.textContent('#acctb');return /ben_fr/.test(t)&&/Joined/.test(t)&&/Online/.test(t)&&/No Exhibition games played yet|EXHIBITION/.test(t);},8000));
const bu=(await st(B)).uid;const doc=await (await adm('/publicProfiles/'+bu)).json();const keys=Object.keys(doc.fields||{}).sort().join(',');
ok('profileHasNoPrivateData',keys==='joined,stats,username'&&!(await A.p.textContent('#acctb')).includes('b@x.com')&&!JSON.stringify(doc).includes('b@x.com')&&!JSON.stringify(doc).includes('pafCareer'),keys);
await A.fa('back');
// ---- invite: host a room, friend accepts into the lobby
await A.fa('inv');await A.fa('invm','[data-m="runs"]');
ok('inviteSentHostWaiting',await until(()=>A.p.evaluate(()=>NET.phase==='waiting'&&!!NET.code&&$m('net').hidden===false),15000));
ok('inviteNotification',await until(async()=>/amy_fr invited you to 1v1 Runs/.test(await B.p.textContent('#frnote')),10000));
await B.p.click('#frnote [data-fn="acc"]');
ok('inviteAcceptedBothInLobby',await until(()=>A.p.evaluate(()=>NET.phase==='lobby')&&B.p.evaluate(()=>NET.phase==='lobby'),30000),await B.p.evaluate(()=>NET.phase+' '+NET.msg));
ok('inviteUsedOnce',await until(async()=>(await (await fetch(FS+'/invites/'+bu+'_'+(await st(A)).uid,{headers:{Authorization:'Bearer owner'}})).status)===404,5000));
await B.p.evaluate(()=>NET.leave());await A.p.evaluate(()=>NET.leave());
// ---- offline when the friend's browser goes away
await B.ctx.close();await A.p.evaluate(()=>{show('acct');ACCT.tab('fr');});
ok('friendShownOfflineAfterClose',await until(()=>A.p.evaluate(()=>!document.querySelector('#acctb .frrow .frdot.on')&&!!document.querySelector('#acctb .frrow .frdot')),30000));
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,4)));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
