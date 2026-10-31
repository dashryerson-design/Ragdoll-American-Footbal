// Account Level on an account (Auth + Firestore emulators): guest XP carried into a new account, uploaded in rule-sized steps,
// equipped items synced, the same level on a second device, a tampered big jump refused, public level on the profile.
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const adm=q=>fetch(FS+q,{headers:{Authorization:'Bearer owner'}}).then(r=>r.status===200?r.json():null);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const until=async(f,ms=30000)=>{const t=Date.now();while(Date.now()-t<ms){try{if(await f())return true;}catch(e){}await sleep(500);}return false;};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required']});const errs=[];
const dev=async name=>{const ctx=await b.newContext({viewport:{width:1100,height:800}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
 await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080};window.PAF_XPTEST=1;});
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1800);
 const idle=async()=>{for(let i=0;i<80;i++){const s=await p.evaluate(()=>{const s=ACCT.state();return s.busy||s.mode==='loading'||s.mode==='wait';});if(!s)return;await p.waitForTimeout(200);}};return{p,ctx,idle};};
const A=await dev('A');
// guest: earn some XP on this device
await A.p.evaluate(()=>{for(let i=0;i<4;i++)PROG.award({id:'g'+i,mode:'exh',r:'w',S:{comp:6,ptd:2}});});const gx=await A.p.evaluate(()=>PROG.total());
ok('guestEarns',gx>0&&await A.p.evaluate(()=>PROG.level())>1,gx);
await A.p.evaluate(()=>{PROG.setEq('bt','b-clean');$m('lvlup').hidden=true;});
// create an account: the guest progress joins it
await A.p.evaluate(()=>show('mm'));await A.p.click('#macct');await A.idle();await A.p.click('#acctb [data-t="new"]');for(const[k,v]of Object.entries({acun:'lvl_one',acem:'l@x.com',acpw:'password1',acpw2:'password1'}))await A.p.fill('#'+k,v);await A.p.check('#acok');await A.p.click('#acctb [data-aa="create"]');await A.idle();
const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email==='l@x.com').oobLink);await A.p.click('#acctb [data-aa="recheck"]');await A.idle();
const uid=await A.p.evaluate(()=>ACCT._fb().auth.currentUser.uid);
ok('progressDocCreated',await until(async()=>{const d=await adm('/progress/'+uid);return d&&d.fields.xp.integerValue==='0';},15000));
ok('displayKeepsGuestXP',await A.p.evaluate(x=>PROG.total()===x,gx));
ok('guestXPUploaded',await until(async()=>{const d=await adm('/progress/'+uid);return d&&+d.fields.xp.integerValue===gx;},45000),JSON.stringify(await adm('/progress/'+uid)));
ok('equippedSynced',await until(async()=>{const d=await adm('/progress/'+uid);return d&&d.fields.eq.mapValue.fields&&d.fields.eq.mapValue.fields.bt.stringValue==='b-clean';},10000));
// a tampered client cannot jump levels
const tam=await A.p.evaluate(async()=>{const f=ACCT._fb(),F=f.F;try{await F.updateDoc(F.doc(f.db,'progress',f.auth.currentUser.uid),{xp:400000,t:F.serverTimestamp()});return'allowed';}catch(e){return e.code;}});
ok('bigJumpRefused',tam==='permission-denied',tam);
// public profile shows the level (and no XP total)
ok('publicLevel',await until(async()=>{const d=await adm('/publicProfiles/'+uid);return d&&d.fields.acct&&+d.fields.acct.mapValue.fields.lvl.integerValue===await A.p.evaluate(()=>PROG.level());},15000));
// a second device signs in: same level, same equipped trail
const B=await dev('B');await B.p.evaluate(()=>show('mm'));await B.p.click('#macct');await B.idle();await B.p.fill('#acem','l@x.com');await B.p.fill('#acpw','password1');await B.p.click('#acctb [data-aa="signin"]');await B.idle();
ok('secondDeviceSameLevel',await until(()=>B.p.evaluate(x=>PROG.total()===x&&PROG.eqd().bt==='b-clean',gx),20000),JSON.stringify(await B.p.evaluate(()=>[PROG.total(),PROG.eqd()])));
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,3)));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
