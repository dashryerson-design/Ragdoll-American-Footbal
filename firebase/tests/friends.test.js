// Friends + profile look: the essential checks with two accounts (Auth + Firestore emulators): request + accept, friend's profile (avatar,
// calling card, stats, nothing private), saving a look, rules (own profile only, built-in ids only), account deletion cleanup.
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const adm=q=>fetch(FS+q,{headers:{Authorization:'Bearer owner'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const until=async(f,ms=20000)=>{const t=Date.now();while(Date.now()-t<ms){try{if(await f())return true;}catch(e){}await sleep(300);}return false;};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required']});const errs=[];
const dev=async(name,email)=>{const ctx=await b.newContext({viewport:{width:1100,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
 await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080};});
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1800);
 await p.evaluate(f=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first=f;ED.last='Pal';saveCre();EXH.record(loadProf(0)&&loadProf(0).cid||'x',{us:21,them:7});EXH.tally('r','w');EXH.tally('r','l');show('mm');},name);await p.waitForTimeout(800);
 const idle=async()=>{for(let i=0;i<80;i++){const s=await p.evaluate(()=>{const s=ACCT.state();return s.busy||s.mode==='loading'||s.mode==='wait';});if(!s)return;await p.waitForTimeout(200);}};
 await p.click('#macct');await idle();await p.click('#acctb [data-t="new"]');for(const[k,v]of Object.entries({acun:name.toLowerCase()+'_fr',acem:email,acpw:'password1',acpw2:'password1'}))await p.fill('#'+k,v);await p.check('#acok');await p.click('#acctb [data-aa="create"]');await idle();
 const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email===email).oobLink);await p.click('#acctb [data-aa="recheck"]');await idle();
 const fa=(a,x='')=>p.click(`#acctb [data-fa="${a}"]${x}`);const tab=t=>p.click(`#acctb [data-aa="atab"][data-t="${t}"]`);return{p,ctx,fa,tab};};
const A=await dev('Amy','a@x.com'),B=await dev('Ben','b@x.com');const st=D=>D.p.evaluate(()=>FRIENDS.state());
const au=(await st(A)).uid,bu=(await st(B)).uid;
// ---- customise (Ben): avatar + calling card, saved as ids
await B.tab('pro');ok('customiseShown',await B.p.evaluate(()=>document.querySelectorAll('#acctb .cgrid .cpick').length>=30&&document.querySelectorAll('#acctb .ccgrid .cpick').length>=10));
await B.fa('av','[data-v="f-helmet"]');await B.fa('cc','[data-v="blitz"]');await B.fa('look');
ok('lookSaved',await until(async()=>{const d=await (await adm('/publicProfiles/'+bu)).json();return d.fields&&d.fields.avatar.stringValue==='f-helmet'&&d.fields.card.stringValue==='blitz';},8000));
ok('lookShownInHeader',await B.p.evaluate(()=>!!document.querySelector('#acctb .acdh .ccard.hdr')&&document.querySelector('#acctb .acdh .cav').title==='Helmet'));
// ---- rules: only your own profile, only built-in ids
const rule=await A.p.evaluate(async bu=>{const f=ACCT._fb(),F=f.F,r={};try{await F.setDoc(F.doc(f.db,'publicProfiles',bu),{avatar:'g-crown'},{merge:true});r.other='allowed';}catch(e){r.other=e.code;}
 try{await F.setDoc(F.doc(f.db,'publicProfiles',f.auth.currentUser.uid),{avatar:'https://evil.example/x.png'},{merge:true});r.url='allowed';}catch(e){r.url=e.code;}
 try{await F.setDoc(F.doc(f.db,'publicProfiles',f.auth.currentUser.uid),{email:'a@x.com'},{merge:true});r.email='allowed';}catch(e){r.email=e.code;}return r;},bu);
ok('rulesOwnProfileOnly',rule.other==='permission-denied'&&rule.url==='permission-denied'&&rule.email==='permission-denied',JSON.stringify(rule));
// ---- request + accept
await A.tab('fr');await A.p.fill('#frq','BEN_FR');await A.fa('add');ok('requestSent',await until(async()=>(await st(A)).out.length===1,8000));
ok('incomingWithNotification',await until(async()=>(await st(B)).inc.length===1&&/amy_fr sent you a friend request/.test(await B.p.textContent('#frnote')),10000));
await B.tab('fr');await B.fa('tab','[data-t="inc"]');await B.fa('acc');
ok('bothFriends',await until(async()=>{await A.p.evaluate(()=>FRIENDS.load());return (await st(A)).friends.length===1&&(await st(B)).friends.length===1;},10000));
ok('noPresenceShown',await A.p.evaluate(()=>!document.querySelector('.frdot')&&!/Online|Offline/.test($m('acctb').textContent)));
// ---- Amy opens Ben's profile by clicking him
await A.fa('tab','[data-t="list"]');await A.p.click('#acctb .frrow');ok('profileShown',await until(async()=>{const t=await A.p.textContent('#acctb');return /ben_fr/.test(t)&&/Joined/.test(t)&&/EXHIBITION/.test(t)&&/1V1 RUNS/.test(t)&&/Win rate/.test(t);},8000),await A.p.textContent('#acctb'));
ok('profileShowsLook',await A.p.evaluate(()=>document.querySelector('#acctb [data-pane="fr"] .ccard.prof .cav').title==='Helmet'));
const doc=await (await adm('/publicProfiles/'+bu)).json(),keys=Object.keys(doc.fields).sort().join(',');
ok('noPrivateData',keys.replace('acct,','')==='avatar,card,joined,stats,username'&&!JSON.stringify(doc).includes('@x.com')&&!(await A.p.textContent('#acctb')).includes('b@x.com'),keys);
// ---- account deletion removes friends data and the public profile
await A.fa('back');await B.p.evaluate(()=>{ACCT.tab('sec');});await B.p.click('#acctb [data-aa="delask"]');await B.p.fill('#acdty','ben_fr');await B.p.fill('#acdpw','password1');await B.p.click('#acctb [data-aa="del"]');
ok('accountDeleted',await until(()=>B.p.evaluate(()=>ACCT.state().mode==='out'),20000));
const gone=async q=>{const r=await (await fetch(FS+':runQuery',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({structuredQuery:{from:[{collectionId:q}]}})})).json();return r.filter(x=>x.document&&JSON.stringify(x.document).includes(bu)).length===0;};
ok('deletionCleanup',(await adm('/publicProfiles/'+bu)).status===404&&await gone('friendships')&&await gone('requests')&&await gone('invites'));
await A.p.evaluate(()=>FRIENDS.load());ok('friendGoneForOther',await until(async()=>(await st(A)).friends.length===0,8000));
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,4)));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
