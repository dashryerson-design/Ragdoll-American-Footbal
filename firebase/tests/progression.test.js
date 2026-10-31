// Account Level: curve + reward table, XP only at real final whistles (once, capped, not for short or quit matches), level-up reveal,
// ownership vs equipped, Locker in the Player Hub, cosmetics only on your own player (ball trail never on an AI QB's throw),
// Progression page. No emulator needed: node progression.test.js
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/';
const R={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1800);
const ev=f=>p.evaluate(f);const wait=ms=>p.waitForTimeout(ms);
// ---- table + curve
const tb=await ev(()=>{const lv=new Set(PROG.R.map(r=>r[0])),ids=Object.keys(PROG.ITEMS);return{levels:lv.size,all:[...Array(100).keys()].every(i=>lv.has(i+1)&&PROG.R.find(r=>r[0]===i+1)[1].length>=1),
 uniq:new Set(ids).size===ids.length,ids:ids.every(i=>/^[a-z0-9-]{1,16}$/.test(i)),n:ids.length,l100:PROG.R.find(r=>r[0]===100)[1].length,cum:PROG.CUM[100],first:PROG.need(1),last:PROG.need(99),
 types:[...new Set(Object.values(PROG.ITEMS).map(i=>i.t))].length,bt:Object.values(PROG.ITEMS).filter(i=>i.t==='bt').length,rt:Object.values(PROG.ITEMS).filter(i=>i.t==='rt').length};});
