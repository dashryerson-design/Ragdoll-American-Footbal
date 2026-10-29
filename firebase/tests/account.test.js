const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={};const ok=(k,v)=>{R[k]=v;console.log(v?'PASS':'FAIL',k);};
const adm=(path,opt={})=>fetch(FS+path,{...opt,headers:{Authorization:'Bearer owner','Content-Type':'application/json'}});
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader']});const ctx=await b.newContext({viewport:{width:1280,height:720}});const errs=[],gst=[];
const go=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>{if(/firebasejs|firestore|identitytoolkit|securetoken|127\.0\.0\.1/.test(r.url()))gst.push(r.url());});
 await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080};});
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(2500);return p;};
let p=await go();
await p.evaluate(()=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first='Keep';ED.last='Me';saveCre();});
const snap=()=>p.evaluate(()=>JSON.stringify(Object.keys(localStorage).filter(k=>k.startsWith('pafCareer')).sort().map(k=>[k,localStorage.getItem(k)])));const before=await snap();
ok('guestNoNetwork',gst.length===0);if(gst.length)console.log(gst);await p.evaluate(()=>show('mm'));ok('guestLabel',(await p.textContent('#macsub')).startsWith('Guest'));
const st=()=>p.evaluate(()=>{const s=ACCT.state();return{mode:s.mode,err:s.err,msg:s.msg,busy:s.busy,prof:s.prof,ver:s.user&&s.user.emailVerified};});
const idle=async(m)=>{for(let i=0;i<60;i++){const s=await st();if(!s.busy&&s.mode!=='loading'&&s.mode!=='wait'&&(!m||s.mode===m))return s;await p.waitForTimeout(250);}return st();};
const fill=async o=>{for(const[k,v]of Object.entries(o))await p.fill('#'+k,v);};const click=a=>p.click(`#acctb [data-aa="${a}"]`);
await p.click('#macct');let s=await idle('out');ok('openSignedOut',s.mode==='out'&&await p.isVisible('#acct'));
await p.click('#acctb [data-t="new"]');
await fill({acun:'Bad Name',acem:'a@x.com',acpw:'password1',acpw2:'password1'});await p.check('#acok');await click('create');s=await idle();ok('badName',/3-16/.test(s.err)&&s.mode==='out');
await fill({acun:'admin'});await click('create');s=await idle();ok('reserved',/3-16/.test(s.err));
await fill({acun:'dash_27',acpw:'password1',acpw2:'nope'});await click('create');s=await idle();ok('mismatch',/match/.test(s.err));
await fill({acpw:'password1',acpw2:'password1'});await p.uncheck('#acok');await click('create');s=await idle();ok('needsPrivacy',/privacy/.test(s.err));
await fill({acpw:'password1',acpw2:'password1'});await p.check('#acok');await click('create');s=await idle('in');ok('created',s.mode==='in'&&s.prof.username==='dash_27'&&s.ver===false&&/verification/.test(s.msg));
let u=await (await adm('/usernames/dash_27')).json();ok('nameClaimed',!!(u.fields&&u.fields.uid));
ok('menuLabel',(await p.textContent('#macsub')).includes('dash_27'));
// verify via emulator oob link
const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;ok('verifyEmailSent',oob.some(o=>o.requestType==='VERIFY_EMAIL'&&o.email==='a@x.com'));
await fetch(oob.find(o=>o.requestType==='VERIFY_EMAIL').oobLink);await click('recheck');s=await idle();ok('verified',s.ver===true&&/verified/.test(s.msg));
await click('signout');s=await idle('out');ok('signedOut',s.mode==='out'&&(await p.textContent('#macsub')).startsWith('Guest'));
// second user tries the same name
await p.click('#acctb [data-t="new"]');await fill({acun:'dash_27',acem:'b@x.com',acpw:'password2',acpw2:'password2'});await p.check('#acok');await click('create');s=await idle('name');ok('nameTaken',!s.prof&&s.mode==='name'&&/taken/.test(s.err));
await fill({acun:'bob_2'});await click('claim');s=await idle('in');ok('claimOther',s.prof&&s.prof.username==='bob_2');
await click('signout');await idle('out');
// wrong password, then sign in
await fill({acem:'a@x.com',acpw:'wrongpass'});await click('signin');s=await idle();ok('wrongPw',/incorrect/.test(s.err));
await fill({acem:'a@x.com',acpw:'password1'});await click('signin');s=await idle('in');ok('signIn',s.prof&&s.prof.username==='dash_27'&&s.ver);
// reload: known device reconnects, label from memory
await p.reload();await p.waitForTimeout(3500);ok('reloadLabel',(await p.textContent('#macsub')).includes('dash_27'));
await p.evaluate(()=>show('mm'));await p.click('#macct');s=await idle('in');ok('reloadSignedIn',s.mode==='in');
// put a cloud career (admin) so deletion must remove it
const uid=(await (await adm('/usernames/dash_27')).json()).fields.uid.stringValue;
await adm(`/users/${uid}/careers/0?`,{method:'PATCH',body:JSON.stringify({fields:{rev:{integerValue:1}}})});await adm(`/users/${uid}/careers/0/parts/abcdefgh_aaa_0`,{method:'PATCH',body:JSON.stringify({fields:{d:{stringValue:'x'}}})});
await click('delask');await fill({acdty:'dash_2',acdpw:'password1'});await click('del');s=await idle();ok('delTypo',/exactly/.test(s.err));
await fill({acdty:'dash_27',acdpw:'bad'});await click('del');s=await idle();ok('delWrongPw',/incorrect/.test(s.err));
await fill({acdty:'dash_27',acdpw:'password1'});await click('del');s=await idle('out');ok('deleted',s.mode==='out'&&/deleted/.test(s.msg));
const g=async q=>(await adm(q)).status;ok('cloudGone',(await g('/usernames/dash_27'))===404&&(await g(`/users/${uid}`))===404&&(await g(`/users/${uid}/careers/0`))===404&&(await g(`/users/${uid}/careers/0/parts/abcdefgh_aaa_0`))===404);
await fill({acem:'a@x.com',acpw:'password1'});await click('signin');s=await idle();ok('loginGone',/incorrect/.test(s.err));
// reset
await p.click('#acctb [data-t="rst"]');await fill({acem:'b@x.com'});await click('reset');s=await idle();ok('resetSent',/reset link/.test(s.msg));
await fill({acem:'nobody@x.com'});await click('reset');s=await idle();ok('resetNoLeak',/reset link/.test(s.msg)&&!s.err);
ok('localUntouched',(await snap())===before);
ok('noPageErrors',errs.length===0);if(errs.length)console.log(errs);
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})();
