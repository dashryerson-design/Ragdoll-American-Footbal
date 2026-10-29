// 1v1 Runs (Exhibition mode): mode picker, best-player list, roles, real reception counting, first to 5. node runs.test.js
let M_fps=0;const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader']});const p=await b.newPage({viewport:{width:1100,height:700}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1500);
await p.evaluate(()=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first='Runa';ED.last='Wide';saveCre();const q=loadProf(0);q.style=3;saveProf(q);SLOT=1;openCre(true);ED.first='Quinn';ED.last='Back';saveCre();const r=loadProf(1);r.style=0;saveProf(r);show('mode');});
await p.waitForTimeout(1000);const snap=()=>p.evaluate(()=>JSON.stringify([0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i)))+'|'+localStorage.getItem('pafExh'));const C0=await snap();
// mode picker, both ways in and out
await p.click('#mexh');ok('modePickerShown',await p.isVisible('#exm')&&await p.isVisible('#xmteam')&&await p.isVisible('#xmruns'));
await p.click('#xmteam');ok('teamPlayUnchanged',await p.isVisible('#exh')&&(await p.textContent('#xoph'))==='OPPONENT'&&(await p.$$('#xop [data-o]')).length===15);
await p.click('#xback');ok('backToModePicker',await p.isVisible('#exm'));await p.click('#xmback');ok('backToPlayMenu',await p.isVisible('#mode'));
await p.click('#mexh');await p.click('#xmruns');
// the list: one per club, its best non-QB by the game's own ovr(), nothing changed
const chk=await p.evaluate(()=>{const me=EXH.players()[0].build,Lg=lgEnsure(JSON.parse(JSON.stringify(me))),before=JSON.stringify(Lg.pl);const S=runStars(me);
 const exp=CLUBS.map((_,c)=>{let best=null;for(const id of Lg.rost[c]){const P=Lg.pl[id];if(!P||STYLES[P.style][4]==='qb')continue;if(!best||ovr(P.att,P.style)>ovr(best.att,best.style))best=P;}return best&&best.id;});
 const btn=[...document.querySelectorAll('#xop [data-s]')];return{n:S.length,btn:btn.length,match:S.every((s,i)=>s.P.id===exp[s.c]),noQb:S.every(s=>STYLES[s.P.style][4]!=='qb'),uniq:new Set(S.map(s=>s.P.id)).size===S.length,
  shown:btn.every((x,i)=>x.textContent.includes(S[i].P.last)&&x.textContent.includes(String(S[i].o))&&x.textContent.includes(club(S[i].c).ab)&&x.textContent.includes('WR / CB')),same:JSON.stringify(Lg.pl)===before};});