ok('everyLevelHasAReward',tb.levels===100&&tb.all,JSON.stringify(tb));ok('rewardIdsUniqueAndShort',tb.uniq&&tb.ids);ok('level100IsASet',tb.l100>=10);
ok('curveGrows',tb.first<500&&tb.last>tb.first*10&&tb.cum>300000,JSON.stringify(tb));ok('varietyOfRewards',tb.types>=14&&tb.bt>=12&&tb.rt>=12);
// ---- a career player to play with (a QB, so we can throw)
await ev(()=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first='Prog';ED.last='Test';saveCre();const q=loadProf(0);q.style=0;saveProf(q);PROF=loadProf(0);});
const C0=await ev(()=>localStorage.getItem('pafCareer#0'));
ok('startsAtLevelOne',await ev(()=>PROG.level()===1&&PROG.total()===0));
// ---- a short match earns nothing; quitting earns nothing
await ev(()=>{show('mode');});await p.click('#mexh');await p.click('#xmteam');await p.click('#xgo');await wait(1500);
await ev(()=>{const b=document.querySelector('#pcards button');if(b)b.click();});await wait(600);await ev(()=>toMenu());await wait(300);
ok('quitEarnsNothing',await ev(()=>PROG.total()===0));
await ev(()=>{exhUI();});await p.click('#xgo');await wait(1500);await ev(()=>{const b=document.querySelector('#pcards button');if(b)b.click();MATCH.clock=0;playState='pre';});
for(let i=0;i<40&&!(await p.isVisible('#exr'));i++){await ev(()=>{const b=document.querySelector('#pcards button');if(b&&!$m('pcs').hidden)b.click();});await wait(400);}
ok('shortMatchEarnsNothing',await ev(()=>PROG.total()===0)&&/too short/.test(await p.textContent('#acxp')));
// ---- a real match: completion + win + stats, capped
await ev(()=>{window.PAF_XPTEST=1;exhUI();});await p.click('#xgo');await wait(1500);
await ev(()=>{const b=document.querySelector('#pcards button');if(b)b.click();MATCH.st.comp=40;MATCH.st.ptd=9;MATCH.st.int=1;SCORE[ORG.you]=21;MATCH.clock=0;playState='pre';});
for(let i=0;i<40&&!(await p.isVisible('#exr'));i++){await ev(()=>{const b=document.querySelector('#pcards button');if(b&&!$m('pcs').hidden)b.click();});await wait(400);}
const g1=await ev(()=>({x:PROG.total(),log:JSON.parse(localStorage.getItem('pafProg')).log[0]}));
ok('realMatchEarnsXP',g1.x>=100+120+15*6+40*4+60,JSON.stringify(g1));ok('statsAreCapped',g1.x<=100+120+15*6+40*4+60*1+100+60,JSON.stringify(g1));
ok('xpBannerShown',await p.isVisible('#acxp')&&/ACCOUNT XP/.test(await p.textContent('#acxp')));
ok('careerSaveUntouched',(await ev(()=>localStorage.getItem('pafCareer#0')))===C0);
// the same match id cannot pay twice
ok('noDoublePay',await ev(()=>{const id=JSON.parse(localStorage.getItem('pafProg')).ids.slice(-1)[0],x=PROG.total();PROG.award({id,mode:'exh',r:'w'});return PROG.total()===x;}));
// ---- level-up reveal
await ev(()=>{const o=JSON.parse(localStorage.getItem('pafProg'));o.xp=PROG.CUM[10]-50;localStorage.setItem('pafProg',JSON.stringify(o));});
await ev(()=>PROG.award({id:'t-lvl',mode:'exh',r:'w'}));
ok('levelUpReveal',await ev(()=>PROG.level()===10&&!$m('lvlup').hidden&&/Electric Blue/.test($m('lvlup').textContent)),await ev(()=>PROG.level()));
await p.click('#lvlup [data-pg="close"]');
// ---- ownership vs equipped
ok('cannotEquipLocked',await ev(async()=>!(await PROG.setEq('bt','b-cent'))&&!PROG.eqd().bt));
ok('equipOwned',await ev(async()=>(await PROG.setEq('bt','b-electric'))&&PROG.eqd().bt==='b-electric'&&PROG.equipped('bt').id==='b-electric'));
ok('ownershipFromLevel',await ev(()=>PROG.owns('b-electric')&&PROG.owns('g-crimson')&&!PROG.owns('g-ice')));
// ---- Locker in the Player Hub
await ev(()=>{NAVFROM='mm';show('car');HTAB='locker';hubUI();});await wait(400);
ok('lockerTab',await ev(()=>/LOCKER/.test($m('hmain').textContent)&&document.querySelectorAll('#hmain .lki').length>=Object.keys(PROG.ITEMS).length-20));
await p.click('#hmain .lki[data-id="g-crimson"]');await wait(300);
ok('equipGlovesFromLocker',await ev(()=>PROG.eqd().gl==='g-crimson'&&!!document.querySelector('#hmain .lki.on[data-id="g-crimson"]')));
// ---- cosmetics on your player only
await ev(()=>{show('mode');});await p.click('#mexh');await p.click('#xmteam');await p.click('#xgo');await wait(1800);
const gl=await ev(()=>{const hc=m=>m.map&&m.userData.bc!=null?m.userData.bc:m.color.getHex(),mine=hc(player.parts.hand1.mesh.material),ai=roster.filter(d=>d!==player).map(d=>d.parts&&d.parts.hand1?hc(d.parts.hand1.mesh.material):null);   // a textured glove keeps its colour in userData.bcreturn{mine,ai,want:0xc8102e,isMine:player.cur.mine};});
ok('glovesOnYourPlayer',gl.mine===gl.want&&gl.isMine,JSON.stringify(gl));ok('notOnOtherPlayers',gl.ai.every(c=>c!==gl.want),JSON.stringify(gl));
// your throw: trail particles; an AI QB's throw: none
const lit=()=>ev(()=>{let n=0;const C=PROG._fx&&PROG._fx();return C;});
const trail=await ev(async()=>{const fx=()=>{let n=0;scene.traverse(o=>{if(o.isPoints&&o.material.blending===THREE.AdditiveBlending&&o.geometry.attributes.color){const c=o.geometry.attributes.color.array;for(let i=0;i<c.length;i++)if(c[i]>0.01){n++;break;}}});return n;};
 const b0=fx();use(player);if(!held)grabBall();aimOn=true;thr=0;await new Promise(r=>setTimeout(r,2500));const mine=PASS&&PASS.by===player,b1=fx();return{b0,b1,mine};});
ok('ballTrailOnYourThrow',trail.mine&&trail.b1>trail.b0,JSON.stringify(trail));
const ai=await ev(async()=>{const q=roster.find(d=>d!==player);const fx=()=>{let n=0;scene.traverse(o=>{if(o.isPoints&&o.material.blending===THREE.AdditiveBlending&&o.geometry.attributes.color&&o.geometry.attributes.color.array.length===420){const c=o.geometry.attributes.color.array;for(let i=0;i<c.length;i++)if(c[i]>0.01)n++;}});return n;};
 await new Promise(r=>setTimeout(r,1500));const before=fx();window.__PASS=PASS;PASS={by:q,tg:null};ball.velocity.set(10,5,0);if(!world.bodies.includes(ball))world.addBody(ball);held=false;await new Promise(r=>setTimeout(r,800));const after=fx();return{before,after};});
ok('noTrailOnAiThrow',ai.after<=ai.before,JSON.stringify(ai));
await ev(()=>toMenu());
// ---- the Progression page
await ev(()=>PROG.open());await wait(500);
const pg=await ev(()=>({tiles:document.querySelectorAll('#pgtrack .pgt').length,own:document.querySelectorAll('#pgtrack .pgt.own').length,lock:document.querySelectorAll('#pgtrack .pgt.lock').length,cur:!!document.querySelector('#pgtrack .pgt.cur[data-lv="10"]'),ms:document.querySelectorAll('#pgtrack .pgt.ms').length,lvl:document.querySelector('.pglv b').textContent,cent:/CENTURION/.test($m('progb').textContent)}));
ok('progressionPage',pg.tiles===100&&pg.own===10&&pg.lock===90&&pg.cur&&pg.ms===20&&pg.lvl==='10'&&pg.cent,JSON.stringify(pg));
await p.click('#pgtrack .pgt[data-lv="100"]');await wait(300);ok('levelDetail',/Centurion Trail/.test(await p.textContent('.pgdet'))&&/Reach level 100/.test(await p.textContent('.pgdet')));
ok('trailPreview',await ev(()=>!!document.querySelector('.pgdet canvas.pgfx')));
ok('menuLevelChip',await ev(()=>{show('mm');return /LV 10/.test($m('mmlvl').textContent);}));
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,3)));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
