const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const adm=(q,opt={})=>fetch(FS+q,{...opt,headers:{Authorization:'Bearer owner','Content-Type':'application/json'}});
const uidOf=async n=>{const r=await adm('/usernames/'+n);return r.status===200?(await r.json()).fields.uid.stringValue:null;};
const acc=async email=>{const r=await fetch(`${AU}/identitytoolkit.googleapis.com/v1/projects/${PJ}/accounts:lookup`,{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({email:[email]})});return((await r.json()).users)||[];};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader']});const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080};});
await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(2000);
await p.evaluate(()=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first='Gina';ED.last='Test';saveCre();show('mm');});
const dlg=[];p.on('dialog',d=>{dlg.push(d.message());d.accept();});
const st=()=>p.evaluate(()=>{const s=ACCT.state(),u=s.user;return{mode:s.mode,err:s.err,msg:s.msg,busy:s.busy,uid:u&&u.uid,ver:u&&u.emailVerified,prov:u?u.providerData.map(x=>x.providerId).sort().join(','):'',name:s.prof&&s.prof.username};});
const idle=async m=>{for(let i=0;i<150;i++){const s=await st();if(!s.busy&&s.mode!=='loading'&&s.mode!=='wait'&&(!m||s.mode===m))return s;await p.waitForTimeout(200);}return st();};
const fill=async o=>{for(const[k,v]of Object.entries(o))await p.fill('#'+k,v);};const act=async(a,x='')=>{await p.click(`#acctb [data-aa="${a}"]${x}`);return idle();};
const snapL=()=>p.evaluate(()=>JSON.stringify([0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i))));
const parts=async(u,k)=>((await (await adm(`/users/${u}/careers/${k}/parts`)).json()).documents||[]).length;
const head=async(u,k)=>{const r=await adm(`/users/${u}/careers/${k}`);return r.status===200?await r.text():null;};
// the pop-up step only: same Firebase call with an emulator Google token (the real pop-up needs apis.google.com, blocked here)
const tok=(sub,email,name)=>p.evaluate(t=>{window.GTOK=t;},JSON.stringify({sub,email,email_verified:true,name}));
const hook=()=>p.evaluate(async()=>{const f=await ACCT.boot(),Au=f.Au,c=()=>{if(window.GFAIL){const e=window.GFAIL;window.GFAIL=null;return Promise.reject(e);}return null;},g=()=>Au.GoogleAuthProvider.credential(window.GTOK);
 Au.signInWithPopup=(a)=>c()||Au.signInWithCredential(a,g());Au.linkWithPopup=(u)=>c()||Au.linkWithCredential(u,g());Au.reauthenticateWithPopup=(u)=>c()||Au.reauthenticateWithCredential(u,g());});
await p.click('#macct');await idle('out');await hook();
ok('googleButtonVisible',await p.isVisible('#acctb [data-aa="google"]'));
// failures
for(const [code,re] of [['auth/popup-closed-by-user',/cancelled/],['auth/popup-blocked',/blocked/],['auth/network-request-failed',/No connection/],['auth/unauthorized-domain',/not allowed on this web address/]]){
 await p.evaluate(c=>{window.GFAIL={code:c};},code);const s=await act('google');ok('fail '+code,s.mode==='out'&&!s.uid&&re.test(s.err),s.err);}
