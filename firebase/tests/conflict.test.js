const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const adm=(path,opt={})=>fetch(FS+path,{...opt,headers:{Authorization:'Bearer owner','Content-Type':'application/json'}});
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader']});const errs=[];
const dev=async(name)=>{const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
 await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080};});
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(2000);
 const D={p,ctx,ans:true,dlg:[]};p.on('dialog',d=>{D.dlg.push(d.message());D.ans?d.accept():d.dismiss();});
 D.st=()=>p.evaluate(()=>{const s=ACCT.state();return{mode:s.mode,err:s.err,msg:s.msg,busy:s.busy};});
 D.idle=async m=>{for(let i=0;i<200;i++){const s=await D.st();if(!s.busy&&s.mode!=='loading'&&s.mode!=='wait'&&(!m||s.mode===m))return s;await p.waitForTimeout(200);}return D.st();};
 D.fill=async o=>{for(const[k,v]of Object.entries(o))await p.fill('#'+k,v);};D.click=(a,x='')=>p.click(`#acctb [data-aa="${a}"]${x}`);
 D.act=async(a,x)=>{await D.click(a,x);return D.idle();};
 D.up=async(i,k)=>{await D.click('up',`[data-i="${i}"]`);return D.act('upto',`[data-k="${k}"]`);};
 D.loc=i=>p.evaluate(i=>{const q=loadProf(i);return q&&{n:q.first,cid:q.cid,cloud:q.cloud,lvl:q.lvl};},i);
 D.set=(i,lvl)=>p.evaluate(([i,lvl])=>{const q=loadProf(i);q.lvl=lvl;saveProf(q);},[i,lvl]);
 D.snap=()=>p.evaluate(()=>JSON.stringify([0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i))));
 D.rec=()=>p.evaluate(async()=>(await REC.deleted()).map(r=>{try{return JSON.parse(r.j).lvl;}catch(e){return null;}}));
 D.text=()=>p.textContent('#acctb');D.inj=f=>p.evaluate(f);
 D.heal=()=>p.evaluate(()=>{const F=ACCT._fb().F;for(const k of Object.keys(F))if(k.startsWith('_o_')){F[k.slice(3)]=F[k];delete F[k];}});
 return D;};
