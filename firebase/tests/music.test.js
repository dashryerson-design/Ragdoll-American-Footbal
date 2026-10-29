// Menu music: plays in menus, never in a match, continues across submenus, two tracks shuffled, one audio element. node music.test.js
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const URL='file://'+path.resolve(__dirname,'../../play/index.html');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1100,height:700}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
await p.addInitScript(()=>{const P=HTMLMediaElement.prototype.play;window.MEDIA=new Set();HTMLMediaElement.prototype.play=function(){MEDIA.add(this);return P.call(this);};});   // count every element that ever plays
await p.goto(URL);await p.waitForTimeout(2500);
const st=()=>p.evaluate(()=>MUSIC.state());const wait=ms=>p.waitForTimeout(ms);
let s=await st();ok('twoTracksEmbedded',await p.evaluate(()=>MUSIC.tracks.length===2&&MUSIC.tracks.every(n=>/^Dark_confident_slick_and_aggressive_Hard_/.test(n))));
ok('startsOnMainMenu',s.playing&&s.track>=0&&s.vol>0,JSON.stringify(s));
// submenus: no restart, time keeps going, same track
const t0=s.t,tr0=s.track,sw0=s.switches;
for(const id of['mode','set','acct','mm','mode']){await p.evaluate(i=>show(i),id);await wait(400);}
await p.evaluate(()=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first='Mu';ED.last='Sic';saveCre();});await wait(300);await p.evaluate(()=>slotsUI());await wait(300);await p.evaluate(()=>show('mode'));await p.click('#mexh');await p.click('#xmruns');await wait(400);await p.click('#xback');await p.click('#xmteam');await wait(400);
s=await st();ok('continuesAcrossSubmenus',s.playing&&s.track===tr0&&s.switches===sw0&&s.t>t0+2,JSON.stringify([t0,s]));
// match: silent from kickoff to the end
await p.click('#xgo');await wait(150);s=await st();ok('stopsAtKickoff',!s.playing&&s.vol===0,JSON.stringify(s));
let loud=0;for(let i=0;i<20;i++){await wait(250);if(await p.evaluate(()=>{if(!$m('pcs').hidden){const b=document.querySelector('#pcards button');b&&b.click();}return !MUSIC.el.paused;}))loud++;}
ok('silentWholeMatch',loud===0);ok('gameplayAudioStillRuns',await p.evaluate(()=>!!CROWD.ctx&&!!MATCH));
const tm=(await st()).t;
await p.evaluate(()=>{MATCH.clock=0;playState='pre';});for(let i=0;i<60&&!(await p.isVisible('#exr'));i++){await p.evaluate(()=>{if(!$m('pcs').hidden){const b=document.querySelector('#pcards button');b&&b.click();}});await wait(400);}
await wait(600);s=await st();ok('resumesAfterMatch',await p.isVisible('#exr')&&s.playing&&s.track===tr0&&Math.abs(s.t-tm)<2.5,JSON.stringify([tm,s]));
// quitting from the pause menu path (toMenu) and quick play, several times: never a second music element
for(let k=0;k<3;k++){await p.evaluate(()=>{XM.mode=XM.mode==='runs'?'team':'runs';exhUI();exhGo();});await wait(500);ok('offInMatch'+k,!(await st()).playing);await p.evaluate(()=>toMenu());await wait(600);ok('backOn'+k,(await st()).playing);}
await p.evaluate(()=>{show('mode');$m('mquick').onclick();});await wait(300);ok('offInQuickPlay',!(await st()).playing);await p.evaluate(()=>toMenu());await wait(500);
ok('oneMusicElement',await p.evaluate(()=>[...MEDIA].filter(e=>e.src.startsWith('data:audio/mpeg')&&e.duration>60).length===1),await p.evaluate(()=>MEDIA.size));
// tracks: end of one starts the other (2 tracks: never the same twice in a row)
const seen=[];for(let k=0;k<4;k++){const a=await st();seen.push(a.track);await p.evaluate(()=>{MUSIC.el.currentTime=MUSIC.el.duration-.3;});for(let i=0;i<30;i++){await wait(200);const c=await st();if(c.track!==a.track||c.switches!==a.switches)break;}}
s=await st();seen.push(s.track);ok('tracksAlternateOnEnd',seen.every((x,i)=>i===0||x!==seen[i-1])&&new Set(seen).size===2&&s.playing,JSON.stringify(seen));
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,3)));
// browsers that block autoplay: waits quietly, starts on the first click
const b2=await chromium.launch({args:['--use-gl=swiftshader','--autoplay-policy=document-user-activation-required']});const q=await b2.newPage();await q.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));const e2=[];q.on('pageerror',e=>e2.push(e.message));
await q.goto(URL);await q.waitForTimeout(2500);const bl=await q.evaluate(()=>MUSIC.state());ok('autoplayBlockedHandled',!bl.playing&&bl.blocked&&!e2.length,JSON.stringify(bl));
await q.mouse.click(5,5);await q.waitForTimeout(800);ok('startsAfterFirstClick',(await q.evaluate(()=>MUSIC.state())).playing);await b2.close();
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,500));process.exit(1);});
