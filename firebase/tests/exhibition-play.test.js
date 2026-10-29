// Phase C: play an Exhibition match end to end; the career must not change. node exhibition-play.test.js
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader']});const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.stack.slice(0,600)));
await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1500);
await p.evaluate(()=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first='Exa';ED.last='Mple';saveCre();const q=loadProf(0);q.att.spd=97;q.lvl=12;q.xp=4321;saveProf(q);show('mm');});
await p.waitForTimeout(1200);
const pickPlay=async()=>{for(let i=0;i<10;i++){if(await p.isVisible('#pcards button')){await p.click('#pcards button');return;}await p.waitForTimeout(300);}};
const snap=()=>p.evaluate(()=>JSON.stringify([0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i))));const C0=await snap();
const cid=await p.evaluate(()=>loadProf(0).cid);
await p.evaluate(()=>show('mode'));ok('menuEntry',await p.isVisible('#mexh'));await p.click('#mexh');
ok('pickerListsCareerPlayer',(await p.textContent('#xpl')).includes('Exa Mple')&&await p.isEnabled('#xgo'));
await p.click('#xop [data-o="5"]');ok('opponentPicked',await p.evaluate(()=>XM.op===5));
await p.click('#xgo');await p.waitForTimeout(1500);
ok('matchStartedWithRealBuild',await p.evaluate(()=>!!MATCH&&MATCH.exh===1&&PROF._exh&&player.cur.at.spd===loadProf(0).att.spd&&!!mode));
ok('noXpHud',await p.evaluate(()=>{const e=document.getElementById('xph')||document.querySelector('.xphud');return !e||e.hidden||getComputedStyle(e).display==='none';}));
// mid-match: anything that tries to save the player is refused
ok('midMatchSaveRefused',await p.evaluate(()=>saveProf(PROF)===false));
await pickPlay();await p.evaluate(()=>{MATCH.st.rush=55;MATCH.st.tak=3;SCORE[ORG.you]=14;SCORE[ORG.you==='blue'?'red':'blue']=7;MATCH.clock=0;playState='pre';});
for(let i=0;i<40&&!(await p.isVisible('#exr'));i++){if(await p.isVisible('#pcards button'))await p.click('#pcards button');await p.waitForTimeout(500);}
ok('resultsScreen',await p.isVisible('#exr')&&(await p.textContent('#xres'))==='VICTORY'&&(await p.textContent('#xst')).includes('55'));
const s=await p.evaluate(c=>EXH.stats(c),cid);ok('recordedInExhibition',s&&s.gp===1&&s.w===1&&s.pf===14&&s.pa===7&&s.st.rush===55,JSON.stringify(s));
ok('careerUnchanged',(await snap())===C0);ok('profRestored',await p.evaluate(()=>!PROF||!PROF._exh));
// play again, then quit from the pause menu: no record, career unchanged
await p.click('#xagain');await p.waitForTimeout(1200);ok('playAgain',await p.evaluate(()=>!!MATCH&&MATCH.exh===1));
await p.evaluate(()=>toMenu());await p.waitForTimeout(500);ok('quitNoRecord',await p.evaluate(c=>EXH.stats(c).gp===1&&!MATCH&&(!PROF||!PROF._exh),cid)&&(await snap())===C0);
// career match still awards XP and saves
await p.evaluate(()=>{PROF=loadProf(0);PROF.draft={round:1,pick:1,overall:1,school:'X'};PROF.team=3;lgEnsure(PROF);newSeason(PROF,1);saveProf(PROF);});
await p.evaluate(()=>{preMatch();kickOff();});await p.waitForTimeout(1200);const xp0=await p.evaluate(()=>loadProf(0).xp);
await p.evaluate(()=>endMatch());await p.waitForTimeout(500);   // the career end-of-match path itself (XP, season, save)
ok('careerMatchStillWorks',await p.isVisible('#fin')&&(await p.evaluate(()=>loadProf(0).xp))>xp0&&await p.evaluate(c=>EXH.stats(c).gp===1,cid));
ok('noPageErrors',errs.length===0,JSON.stringify(errs));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,500));process.exit(1);});
