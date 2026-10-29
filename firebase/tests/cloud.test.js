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
let p=await go();p.on('dialog',d=>{R.lastDialog=d.message();(R.dlg=R.dlg||[]).push(d.message());d.accept();});
await p.evaluate(()=>{setInput('kb');pendMode='kb';for(const[i,n]of[[0,'Alpha'],[1,'Bravo']]){SLOT=i;openCre(true);ED.first=n;ED.last='Test';saveCre();}show('mm');});
const st=()=>p.evaluate(()=>{const s=ACCT.state();return{mode:s.mode,err:s.err,msg:s.msg,busy:s.busy};});
const idle=async(m)=>{for(let i=0;i<80;i++){const s=await st();if(!s.busy&&s.mode!=='loading'&&s.mode!=='wait'&&(!m||s.mode===m))return s;await p.waitForTimeout(250);}return st();};
const fill=async o=>{for(const[k,v]of Object.entries(o))await p.fill('#'+k,v);};const click=(a,x='')=>p.click(`#acctb [data-aa="${a}"]${x}`);
await p.click('#macct');await idle('out');await p.click('#acctb [data-t="new"]');await fill({acun:'cloud_1',acem:'c@x.com',acpw:'password1',acpw2:'password1'});await p.check('#acok');await click('create');await idle('in');
ok('noCloudUnverified',(await p.textContent('#acctb')).includes('Verify your email'));
const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email==='c@x.com').oobLink);await click('recheck');await idle();
const uid=(await (await adm('/usernames/cloud_1')).json()).fields.uid.stringValue;const H=async k=>{const r=await adm(`/users/${uid}/careers/${k}`);return r.status===200?(await r.json()).fields:null;};
const parts=async k=>((await (await adm(`/users/${uid}/careers/${k}/parts`)).json()).documents||[]).map(d=>d.name.split('/').pop());
const loc=i=>p.evaluate(i=>{const q=loadProf(i);return q&&{n:q.first,cid:q.cid,cloud:q.cloud,lvl:q.lvl,pad:q.pad?q.pad.length:0};},i);
const snapL=()=>p.evaluate(()=>JSON.stringify([0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i))));
const snapC=async()=>JSON.stringify(await Promise.all([0,1,2,3,4].map(async k=>[await H(k),await parts(k)])));
await click('cload');let s=await idle();ok('cloudEmpty',(await p.textContent('#acctb')).includes('CLOUD CAREERS (0/5)'));
// upload slot 0 -> cloud 0
await click('up','[data-i="0"]');await click('upto','[data-k="0"]');s=await idle();let h=await H(0),l=await loc(0);
ok('upload1',h&&h.rev.integerValue==='1'&&l.cloud&&l.cloud.rev===1&&l.cid===h.careerId.stringValue&&(await parts(0)).length===1&&/Uploaded/.test(s.msg));
// progress locally, upload again: rev 2, old parts gone
await p.evaluate(()=>{const q=loadProf(0);q.lvl=7;saveProf(q);});await click('up','[data-i="0"]');await click('upto','[data-k="0"]');s=await idle();h=await H(0);const pr=await parts(0);
ok('upload2',h.rev.integerValue==='2'&&h.sum.mapValue.fields.lvl.integerValue==='7'&&pr.length===1&&pr[0].startsWith(h.gen.stringValue+'_'));
// big career: 3 parts
await p.evaluate(()=>{const q=loadProf(1);q.pad='x'.repeat(800000);saveProf(q);});await click('up','[data-i="1"]');await click('upto','[data-k="1"]');s=await idle();
ok('splitUpload',(await parts(1)).length===3&&(await H(1)).parts.arrayValue.values.length===3);
// conflict: cloud moved on elsewhere (admin bumps rev)
await adm(`/users/${uid}/careers/0?updateMask.fieldPaths=rev`,{method:'PATCH',body:JSON.stringify({fields:{rev:{integerValue:5}}})});
let before=await snapC();await click('cload');await idle();await p.evaluate(()=>{const q=loadProf(0);q.lvl=9;saveProf(q);});await click('up','[data-i="0"]');await click('upto','[data-k="0"]');s=await idle();
ok('conflictShown',(await p.textContent('#acctb')).includes('VERSION CONFLICT')&&(await snapC())===before);await click('ckx');await idle();
// download into an empty device slot
const blob1=await p.evaluate(()=>{const q=JSON.parse(saveJSON(loadProf(1)));delete q.cloud;delete q.slot;return JSON.stringify(q);});
await p.evaluate(()=>localStorage.removeItem('pafCareer#1'));await click('cload');await idle();await click('down','[data-k="1"]');s=await idle();
const blob2=await p.evaluate(i=>{const q=JSON.parse(saveJSON(loadProf(1)));delete q.cloud;delete q.slot;return JSON.stringify(q);});
ok('download',/Downloaded/.test(s.msg)&&blob1===blob2&&(await loc(1)).pad===800000);
// download over a stale linked device copy (confirm), copy kept for recovery
await click('down','[data-k="0"]');s=await idle();await click('ckc');s=await idle();l=await loc(0);const recN=await p.evaluate(async()=>(await REC.deleted()).length);
ok('downloadReplace',/Replace the device copy/.test(R.lastDialog)&&l.cloud.rev===5&&l.lvl===7&&recN>=1);
ok('uploadAfterSync',await(async()=>{await p.evaluate(()=>{const q=loadProf(0);q.lvl=11;saveProf(q);});await click('up','[data-i="0"]');await click('upto','[data-k="0"]');const s=await idle();return (await H(0)).rev.integerValue==='6'&&!s.err;})());
// damaged cloud save: nothing changes
await adm(`/users/${uid}/careers/1/parts/${(await parts(1))[1]}`,{method:'DELETE'});await p.evaluate(()=>localStorage.removeItem('pafCareer#1'));before=await snapL();
await click('down','[data-k="1"]');s=await idle();ok('damagedRefused',/damaged/.test(s.err)&&(await snapL())===before);
// replace a cloud career with a different one (confirm)
await click('up','[data-i="0"]');await click('upto','[data-k="1"]');s=await idle();h=await H(1);
ok('replaceCloud',R.dlg.slice(-2).join('|').includes('Replace "Bravo')&&/damaged/.test(R.lastDialog)&&h.rev.integerValue==='2'&&h.replaced&&h.sum.mapValue.fields.n.stringValue==='Alpha Test'&&(await parts(1)).length===1);
// delete from cloud
await click('cdel','[data-k="1"]');s=await idle();ok('cloudDelete',!(await H(1))&&(await parts(1)).length===0&&/cleared/.test(s.msg));
// sign out / sign in moves nothing
const L0=await snapL(),C0=await snapC();await click('signout');await idle('out');await fill({acem:'c@x.com',acpw:'password1'});await click('signin');await idle('in');await p.waitForTimeout(1500);
ok('signInMovesNothing',(await snapL())===L0&&(await snapC())===C0);
// deleting the account removes cloud careers, keeps device ones
await click('delask');await fill({acdty:'cloud_1',acdpw:'password1'});await click('del');s=await idle('out');
ok('accountDeleteCloud',!(await H(0))&&(await parts(0)).length===0&&(await snapL())===L0);
ok('noPageErrors',errs.length===0);if(errs.length)console.log(errs);
console.log(Object.values(R).filter(v=>typeof v==='boolean').every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})();
