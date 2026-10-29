// Phase D: two browsers, one match, through the Auth + Firestore emulators and a real WebRTC data channel (loopback).
const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/',FBD=require.resolve('firebase/package.json').replace('package.json','');
const AU='http://127.0.0.1:9099',FS='http://127.0.0.1:8080/v1/projects/paf-accounts/databases/(default)/documents',PJ='paf-accounts';
const R={},M={};const ok=(k,v,x)=>{R[k]=!!v;console.log(v?'PASS':'FAIL',k,v?'':(x||''));};
const adm=(q,opt={})=>fetch(FS+q,{...opt,headers:{Authorization:'Bearer owner','Content-Type':'application/json'}});
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--disable-features=WebRtcHideLocalIpsWithMdns']});const errs=[];
const dev=async(name,email,first)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
 await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));
 await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({path:FBD+r.request().url().split('/').pop(),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.PAF_EMU={auth:'http://127.0.0.1:9099',fsHost:'127.0.0.1',fsPort:8080};window.PAF_ICE=[];});
 await p.goto('file://'+path.resolve(__dirname,'../../play/index.html')+'?mp');await p.waitForTimeout(1800);
 await p.evaluate(f=>{setInput('kb');pendMode='kb';SLOT=0;openCre(true);ED.first=f;ED.last='Net';saveCre();show('mm');},first);await p.waitForTimeout(900);
 const idle=async()=>{for(let i=0;i<80;i++){const s=await p.evaluate(()=>{const s=ACCT.state();return s.busy||s.mode==='loading'||s.mode==='wait';});if(!s)return;await p.waitForTimeout(200);}};
 if(email){await p.click('#macct');await idle();await p.click('#acctb [data-t="new"]');for(const[k,v]of Object.entries({acun:first.toLowerCase()+'_net',acem:email,acpw:'password1',acpw2:'password1'}))await p.fill('#'+k,v);await p.check('#acok');await p.click('#acctb [data-aa="create"]');await idle();
  const oob=(await (await fetch(`${AU}/emulator/v1/projects/${PJ}/oobCodes`)).json()).oobCodes;await fetch(oob.find(o=>o.email===email).oobLink);await p.click('#acctb [data-aa="recheck"]');await idle();}
 await p.evaluate(()=>{show('mode');});await p.click('#mnet');
 const snap=()=>p.evaluate(()=>JSON.stringify([0,1,2,3,4].map(i=>localStorage.getItem('pafCareer#'+i)))+'|'+localStorage.getItem('pafExh'));
 return{p,ctx,snap};};