const A=await dev('A'),B=await dev('B');
await A.p.evaluate(()=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first='Xavi';ED.last='Test';saveCre();show('mm');});
await B.p.evaluate(()=>{setInput('kb');pendMode='kb';show('mm');});
await A.p.click('#macct');await A.idle('out');await A.p.click('#acctb [data-t="new"]');await A.fill({acun:'two_dev',acem:'t@x.com',acpw:'password1',acpw2:'password1'});await A.p.check('#acok');await A.act('create');
const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email==='t@x.com').oobLink);await A.act('recheck');
const uid=(await (await adm('/usernames/two_dev')).json()).fields.uid.stringValue;
const H=async k=>{const r=await adm(`/users/${uid}/careers/${k}`);return r.status===200?(await r.json()).fields:null;};
const rev=async k=>{const h=await H(k);return h?+h.rev.integerValue:0;};
const parts=async k=>((await (await adm(`/users/${uid}/careers/${k}/parts`)).json()).documents||[]).map(d=>d.name.split('/').pop());
const snapC=async()=>JSON.stringify(await Promise.all([0,1,2,3,4].map(async k=>[await H(k),await parts(k)])));
const headOk=async k=>{const h=await H(k),ps=await parts(k);return !h||h.parts.arrayValue.values.every(v=>ps.includes(v.stringValue));};
// B signs in on a second device: opening the screen and signing in moves nothing
const B0=await B.snap();await B.p.click('#macct');await B.idle('out');await B.fill({acem:'t@x.com',acpw:'password1'});await B.act('signin');await B.p.waitForTimeout(800);
await A.act('cload');let s=await A.up(0,0);ok('setupUpload',(await rev(0))===1,s.err);
const C0=await snapC();await B.act('cload');ok('openAndSignInMoveNothing',(await B.snap())===B0&&(await snapC())===C0);
s=await B.act('down','[data-k="0"]');ok('bDownloads',(await B.loc(0)).cloud.rev===1,s.err);
// ---- 1. conflict: A uploads a newer revision, B changed its copy too
await A.set(0,10);s=await A.up(0,0);await B.set(0,20);s=await B.up(0,0);const t1=await B.text();
ok('1 conflictShown',t1.includes('VERSION CONFLICT')&&/Level\s*20\s*10/.test(t1.replace(/<[^>]*>/g,' '))&&t1.includes('rev 2')&&t1.includes('synced rev 1 + changes'),t1.slice(0,400));
// ---- 4. cancel an overwrite (dismiss the confirm), then the Cancel button
let C1=await snapC(),Bs=await B.snap();B.ans=false;s=await B.act('ckl');B.ans=true;ok('4 cancelConfirm',(await snapC())===C1&&(await B.snap())===Bs&&(await B.text()).includes('VERSION CONFLICT'));
s=await B.act('ckx');ok('4 cancelButton',/nothing was changed/.test(s.msg)&&(await snapC())===C1&&(await B.snap())===Bs);
// ---- 3. keep local (explicit confirm), with the cloud copy backed up first
await B.up(0,0);s=await B.act('ckl');ok('3 keepLocal',(await rev(0))===3&&(await H(0)).sum.mapValue.fields.lvl.integerValue==='20'&&(await B.loc(0)).cloud.rev===3&&/Replace the cloud version/.test(B.dlg.at(-1)),s.err);
ok('12 recoveryBeforeCloudReplace',(await B.rec()).includes(10));ok('headIntact3',await headOk(0));
// ---- 2. keep cloud on A (A changed too)
await A.set(0,11);await A.act('cload');s=await A.up(0,0);ok('2a conflictOnA',(await A.text()).includes('VERSION CONFLICT'));
s=await A.act('ckc');const la=await A.loc(0);ok('2 keepCloud',la.lvl===20&&la.cloud.rev===3&&(await rev(0))===3,s.err);ok('12 recoveryBeforeLocalReplace',(await A.rec()).includes(11));
// ---- 5. keep both with a free device slot
await A.set(0,30);await A.up(0,0);await B.set(0,31);await B.up(0,0);C1=await snapC();s=await B.act('ckb');
const b0=await B.loc(0),b1=await B.loc(1);ok('5 keepBothLocal',b0.lvl===31&&!b0.cloud&&b1&&b1.lvl===30&&b1.cloud.rev===4&&b0.cid!==b1.cid&&(await snapC())===C1,JSON.stringify([b0,b1,s]));
// ---- 6. no free slot anywhere, then a free cloud slot
await B.p.evaluate(()=>{const j=saveJSON(loadProf(0));for(const i of[2,3,4]){const q=JSON.parse(j);q.cid='fill'+i;q.cloud=null;q.slot=i;saveProf(q);}});
const fake=n=>JSON.stringify({fields:{careerId:{stringValue:'fake'+n},rev:{integerValue:1},gen:{stringValue:'fakegen0'+n},parts:{arrayValue:{values:[{stringValue:'fakegen0'+n+'_car_0'}]}},fmt:{integerValue:2},gameVer:{stringValue:'x'},sum:{mapValue:{fields:{n:{stringValue:'Filler '+n},lvl:{integerValue:1},ovr:{integerValue:50},len:{integerValue:1},h:{stringValue:'x'}}}}}});
for(const k of[1,2,3,4])await adm(`/users/${uid}/careers/${k}`,{method:'PATCH',body:fake(k)});
await B.set(1,32);await A.set(0,33);await A.act('cload');await A.up(0,0);await B.act('cload');s=await B.up(1,0);ok('6a conflict',(await B.text()).includes('VERSION CONFLICT'));
C1=await snapC();Bs=await B.snap();s=await B.act('ckb');ok('6 noFreeSlot',/No free slot/.test(s.err)&&(await snapC())===C1&&(await B.snap())===Bs&&(await B.text()).includes('VERSION CONFLICT'),s.err);
await adm(`/users/${uid}/careers/4`,{method:'DELETE'});const h0=await H(0);s=await B.act('ckb');const h4=await H(4);
ok('6 keepBothCloud',h4&&h4.sum.mapValue.fields.lvl.integerValue==='32'&&JSON.stringify(await H(0))===JSON.stringify(h0)&&(await B.loc(1)).cid===h4.careerId.stringValue,s.err);
for(const k of[1,2,3])await adm(`/users/${uid}/careers/${k}`,{method:'DELETE'});
// reset B to a clean linked copy of cloud slot 0
await B.p.evaluate(()=>{for(const i of[0,1,2,3,4])localStorage.removeItem('pafCareer#'+i);});await B.act('cload');await B.act('down','[data-k="0"]');
// ---- 7. two devices upload at the same moment
await A.set(0,40);await B.set(0,41);const r0=await rev(0);await Promise.all([A.click('up','[data-i="0"]'),B.click('up','[data-i="0"]')]);
await Promise.all([A.click('upto','[data-k="0"]'),B.click('upto','[data-k="0"]')]);const [sa,sb]=await Promise.all([A.idle(),B.idle()]);
const ta=await A.text(),tb=await B.text(),winA=/Uploaded/.test(sa.msg),winB=/Uploaded/.test(sb.msg);
ok('7 concurrent',(await rev(0))===r0+1&&(winA!==winB)&&(winA?tb:ta).includes('VERSION CONFLICT')&&await headOk(0),JSON.stringify([sa,sb]));
const L7=winA?B:A,W7=winA?A:B;await L7.act('ckx');
// ---- 8. the cloud changes between the conflict screen and the confirm
await W7.set(0,50);await L7.up(0,0);ok('8a conflict',(await L7.text()).includes('VERSION CONFLICT'));await W7.up(0,0);const r8=await rev(0);C1=await snapC();
s=await L7.act('ckl');ok('8 raceAfterConfirm',/changed again/.test(s.err)&&(await snapC())===C1&&(await L7.text()).includes('rev '+r8),s.err);
// ---- 9. interrupted upload during conflict resolution (part write fails), then the commit fails
await L7.inj(()=>{const F=ACCT._fb().F;F._o_setDoc=F.setDoc;let n=0;F.setDoc=(...a)=>++n>1?Promise.reject({code:'unavailable'}):F._o_setDoc(...a);});
await L7.p.evaluate(()=>{const q=loadProf(0);q.pad='y'.repeat(800000);saveProf(q);});C1=await snapC();const Ls=await L7.snap();
s=await L7.act('ckl');await L7.heal();ok('9 interruptedParts',/unreachable/.test(s.err)&&(await snapC())===C1&&(await L7.snap())===Ls,s.err);
await L7.inj(()=>{const F=ACCT._fb().F;F._o_runTransaction=F.runTransaction;F.runTransaction=()=>Promise.reject({code:'unavailable'});});
s=await L7.act('ckl');await L7.heal();ok('9 interruptedCommit',/unreachable/.test(s.err)&&(await snapC())===C1&&await headOk(0),s.err);
// previous cloud version still downloads fine on the other device
await W7.p.evaluate(()=>localStorage.removeItem('pafCareer#0'));s=await W7.act('down','[data-k="0"]');ok('9 previousIntact',(await W7.loc(0)).lvl===50,s.err);
// ---- 11. failed download (parts unreadable) leaves the device career untouched; 12b recovery failure refuses
await L7.inj(()=>{const F=ACCT._fb().F;F._o_getDocFromServer=F.getDocFromServer;F.getDocFromServer=r=>r.path.includes('/parts/')?Promise.reject({code:'unavailable'}):F._o_getDocFromServer(r);});
const L11=await L7.snap();s=await L7.act('ckc');await L7.heal();ok('11 failedDownload',/unreachable/.test(s.err)&&(await L7.snap())===L11,s.err);
await L7.inj(()=>{REC._k=REC.keep;REC.keep=async()=>false;});s=await L7.act('ckc');await L7.inj(()=>{REC.keep=REC._k;});ok('12 recoveryFailRefuses',/recovery copy could not/.test(s.err)&&(await L7.snap())===L11,s.err);
// ---- 10. damaged cloud save inside a conflict: keep cloud refused, device untouched
const p0=(await parts(0))[0];const keepPart=await (await adm(`/users/${uid}/careers/0/parts/${p0}`)).text();await adm(`/users/${uid}/careers/0/parts/${p0}`,{method:'DELETE'});
s=await L7.act('ckc');ok('10 damagedInConflict',/damaged/.test(s.err)&&(await L7.snap())===L11,s.err);
await adm(`/users/${uid}/careers/0/parts/${p0}`,{method:'PATCH',body:JSON.stringify({fields:JSON.parse(keepPart).fields})});
// ---- 14. quota exhausted
await L7.inj(()=>{const F=ACCT._fb().F;F._o_setDoc=F.setDoc;F.setDoc=()=>Promise.reject({code:'resource-exhausted'});});C1=await snapC();
s=await L7.act('ckl');await L7.heal();ok('14 quota',/limit/.test(s.err)&&(await snapC())===C1&&(await L7.snap())===L11,s.err);
// ---- 15. offline, then retry
await L7.ctx.setOffline(true);const t15=Date.now();s=await L7.act('ckc');const took=Date.now()-t15;await L7.ctx.setOffline(false);
ok('15 offlineFails',/unreachable|connection/.test(s.err)&&(await L7.snap())===L11,s.err+' '+took+'ms');
await L7.p.waitForTimeout(3000);s=await L7.act('ckc');ok('15 retryWorks',(await L7.loc(0)).lvl===50&&/Kept the cloud/.test(s.msg),JSON.stringify(s));
// ---- 17. hostile cloud fields are shown as text, never run
const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);};
const evil=JSON.stringify({fields:{careerId:{stringValue:'evil'},rev:{integerValue:1},gen:{stringValue:'evilgen01'},parts:{arrayValue:{values:[{stringValue:'evilgen01_car_0'}]}},fmt:{integerValue:2},gameVer:{stringValue:'x'},sum:{mapValue:{fields:{n:{stringValue:'<img src=x onerror="window.XSS=1">'},lvl:{stringValue:'<b id=pwn>'},ovr:{stringValue:'<i id=pwn2>'},team:{stringValue:'<svg onload=window.XSS=2>'}}}}}});
await adm(`/users/${uid}/careers/3`,{method:'PATCH',body:evil});await L7.act('cload');
ok('17 noInjection',await L7.p.evaluate(()=>!window.XSS&&!document.querySelector('#acctb img,#acctb #pwn,#acctb #pwn2,#acctb svg'))&&(await L7.text()).includes('<img src=x'));
// ---- 18. a save from a newer game version is refused, device untouched
const fut=JSON.stringify({v:1,sv:99,first:'Future',last:'Kid'});
await adm(`/users/${uid}/careers/3/parts/evilgen01_car_0`,{method:'PATCH',body:JSON.stringify({fields:{d:{stringValue:fut}}})});
await adm(`/users/${uid}/careers/3`,{method:'PATCH',body:JSON.stringify({fields:{...JSON.parse(evil).fields,sum:{mapValue:{fields:{n:{stringValue:'Future Kid'},len:{integerValue:fut.length},h:{stringValue:fnv(fut)}}}}}})});
const L18=await L7.snap();s=await L7.act('down','[data-k="3"]');ok('18 newerFormatRefused',/newer version/.test(s.err)&&(await L7.snap())===L18,s.err);
await adm(`/users/${uid}/careers/3`,{method:'DELETE'});await adm(`/users/${uid}/careers/3/parts/evilgen01_car_0`,{method:'DELETE'});
// ---- cloud delete leaves device careers
const Lw=await W7.snap();await W7.act('cload');s=await W7.act('cdel','[data-k="0"]');ok('cloudDeleteKeepsLocal',!(await H(0))&&(await parts(0)).length===0&&(await W7.snap())===Lw&&!!(await W7.loc(0)),s.err);
// ---- 13. account deletion interrupted partway, then retried
await W7.act('cload');await W7.up(0,0);await W7.up(0,1);
await W7.inj(()=>{const F=ACCT._fb().F;F._o_deleteDoc=F.deleteDoc;let n=0;F.deleteDoc=(...a)=>++n>2?Promise.reject({code:'unavailable'}):F._o_deleteDoc(...a);});
await W7.act('delask');await W7.fill({acdty:'two_dev',acdpw:'password1'});s=await W7.act('del');await W7.heal();
const prof=(await adm(`/users/${uid}`)).status;ok('13 interruptedDelete',/unreachable/.test(s.err)&&!/deleted/.test(s.msg)&&prof===200&&s.mode!=='out',JSON.stringify(s));
await W7.p.reload();await W7.p.waitForTimeout(3000);await W7.p.evaluate(()=>show('mm'));await W7.p.click('#macct');s=await W7.idle();ok('13 resumePrompt',s.mode==='del'&&(await W7.text()).includes('did not finish'),JSON.stringify(s));
await W7.fill({acdty:'two_dev',acdpw:'password1'});s=await W7.act('del');
ok('13 retryDelete',s.mode==='out'&&/deleted/.test(s.msg)&&(await adm(`/users/${uid}`)).status===404&&(await adm('/usernames/two_dev')).status===404&&!(await H(0))&&!(await H(1))&&(await parts(0)).length+(await parts(1)).length===0&&!!(await W7.loc(0)),JSON.stringify(s));
ok('noPageErrors',errs.length===0,JSON.stringify(errs));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,500));process.exit(1);});
