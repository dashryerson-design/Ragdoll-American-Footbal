const {chromium}=require(process.env.PW||'playwright');const path=require('path'),L=(process.env.PAF_LIBS||'')+'/';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdnjs/,r=>r.fulfill({path:L+(r.request().url().includes('three')?'three':'cannon')+'.min.js'}));await p.route(/gstatic/,r=>r.abort());
await p.goto('file://'+path.resolve(__dirname,'../../play/index.html'));await p.waitForTimeout(2000);await p.evaluate(()=>show('mm'));await p.click('#macct');await p.waitForTimeout(1500);
const m=await p.evaluate(()=>ACCT.state().mode),t=await p.textContent('#acctb');await p.click('#acback');const back=await p.isVisible('#mm');
console.log(m==='fail'&&/Guest play/.test(t)&&back&&!errs.length?'PASS offline':'FAIL offline',m,errs);await b.close();})();