// first-time Google user
await tok('g-1','gary@x.com','Gary Gamer!');let s=await act('google');ok('firstTimeNeedsName',s.mode==='name'&&s.ver===true&&s.prov==='google.com',JSON.stringify(s));
ok('nameSuggested',(await p.inputValue('#acun'))==='gary_gamer');s=await act('claim');ok('privacyRequired',/privacy/.test(s.err)&&s.mode==='name');
await p.check('#acok');s=await act('claim');ok('googleClaimed',s.mode==='in'&&s.name==='gary_gamer'&&(await uidOf('gary_gamer'))===s.uid);
ok('googleHasCloud',(await p.textContent('#acctb')).includes('CLOUD CAREERS'));const gUid=s.uid;
s=await act('signout');ok('signOutGoogle',s.mode==='out'&&!s.uid);
await tok('g-1','gary@x.com','Gary Gamer!');s=await act('google');ok('googleSignInAgain',s.mode==='in'&&s.uid===gUid&&s.name==='gary_gamer');await act('signout');
// username conflict for a second Google user
await tok('g-2','gary2@x.com','Gary Gamer');s=await act('google');ok('suggestionTakenIsOnlySuggested',s.mode==='name'&&(await p.inputValue('#acun'))==='gary_gamer');
await p.check('#acok');s=await act('claim');ok('takenRefused',/taken/.test(s.err)&&s.mode==='name'&&(await uidOf('gary_gamer'))===gUid);
await fill({acun:'gary_two'});s=await act('claim');ok('otherNameOk',s.mode==='in'&&s.name==='gary_two');await act('signout');
// email/password user with a cloud career links Google
await p.click('#acctb [data-t="new"]');await fill({acun:'emailer',acem:'e@x.com',acpw:'password1',acpw2:'password1'});await p.check('#acok');s=await act('create');const eUid=s.uid;
const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email==='e@x.com').oobLink);await act('recheck');
await act('cload');await p.click('#acctb [data-aa="up"][data-i="0"]');s=await act('upto','[data-k="0"]');const H0=await head(eUid,0);ok('emailUserUploaded',!!H0,s.err);const L0=await snapL();   // from here on, no sign-in may change a device career
await tok('g-e','e@x.com','Emma');s=await act('glink');ok('linkGoogle',s.uid===eUid&&s.prov==='google.com,password'&&s.name==='emailer'&&/linked/.test(s.msg),JSON.stringify(s));
await act('signout');await tok('g-e','e@x.com','Emma');s=await act('google');
ok('googleReachesSameAccount',s.mode==='in'&&s.uid===eUid&&s.name==='emailer'&&(await head(eUid,0))===H0);
await act('signout');await fill({acem:'e@x.com',acpw:'password1'});s=await act('signin');ok('passwordStillWorks',s.uid===eUid&&s.mode==='in');await act('signout');
// a Google account already used by another PAF account cannot be linked elsewhere
await p.click('#acctb [data-t="new"]');await fill({acun:'other_one',acem:'o@x.com',acpw:'password1',acpw2:'password1'});await p.check('#acok');s=await act('create');const oUid=s.uid;
await tok('g-e','e@x.com','Emma');s=await act('glink');ok('credentialInUseRefused',/different PAF account/.test(s.err)&&s.uid===oUid&&s.prov==='password'&&(await head(eUid,0))===H0,JSON.stringify(s));await act('signout');
// email collision: an existing password account, then Google with the same email
await p.click('#acctb [data-t="new"]');await fill({acun:'collide',acem:'c@x.com',acpw:'password1',acpw2:'password1'});await p.check('#acok');s=await act('create');const cUid=s.uid;
const oob2=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob2.find(o=>o.email==='c@x.com').oobLink);await act('signout');
// (a) what the emulator does on its own (Firebase default "one account per email"): Google joins the existing verified account, same uid
await tok('g-c','c@x.com','Cee');s=await act('google');ok('collisionJoinsSameUid',s.uid===cUid&&s.name==='collide'&&(await acc('c@x.com')).length===1,JSON.stringify(s));await act('signout');
// (b) the other answer real Firebase can give: account-exists-with-different-credential -> explain, password first, then link to THAT uid
await p.click('#acctb [data-t="new"]');await fill({acun:'linkme',acem:'l@x.com',acpw:'password1',acpw2:'password1'});await p.check('#acok');s=await act('create');const lUid=s.uid;await act('signout');
const exists=em=>p.evaluate(em=>{const Au=ACCT._fb().Au,G=Au.GoogleAuthProvider;window.GTOK=JSON.stringify({sub:'g-l',email:em,email_verified:true});
 Au.GoogleAuthProvider=class extends G{static credentialFromError(){return G.credential(window.GTOK);}};Au.GoogleAuthProvider.credential=G.credential;window.GFAIL={code:'auth/account-exists-with-different-credential',customData:{email:em}};},em);
await exists('l@x.com');s=await act('google');ok('existsExplained',s.mode==='out'&&!s.uid&&/already exists/.test(s.err)&&(await p.textContent('#acctb')).includes('l@x.com'),JSON.stringify(s));
await fill({acem:'l@x.com',acpw:'password1'});s=await act('signin');ok('linkedAfterPassword',s.uid===lUid&&s.prov==='google.com,password'&&s.name==='linkme'&&/linked/.test(s.msg),JSON.stringify(s));await act('signout');
await tok('g-l','l@x.com','L');s=await act('google');ok('linkedGoogleSignsInSameUid',s.uid===lUid&&s.name==='linkme');await act('signout');
// (c) pending Google login, but the player signs in to a DIFFERENT account: nothing is linked
await exists('nobody@x.com');s=await act('google');await fill({acem:'o@x.com',acpw:'password1'});s=await act('signin');
ok('noLinkToOtherAccount',s.uid===oUid&&s.prov==='password'&&/not linked/.test(s.msg),JSON.stringify(s));await act('signout');
// Google-only account deletion (re-auth through Google)
await tok('g-1','gary@x.com','Gary');s=await act('google');await act('delask');await fill({acdty:'gary_gamer'});
ok('googleDeleteNoPasswordField',!(await p.$('#acdpw')));s=await act('del');
ok('googleDelete',s.mode==='out'&&/deleted/.test(s.msg)&&!(await uidOf('gary_gamer'))&&(await adm('/users/'+gUid)).status===404&&(await acc('gary@x.com')).length===0,JSON.stringify(s));
// offline Google sign-in
await ctx.setOffline(true);await tok('g-2','gary2@x.com','x');s=await act('google');await ctx.setOffline(false);ok('offlineGoogle',s.mode==='out'&&/connection|unreachable/i.test(s.err),s.err);
ok('localCareersNeverMoved',(await snapL())===L0);ok('noPageErrors',errs.length===0,JSON.stringify(errs));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
