// Online play: two separate browser contexts, two accounts, their own career saves, a real WebRTC connection (loopback) through the Auth + Firestore
// emulators. Covers the lobby, online 1v1 Runs, online Exhibition (both career teams, remote play calling, a remote QB throw), a dropped connection
// with reconnect, a stranger trying to take the seat, forged guest messages and save integrity.
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={},M={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const adm=(q,opt={})=>fetch(FS+q,{...opt,headers:{Authorization:'Bearer owner','Content-Type':'application/json'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const until=async(f,ms=20000)=>{const t=Date.now();while(Date.now()-t<ms){try{if(await f())return true;}catch(e){}await sleep(300);}return false;};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--disable-features=WebRtcHideLocalIpsWithMdns','--autoplay-policy=no-user-gesture-required']});const errs=[];
const dev=async(name,email,saves)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
 await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080};window.PAF_ICE=[];});
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(1800);
 await p.evaluate(S=>{setInput('kb');pendMode='kb';S.forEach(([first,style,team],i)=>{SLOT=i;openCre(true);ED.first=first;ED.last='Net'+'AB'[i];saveCre();const q=loadProf(i);q.style=style;if(team!=null){q.draft={round:1,pick:1,overall:1,school:'X'};q.team=team;}saveProf(q);});show('mm');},saves);await p.waitForTimeout(900);
 const idle=async()=>{for(let i=0;i<80;i++){const s=await p.evaluate(()=>{const s=ACCT.state();return s.busy||s.mode==='loading'||s.mode==='wait';});if(!s)return;await p.waitForTimeout(200);}};
 await p.click('#macct');await idle();await p.click('#acctb [data-t="new"]');for(const[k,v]of Object.entries({acun:name.toLowerCase()+'_net',acem:email,acpw:'password1',acpw2:'password1'}))await p.fill('#'+k,v);await p.check('#acok');await p.click('#acctb [data-aa="create"]');await idle();
 const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email===email).oobLink);await p.click('#acctb [data-aa="recheck"]');await idle();
 await p.evaluate(()=>show('mode'));await p.click('#mnet');
 const snap=()=>p.evaluate(()=>JSON.stringify([0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i)))+'|'+localStorage.getItem('pafExh'));
 const nb=sel=>p.click('#netb '+sel);
 return{p,ctx,snap,nb};};