ok('starsOnePerClub',chk.n===16&&chk.btn===16&&chk.uniq,JSON.stringify(chk));ok('starsAreBestNonQb',chk.match&&chk.noQb);ok('starsShowNameTeamPosOvr',chk.shown);ok('ratingsUntouched',chk.same);
// a QB career player cannot play Runs
await p.click('#xpl [data-x]:nth-child(2)');ok('qbBlocked',await p.isDisabled('#xgo')&&/Quarterback builds/.test(await p.textContent('#xrnote')));await p.click('#xpl [data-x]:nth-child(1)');
await p.click('#xop [data-s="5"]');const star=await p.evaluate(()=>runStars(EXH.players()[0].build).find(s=>s.c===5).P);
await p.click('#xgo');await p.waitForTimeout(1500);
const roles=()=>p.evaluate(()=>({n:roster.length,me:player.cur.role,mySide:player.cur.side,qb:roster.filter(d=>d.cur.role==='qb').map(d=>[d.cur.team,d.cur.ai]),op:roster.filter(d=>d!==player&&d.cur.role!=='qb').map(d=>[d.cur.team,d.cur.role,d.cur.kind||'',d.cur.pid,d.cur.ai,d.cur.mark===player]),wr:RUNS.wr,hud:$m('runhud').textContent}));
let r1=await roles();ok('rep1YouAreWR',r1.n===3&&r1.me==='wr'&&r1.mySide==='o'&&r1.qb.length===1&&r1.qb[0][0]==='blue'&&r1.qb[0][1]===true&&r1.op.length===1&&r1.op[0][0]==='red'&&r1.op[0][1]==='df'&&r1.op[0][2]==='man'&&r1.op[0][3]===star.id&&r1.op[0][5],JSON.stringify(r1));
ok('hudShown',/1V1 RUNS/.test(r1.hud)&&/YOU: WR/.test(r1.hud));
// play real reps: spy on the game's own reception event
await p.evaluate(()=>{window.EV=[];const c=RUNS.catch;RUNS.catch=car=>{EV.push({wr:RUNS.wr,side:car.cur.side,role:car.cur.role});c(car);};const n=RUNS.next;RUNS.next=()=>{EV.push({end:1,wr:RUNS.wr,caught:RUNS.caught,before:{...RUNS.c}});n();};});
let r2=null,t0=Date.now();
while(Date.now()-t0<420000){await p.evaluate(()=>{if(playState==='pre'&&RUNS.wr==='me'&&!playEnd)playStart();});const s=await p.evaluate(()=>({reps:EV.filter(e=>e.end).length,c:{...RUNS.c},on:RUNS.on}));if((s.reps>=4&&(s.c.me+s.c.op)>=1)||s.reps>=8||!s.on)break;await p.waitForTimeout(400);}
const ev=await p.evaluate(()=>EV);const ends=ev.filter(e=>e.end);
M_fps=await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();const f=()=>{n++;if(performance.now()-t<2000)requestAnimationFrame(f);else r(n/2);};requestAnimationFrame(f);}));console.log('FPS',M_fps);ok('repsPlayed',ends.length>=2,JSON.stringify(ev));
ok('rolesAlternate',ends.every((e,i)=>e.wr===(i%2?'op':'me')),JSON.stringify(ends.map(e=>e.wr)));
let cm=0,co=0;for(const e of ends){if(e.caught)e.wr==='me'?cm++:co++;}const now=await p.evaluate(()=>({...RUNS.c}));
ok('catchesMatchReceptions',now.me===cm&&now.op===co,JSON.stringify([now,cm,co]));
ok('incompletionsDoNotCount',ends.filter(e=>!e.caught).every((e,i)=>true)&&ends.reduce((n,e)=>n+(e.caught?1:0),0)===now.me+now.op);
ok('onlyOffenceReceptionsCounted',ev.filter(e=>!e.end).every(e=>e.side==='o'&&e.role!=='qb'));
console.log('REPS',JSON.stringify(ends));
r2=await roles();ok('neverAHandoff',await p.evaluate(()=>!roster.some(d=>d.cur.role==='rb')));ok('rolesSwapOnField',(r2.wr==='me')?(r2.me==='wr'&&r2.mySide==='o'):(r2.mySide==='d'&&r2.op.some(o=>o[1]==='wr'&&o[3]===star.id)&&r2.qb[0][0]==='red'),JSON.stringify(r2));
// first to 5: set 4-x and award one more real-path rep end
await p.evaluate(()=>{RUNS.c.me=4;RUNS.c.op=2;RUNS.wr='me';RUNS.caught=true;playEnd=performance.now()-1;});
for(let i=0;i<150&&!(await p.isVisible('#exr'));i++)await p.waitForTimeout(400);
ok('firstToFiveWins',await p.isVisible('#exr')&&(await p.textContent('#xres'))==='VICTORY'&&(await p.textContent('#xrec')).includes('5 – 2')&&(await p.textContent('#exr .vt')).includes('1V1 RUNS'));
ok('hudHiddenAfter',await p.evaluate(()=>$m('runhud').hidden&&!RUNS.on));
ok('nothingSaved',(await snap())===C0);
// the other side can win too
await p.click('#xagain');await p.waitForTimeout(1500);await p.evaluate(()=>{RUNS.c.me=1;RUNS.c.op=4;RUNS.wr='op';RUNS.caught=true;playEnd=performance.now()-1;});
for(let i=0;i<150&&!(await p.isVisible('#exr'));i++)await p.waitForTimeout(400);ok('opponentCanWin',(await p.textContent('#xres'))==='DEFEAT'&&(await p.textContent('#xrec')).includes('1 – 5'));
// quitting mid-match
await p.click('#xagain');await p.waitForTimeout(1200);await p.evaluate(()=>toMenu());ok('quitCleansUp',await p.evaluate(()=>!RUNS.on&&!MATCH&&(!PROF||!PROF._exh)&&$m('runhud').hidden)&&(await snap())===C0);
// Team Play still kicks off a full match afterwards
await p.evaluate(()=>show('mode'));await p.click('#mexh');await p.click('#xmteam');await p.click('#xgo');await p.waitForTimeout(1500);
ok('teamPlayAfterRuns',await p.evaluate(()=>!!MATCH&&!MATCH.runs&&MATCH.exh===1&&ORG.four===true&&$m('runhud').hidden));await p.evaluate(()=>toMenu());
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,3)));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,500));process.exit(1);});
