// Phase B: career ids and Exhibition data (no emulator needed). node exhibition.test.js
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader']});const ctx=await b.newContext();const errs=[];
const go=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1500);return p;};
let p=await go();
// a career saved before ids existed: strip its id, keep the exact text
const old=await p.evaluate(()=>{setInput('kb');pendMode='kb';for(const[i,n]of[[0,'Old'],[1,'New']]){SLOT=i;openCre(true);ED.first=n;ED.last='Test';saveCre();}
 const o=JSON.parse(localStorage.getItem('pafCareer#0'));delete o.cid;const j=JSON.stringify(o);localStorage.setItem('pafCareer#0',j);return j;});
await p.waitForTimeout(1200);await p.reload();await p.waitForTimeout(1500);
let a=await p.evaluate(()=>localStorage.getItem('pafCareer#0'));const ao=JSON.parse(a);
ok('oldCareerGetsId',/^[A-Za-z0-9]{20}$/.test(ao.cid)&&a===old.slice(0,-1)+`,"cid":"${ao.cid}"}`,a.slice(-60));
await p.reload();await p.waitForTimeout(1500);ok('idStableAcrossReloads',(await p.evaluate(()=>JSON.parse(localStorage.getItem('pafCareer#0')).cid))===ao.cid);
const c1=await p.evaluate(()=>loadProf(1).cid);ok('newCareerHasId',/^[A-Za-z0-9]{20}$/.test(c1)&&c1!==ao.cid);
// players are copies
const C0=await p.evaluate(()=>[0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i)).join('|'));
ok('playersListed',await p.evaluate(()=>{const P=EXH.players();return P.length===2&&P[0].slot===0&&P[0].build.first==='Old';}));
await p.evaluate(()=>{const P=EXH.players();P[0].build.att.spd=1;P[0].build.lvl=99;P[0].build.first='Hacked';});
ok('playersAreReadOnlyCopies',(await p.evaluate(()=>[0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i)).join('|')))===C0);
// stats: own key only, no XP
await p.evaluate(cid=>{EXH.record(cid,{opp:'BUF',us:21,them:14,st:{ryd:80,td:1}});EXH.record(cid,{opp:'MIA',us:7,them:10,st:{ryd:20}});},ao.cid);
const s=await p.evaluate(cid=>EXH.stats(cid),ao.cid);
ok('statsRecorded',s.gp===2&&s.w===1&&s.l===1&&s.pf===28&&s.pa===24&&s.st.ryd===100&&s.st.td===1,JSON.stringify(s));
ok('historyNewestFirst',await p.evaluate(cid=>{const h=EXH.history(cid);return h.length===2&&h[0].opp==='MIA'&&h[0].res==='l';},ao.cid));
ok('careersUntouchedByExhibition',(await p.evaluate(()=>[0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i)).join('|')))===C0);
ok('noXpOrProgressChange',await p.evaluate(()=>{const q=loadProf(0);return q.xp===0&&q.lvl===1;}));
// delete the career: it leaves the picker, its results stay
await p.evaluate(()=>{window.confirm=()=>true;slotsUI();document.querySelector('#sgrid [data-del="0"]').click();});await p.waitForTimeout(800);
ok('deletedLeavesPicker',await p.evaluate(()=>EXH.players().length===1&&EXH.players()[0].slot===1));
ok('deletedKeepsResults',await p.evaluate(cid=>EXH.stats(cid).gp===2&&EXH.orphans().includes(cid),ao.cid));
// recovered copy next to its original becomes its own career (no shared id, no shared stats)
await p.evaluate(async()=>{const j=localStorage.getItem('pafCareer#1');await REC.keep(j);slotsUI();});await p.waitForTimeout(600);
await p.evaluate(async()=>{const d=(await REC.deleted()).find(r=>JSON.parse(r.j).first==='New');await recRestore(d.j);});
ok('recoveredDuplicateSplit',await p.evaluate(()=>{const P=EXH.players();return P.length===2&&P[0].cid!==P[1].cid&&P.every(x=>x.build.first==='New');}));
// duplicate ids already on disk are split at boot
await p.evaluate(()=>{const a=JSON.parse(localStorage.getItem('pafCareer#1'));a.slot=3;localStorage.setItem('pafCareer#3',JSON.stringify(a));});await p.waitForTimeout(1200);await p.reload();await p.waitForTimeout(1500);
ok('bootSplitsDuplicates',await p.evaluate(()=>{const c=EXH.players().map(x=>x.cid);return new Set(c).size===c.length&&c.length===3;}));
// damaged exhibition data is ignored, never crashes
await p.evaluate(()=>localStorage.setItem('pafExh','{not json'));ok('damagedExhIgnored',await p.evaluate(()=>EXH.history().length===0&&EXH.record(loadProf(1).cid,{us:3,them:0})&&EXH.stats(loadProf(1).cid).w===1));
ok('noPageErrors',errs.length===0,JSON.stringify(errs));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,500));process.exit(1);});