// host: one WR career (club 3); guest: a WR career (club 7) for Runs and a QB career (club 7) for Exhibition
const H=await dev('Hosty','h@x.com',[['Hosty',2,3]]),G=await dev('Guesty','g@x.com',[['Guesty',3,7],['Gqb',0,7]]);const H0=await H.snap(),G0=await G.snap();
ok('onlineMenu',await H.p.isVisible('#net')&&(await H.p.textContent('#netb')).includes('1V1 RUNS')&&(await H.p.textContent('#netb')).includes('EXHIBITION'));
// ---- lobby
await H.nb('[data-nm="runs"]');await H.nb('#nethost');let code=null;await until(async()=>(code=await H.p.evaluate(()=>NET.phase==='waiting'&&NET.code))&&true);
ok('hostWaiting',/^[A-Z2-9]{6}$/.test(code)&&(await H.p.textContent('#netb')).includes('Waiting for opponent')&&(await H.p.textContent('#netcodev'))===code,code);
await G.p.fill('#netcode',code);await G.nb('#netjoin');
ok('bothInLobby',await until(()=>H.p.evaluate(()=>NET.phase==='lobby')&&G.p.evaluate(()=>NET.phase==='lobby')));
ok('hostSeesOpponent',(await H.p.textContent('#netb')).includes('Opponent connected')&&(await H.p.textContent('#netb')).includes('guesty_net')&&(await H.p.textContent('#netb')).includes('Guesty NetA'));
ok('guestSeesModeAndHost',(await G.p.textContent('#netb')).includes('1V1 RUNS')&&(await G.p.textContent('#netb')).includes('hosty_net')&&(await G.p.textContent('#netb')).includes('Waiting for the host to start'));
ok('roomDeletedAfterJoin',(await adm('/rooms/'+code)).status===404);
// guest leaves before the start: host goes back to waiting on the same code, guest can come back
await G.nb('#netleave');ok('guestLeftLobby',await until(()=>H.p.evaluate(()=>NET.phase==='waiting'&&!NET.peer))&&await G.p.evaluate(()=>NET.phase==='idle'));
await until(async()=>(await adm('/rooms/'+code)).status===200,10000);await G.p.fill('#netcode',code);await G.nb('#netjoin');ok('rejoinLobby',await until(()=>H.p.evaluate(()=>NET.phase==='lobby')));
// ---- online 1v1 Runs
await H.nb('#netstart');ok('runsStarted',await until(()=>H.p.evaluate(()=>!!MATCH&&MATCH.mp===1&&MATCH.runs===1&&RUNS.on)&&G.p.evaluate(()=>NET.on&&NET.st.snaps>5),40000));
ok('runsGuestIsRedReceiverCorner',await until(()=>H.p.evaluate(()=>{const d=NET.rd;return !!d&&d.cur.team==='red'&&d.cur.role!=='qb'&&d.cur.ai===false&&d.cur.pid==='NET'&&d.cur.nm==='NetA';}),10000));
ok('runsGuestHud',await until(async()=>/1V1 RUNS · YOU 0 – 0/.test(await G.p.textContent('#nethud')),8000),await G.p.textContent('#nethud'));
// forged messages from the guest change nothing on the host
await G.p.evaluate(()=>{NET._raw({t:'end',a:0,b:5});NET._raw({t:'pick',i:0});NET._raw({t:'start'});NET._raw({t:'k',k:1,y:'x',p:999});});await sleep(800);
ok('forgedMessagesIgnored',await H.p.evaluate(()=>RUNS.on&&RUNS.c.me===0&&RUNS.c.op===0&&!!MATCH&&NET.rp<=1.2));
// real reps: the host snaps when it is the receiver; the guest holds "catch" when it is
const reps=async n=>{const t=Date.now();while(Date.now()-t<300000){await H.p.evaluate(()=>{if(playState==='pre'&&RUNS.wr==='me'&&!playEnd)playStart();});const r=await H.p.evaluate(()=>RUNS.rep);if(r>n)return true;await sleep(500);}return false;};
await G.p.mouse.down();ok('runsRepsPlay',await reps(2),await H.p.evaluate(()=>JSON.stringify({rep:RUNS.rep,c:RUNS.c,ps:playState})));await G.p.mouse.up();
const hc=await H.p.evaluate(()=>({...RUNS.c,wr:RUNS.wr}));await sleep(600);const gv=await G.p.evaluate(()=>[NET.vh[13],NET.vh[14],NET.vh[15]]);
ok('runsScoreSameOnBoth',gv[0]===hc.me&&gv[1]===hc.op&&gv[2]===(hc.wr==='me'?0:1),JSON.stringify([hc,gv]));M.runsReps=hc;
// first to 5 through the normal end of match
await H.p.evaluate(()=>{RUNS.c.me=4;RUNS.c.op=2;RUNS.wr='me';RUNS.caught=true;playEnd=performance.now()-1;});
ok('runsEndBoth',await until(async()=>await H.p.isVisible('#exr')&&await G.p.evaluate(()=>NET.phase==='done'),60000));
ok('runsResultConsistent',(await H.p.textContent('#xrec')).includes('5 – 2')&&/DEFEAT/.test(await G.p.textContent('#netb'))&&/2 – 5/.test(await G.p.textContent('#netb')),await G.p.textContent('#netb'));
ok('runsNothingSaved',(await H.snap())===H0&&(await G.snap())===G0);
// ---- online Exhibition: both career teams, guest brings its QB career
await H.p.evaluate(()=>{show('net');NET.close();NET.phase='idle';netUI();});await G.p.evaluate(()=>{NET.close();NET.phase='idle';NET.result=null;netUI();});
await H.nb('[data-nm="exh"]');await H.nb('#nethost');code=null;await until(async()=>(code=await H.p.evaluate(()=>NET.phase==='waiting'&&NET.code))&&true);
await G.nb('[data-nx]:nth-child(2)');await G.p.fill('#netcode',code);await G.nb('#netjoin');await until(()=>H.p.evaluate(()=>NET.phase==='lobby'));
ok('exhLobbyShowsGuestQB',(await H.p.textContent('#netb')).includes('Gqb NetB')&&(await G.p.textContent('#netb')).includes('EXHIBITION'));
await H.nb('#netstart');ok('exhStarted',await until(()=>H.p.evaluate(()=>!!MATCH&&MATCH.mp===1&&!MATCH.runs&&ORG.four)&&G.p.evaluate(()=>NET.on),40000));
const teams=await H.p.evaluate(()=>{const L=PROF.lg,red=L.rost[NET.cb];return{red:red.every(id=>String(id).startsWith('G')),n:red.length,blueClub:NET.ca,redClub:NET.cb,names:red.map(id=>L.pl[id].last)};});
const gTeam=await G.p.evaluate(()=>{const b=EXH.players()[1].build,L=lgEnsure(JSON.parse(JSON.stringify(b)));return L.rost[7].filter(id=>id!=='U').map(id=>L.pl[id].last);});
ok('exhGuestCareerTeamUsed',teams.red&&teams.blueClub===3&&teams.redClub===7&&JSON.stringify(teams.names)===JSON.stringify(gTeam),JSON.stringify([teams,gTeam]));
// host's offence first: host sees the play cards, the guest sees "Opponent Choosing Play"
ok('hostChoosesGuestWaits',await until(async()=>await H.p.isVisible('#pcs')&&await G.p.isVisible('#netwait')&&/OPPONENT CHOOSING PLAY/.test(await G.p.textContent('#netwait')),20000));
await G.p.keyboard.press('2');ok('guestCannotPickHostsPlay',await H.p.isVisible('#pcs'));
await H.p.click('#pcards button');ok('waitClears',await until(async()=>!(await G.p.isVisible('#netwait')),8000));
ok('exhBlueRosterFromHostCareer',await H.p.evaluate(()=>roster.filter(d=>d!==player&&d.cur.team==='blue').every(d=>!String(d.cur.pid||'').startsWith('G'))&&roster.filter(d=>d.cur.team==='red'&&d!==NET.rd).every(d=>String(d.cur.pid||'').startsWith('G'))));
// possession to the guest: their offence picks from the same three cards; the host waits
await H.p.evaluate(()=>{preEnd();ORG.off='red';applyOrg();});
ok('guestChoosesHostWaits',await until(async()=>await G.p.isVisible('#pcs')&&await H.p.isVisible('#netwait')&&(await G.p.$$('#pcards .pcard')).length===3,15000));
const want=await G.p.evaluate(()=>document.querySelectorAll('#pcards .pcard')[1].querySelector('b').textContent);await G.p.click('#pcards .pcard:nth-child(2)');
ok('guestPickApplied',await until(()=>H.p.evaluate(w=>!!PLAY&&PLAY.name===w&&!NET.waitPick,want),8000)&&!(await H.p.isVisible('#netwait'))&&!(await G.p.isVisible('#pcs')));
// the guest is the red QB: aim (right button) + hold and release (left button) throws on the host
ok('guestIsRedQB',await until(()=>H.p.evaluate(()=>!!NET.rd&&NET.rd.cur.role==='qb'&&NET.rd.cur.team==='red'&&NET.rd.cur.ai===false),8000));
ok('snapped',await until(()=>H.p.evaluate(()=>playState==='live'&&!!NET.rd&&NET.rd.held),60000),await H.p.evaluate(()=>playState));
await G.p.mouse.move(500,300);await G.p.mouse.down({button:'right'});await sleep(800);await G.p.mouse.down();await sleep(900);await G.p.mouse.up();
ok('guestThrowOnHost',await until(()=>H.p.evaluate(()=>!!PASS&&PASS.by===NET.rd),12000),await H.p.evaluate(()=>JSON.stringify({ps:playState,held:NET.rd&&NET.rd.held,aim:NET.aim,cmd:NET.st.cmd})));await G.p.mouse.up({button:'right'});
// ball + bodies match on the guest
await until(()=>H.p.evaluate(()=>ball.velocity.length()<1),30000);await sleep(400);const hb=await H.p.evaluate(()=>[ball.position.x,ball.position.y,ball.position.z]);await sleep(150);const gb=await G.p.evaluate(()=>[ballMesh.position.x,ballMesh.position.y,ballMesh.position.z]);
M.ballErr=Math.hypot(hb[0]-gb[0],hb[1]-gb[1],hb[2]-gb[2]);ok('ballMirrored',M.ballErr<2,M.ballErr);
// ---- dropped connection: host freezes and re-opens the room, guest reconnects to the same match
const clk=await H.p.evaluate(()=>MATCH.clock);await G.ctx.setOffline(true);await G.p.evaluate(()=>NET._drop());
ok('hostHolds',await until(()=>H.p.evaluate(()=>NET.hold&&!$m('netwait').hidden&&/DISCONNECTED/.test($m('netwait').textContent)),15000));
ok('guestReconnecting',await until(()=>G.p.evaluate(()=>NET.phase==='reconnecting'),15000));
// someone else with the code cannot take the seat
const X=await dev('Xavier','x@x.com',[['Xav',2,1]]);await until(async()=>(await adm('/rooms/'+code)).status===200,15000);await X.p.fill('#netcode',code);await X.nb('#netjoin');
ok('strangerRefused',await until(async()=>/in use/.test(await X.p.textContent('#netb')),15000)&&await H.p.evaluate(()=>NET.hold),await X.p.textContent('#netb'));await X.ctx.close();
ok('clockFrozenWhileHeld',Math.abs((await H.p.evaluate(()=>MATCH.clock))-clk)<1.5);
await G.ctx.setOffline(false);
ok('guestReconnected',await until(()=>H.p.evaluate(()=>!NET.hold&&NET.on)&&G.p.evaluate(()=>NET.on&&NET.phase==='match'),60000),await G.p.evaluate(()=>NET.phase+' '+NET.msg));
// end of the exhibition
await H.p.evaluate(()=>{MATCH.clock=0;playState='pre';});
ok('exhEndBoth',await until(async()=>{await H.p.evaluate(()=>{if(!$m('pcs').hidden){const b=document.querySelector('#pcards button');b&&b.click();}});return await H.p.isVisible('#exr')&&await G.p.evaluate(()=>NET.phase==='done');},60000));
ok('exhNothingSaved',(await H.snap())===H0&&(await G.snap())===G0);
Object.assign(M,await G.p.evaluate(()=>({rtt:NET.st.rtt,snapB:NET.st.snapB})));console.log('METRICS',JSON.stringify(M));
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,4)));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