const H=await dev('H','h@x.com','Hosty'),G=await dev('G','g@x.com','Guesty');const H0=await H.snap(),G0=await G.snap();
ok('menuCardOnlyWithMp',await H.p.isVisible('#net'));
await H.p.click('#nethost');let code=null;for(let i=0;i<40&&!code;i++){code=await H.p.evaluate(()=>NET.code||null);await H.p.waitForTimeout(250);}
ok('roomCreated',/^[A-Z2-9]{6}$/.test(code)&&(await adm('/rooms/'+code)).status===200,code);
await G.p.fill('#netcode',code);await G.p.click('#netjoin');
const until=async(f,ms=15000)=>{const t=Date.now();while(Date.now()-t<ms){if(await f())return true;await new Promise(r=>setTimeout(r,250));}return false;};
const pick=async()=>{if(await H.p.isVisible('#pcards button'))await H.p.click('#pcards button');};
ok('matchStarted',await until(async()=>{await pick();return await H.p.evaluate(()=>!!MATCH&&MATCH.mp===1)&&await G.p.evaluate(()=>NET.on&&NET.st.snaps>10);},40000),await G.p.evaluate(()=>NET.msg)+' / host: '+await H.p.evaluate(()=>NET.msg+' '+NET.host+' '+NET.on)+' '+JSON.stringify(errs));
ok('roomDeletedAfterJoin',await until(async()=>(await adm('/rooms/'+code)).status===404,5000));
await until(async()=>{await pick();return H.p.evaluate(()=>playOn);},8000);
ok('guestControlsRedNonQb',await until(()=>H.p.evaluate(()=>{const d=NET.rd;return !!d&&d.cur.team==='red'&&d.cur.role!=='qb'&&d.cur.ai===false&&d.cur.pid==='NET';}),6000));
ok('guestBuildApplied',await H.p.evaluate(()=>{const d=NET.rd;return d.cur.nm==='Net'&&d.cur.at.spd>0;})&&(await G.p.evaluate(()=>loadProf(0).att.spd))===(await H.p.evaluate(()=>NET.rd.cur.at.spd)));
// what the guest draws matches the host's simulation (~100 ms behind)
const hp=await H.p.evaluate(()=>{const d=NET.rd;return[d.pel.position.x,d.pel.position.z,NET.rd===player?-1:pool.indexOf(NET.rd)];});
await G.p.waitForTimeout(150);const gp=await G.p.evaluate(i=>{const d=i<0?player:pool[i];return[d.pel.mesh.position.x,d.pel.mesh.position.z];},hp[2]);
M.mirrorErr=Math.hypot(hp[0]-gp[0],hp[1]-gp[1]);ok('guestMirrorsHost',M.mirrorErr<1.5,M.mirrorErr);
// guest keys move their player on the host
await until(async()=>{await pick();return H.p.evaluate(()=>playOn&&!!NET.rd);},15000);const before=await H.p.evaluate(()=>[NET.rd.pel.position.x,NET.rd.pel.position.z,playState]);await G.p.keyboard.down('w');await G.p.waitForTimeout(1500);M.injected=await H.p.evaluate(()=>NET.rk.w===true&&NET.rd.keys.w===true);await G.p.waitForTimeout(1500);await G.p.keyboard.up('w');
const after=await H.p.evaluate(()=>[NET.rd.pel.position.x,NET.rd.pel.position.z,NET.st.keysIn]);M.moved=Math.hypot(after[0]-before[0],after[1]-before[1]);M.hostFps=await H.p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();const f=()=>{n++;if(performance.now()-t<1000)requestAnimationFrame(f);else r(n);};requestAnimationFrame(f);}));ok('guestKeysMoveTheirPlayer',M.injected&&M.moved>.1&&after[2]>20,JSON.stringify([M.moved,after[2],before[2],M.hostFps]));
await G.p.keyboard.press('q');ok('guestCommandReachesHost',await until(()=>H.p.evaluate(()=>(NET.st.cmd||0)>=1),3000));
await G.p.waitForTimeout(2000);
Object.assign(M,await G.p.evaluate(()=>({rtt:NET.st.rtt,guestKBs:NET.kbps(),snaps:NET.st.snaps,late:NET.st.late,secs:Math.round((performance.now()-NET.st.t0)/1000)})),{hostKBs:await H.p.evaluate(()=>NET.kbps())});
M.snapBytes=await G.p.evaluate(()=>NET.st.snapB);ok('metrics',M.rtt>0&&M.snaps>20,JSON.stringify(M));console.log('METRICS',JSON.stringify(M));
ok('guestHud',(await G.p.textContent('#nethud')).includes('ping'));
// end of match: guest sees the final, nobody's career or Exhibition record changes
await H.p.evaluate(()=>{MATCH.clock=0;playState='pre';});ok('matchEndsForBoth',await until(async()=>{await pick();return await H.p.isVisible('#exr')&&await G.p.isVisible('#net')&&/Final/.test(await G.p.textContent('#netst'));},20000),await G.p.textContent('#netst'));
ok('nothingSaved',(await H.snap())===H0&&(await G.snap())===G0);
// second match: the guest closes their browser; the host's match continues with the AI
await H.p.evaluate(()=>{show('net');});await H.p.click('#nethost');code=null;for(let i=0;i<40&&!code;i++){code=await H.p.evaluate(()=>NET.code||null);await H.p.waitForTimeout(250);}
await G.p.evaluate(()=>show('net'));await G.p.fill('#netcode',code);await G.p.click('#netjoin');
await until(async()=>{await pick();return G.p.evaluate(()=>NET.on&&NET.st.snaps>10);});ok('secondMatchGuestAssigned',await until(async()=>{await pick();return H.p.evaluate(()=>!!NET.rd);},20000),await H.p.evaluate(()=>JSON.stringify({m:!!MATCH,po:playOn,ps:playState,msg:NET.msg}))+' guest: '+await G.p.textContent('#netst')+' '+await G.p.evaluate(()=>JSON.stringify({g:NET.guest,on:NET.on,snaps:NET.st.snaps})));
const rd=await H.p.evaluate(()=>pool.indexOf(NET.rd));await G.ctx.close();
ok('disconnectHandled',rd>=0&&await until(()=>H.p.evaluate(i=>!!NET.left&&!NET.rd&&pool[i].cur.ai===true&&!!MATCH,rd),10000),await H.p.evaluate(()=>NET.msg));
// signed-out player cannot host
const X=await dev('X',null,'Nobody');await X.p.click('#nethost');ok('signInRequired',await until(async()=>/verified account/.test(await X.p.textContent('#netst')),8000));
ok('noPageErrors',errs.length===0,JSON.stringify(errs.slice(0,3)));
console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAIL');await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
