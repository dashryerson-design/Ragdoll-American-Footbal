// Security-rule tests. Run from a folder with firebase-tools, @firebase/rules-unit-testing and firebase installed, next to firestore.rules:
//   npx firebase emulators:exec --only firestore --project demo-paf "node rules.test.mjs"
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {setLogLevel} from 'firebase/firestore';setLogLevel('silent');
import {doc,getDoc,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp,collection,getDocs} from 'firebase/firestore';
import fs from 'fs';
const env=await initializeTestEnvironment({projectId:'demo-paf',firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8080}});
const res=[];const t=async(name,p,expectOk)=>{try{await(expectOk?assertSucceeds(p):assertFails(p));res.push(['PASS',name]);}catch(e){res.push(['FAIL',name,String(e.message).slice(0,140)]);}};
const ctx=(uid,ver=true)=>env.authenticatedContext(uid,{email_verified:ver}).firestore();
const A=ctx('alice'),B=ctx('bob'),U=ctx('ursula',false),anon=env.unauthenticatedContext().firestore();
const user=name=>({username:name,createdAt:serverTimestamp(),schema:1,privacyVer:1});
const claim=(db,uid,name)=>{const b=writeBatch(db);b.set(doc(db,'usernames',name),{uid});b.set(doc(db,'users',uid),user(name));return b.commit();};
const head=(rev,gen='gen0001A',extra={})=>({careerId:'c1',rev,gen,parts:[{n:'core',i:0,len:10,h:'x'}],fmt:1,gameVer:'3.32',sum:{lvl:1},updatedAt:serverTimestamp(),...extra});
// --- signed out
await t('anon cannot read a user',getDoc(doc(anon,'users','alice')),false);
await t('anon cannot create a username',setDoc(doc(anon,'usernames','zed'),{uid:'zed'}),false);
await t('anon cannot write anywhere else',setDoc(doc(anon,'misc','x'),{a:1}),false);
// --- usernames
await t('alice claims "alice" with her user doc (one batch)',claim(A,'alice','alice'),true);
await t('bob cannot claim the taken "alice"',claim(B,'bob','alice'),false);
await t('bob cannot claim a name for alice\'s uid',setDoc(doc(B,'usernames','bobby'),{uid:'alice'}),false);
await t('bob cannot point his user doc at alice\'s name',setDoc(doc(B,'users','bob'),user('alice')),false);
await t('username without user doc is refused',setDoc(doc(B,'usernames','lonely'),{uid:'bob'}),false);
for(const bad of ['ab','Bobby','bo-b','b o b','abcdefghijklmnopq'])await t(`invalid name "${bad}" refused`,claim(B,'bob',bad),false);
await t('bob claims "bob_99"',claim(B,'bob','bob_99'),true);
await t('a username cannot be edited',updateDoc(doc(A,'usernames','alice'),{uid:'bob'}),false);
await t('bob cannot delete alice\'s name',deleteDoc(doc(B,'usernames','alice')),false);
await t('alice cannot release her name while her profile uses it',deleteDoc(doc(A,'usernames','alice')),false);
await t('alice renames to "alice_2" (atomic swap)',(()=>{const b=writeBatch(A);b.set(doc(A,'usernames','alice_2'),{uid:'alice'});b.update(doc(A,'users','alice'),{username:'alice_2'});b.delete(doc(A,'usernames','alice'));return b.commit();})(),true);
await t('the old name is free again for bob? (bob already named; ursula claims it)',claim(U,'ursula','alice'),true);
await t('nobody can read a name they don\'t own',getDoc(doc(B,'usernames','alice_2')),false);
await t('users cannot be listed',getDocs(collection(B,'users')),false);
// --- profiles
await t('bob cannot read alice\'s profile',getDoc(doc(B,'users','alice')),false);
await t('alice reads her profile',getDoc(doc(A,'users','alice')),true);
await t('extra field in profile refused',updateDoc(doc(A,'users','alice'),{admin:true}),false);
await t('createdAt cannot be changed',updateDoc(doc(A,'users','alice'),{createdAt:new Date(0)}),false);
// --- careers
const cd=(db,uid,s)=>doc(db,'users',uid,'careers',s);
await t('unverified email cannot write a career',setDoc(cd(U,'ursula','0'),head(1)),false);
await t('alice creates cloud career slot 0 (rev 1)',setDoc(cd(A,'alice','0'),head(1)),true);
await t('a 6th slot ("5") is refused',setDoc(cd(A,'alice','5'),head(1)),false);
await t('a made-up slot ("extra") is refused',setDoc(cd(A,'alice','extra'),head(1)),false);
await t('creating with rev 5 is refused',setDoc(cd(A,'alice','1'),head(5)),false);
await t('client-chosen updatedAt is refused',setDoc(cd(A,'alice','2'),head(1,'gen0001A',{updatedAt:new Date()})),false);
await t('update rev 1 -> 2 accepted',setDoc(cd(A,'alice','0'),head(2,'gen0002B')),true);
await t('stale write (rev 2 again) refused',setDoc(cd(A,'alice','0'),head(2,'gen0003C')),false);
await t('skipping a revision (2 -> 4) refused',setDoc(cd(A,'alice','0'),head(4,'gen0003C')),false);
await t('changing careerId without replaced refused',setDoc(cd(A,'alice','0'),head(3,'gen0003C',{careerId:'other'})),false);
await t('replaced must be a boolean',setDoc(cd(A,'alice','0'),head(3,'gen0003C',{careerId:'other',replaced:'yes'})),false);
await t('replacement with replaced:true and rev+1 accepted (slot 3)',setDoc(cd(A,'alice','3'),head(1)).then(()=>setDoc(cd(A,'alice','3'),head(2,'gen0002B',{careerId:'other',replaced:true}))),true);
await t('stale replacement (rev 2 again) refused',setDoc(cd(A,'alice','0'),head(2,'gen0003C',{careerId:'other',replaced:true})),false);
await t('unknown head field refused',setDoc(cd(A,'alice','0'),head(3,'gen0003C',{cheat:1})),false);
await t('bob cannot read alice\'s career',getDoc(cd(B,'alice','0')),false);
await t('bob cannot write alice\'s career',setDoc(cd(B,'alice','0'),head(3,'gen0003C')),false);
// --- parts + atomic upload
const pd=(db,uid,s,id)=>doc(db,'users',uid,'careers',s,'parts',id);
await t('atomic upload: 3 parts + head rev 3 in one batch',(()=>{const b=writeBatch(A);for(const n of ['core','league','season'])b.set(pd(A,'alice','0',`gen0003C_${n}_0`),{d:'x'.repeat(300000)});b.set(cd(A,'alice','0'),head(3,'gen0003C'));return b.commit();})(),true);
await t('a batch whose head is stale writes NOTHING (part not created)',(async()=>{const b=writeBatch(A);b.set(pd(A,'alice','0','gen0004D_core_0'),{d:'y'});b.set(cd(A,'alice','0'),head(3,'gen0004D'));try{await b.commit();}catch(e){let ex=true;await env.withSecurityRulesDisabled(async c=>{ex=(await getDoc(doc(c.firestore(),'users/alice/careers/0/parts/gen0004D_core_0'))).exists();});if(!ex)throw e;}})(),false);
await t('oversized part (> 360,000 chars) refused',setDoc(pd(A,'alice','0','gen0005E_core_0'),{d:'z'.repeat(360001)}),false);
await t('parts cannot be modified after upload',setDoc(pd(A,'alice','0','gen0003C_core_0'),{d:'tampered'}),false);
await t('badly named part refused',setDoc(pd(A,'alice','0','BAD-NAME!'),{d:'a'}),false);
await t('unverified user cannot write parts',setDoc(pd(U,'ursula','0','gen0001A_core_0'),{d:'a'}),false);
await t('bob cannot read alice\'s parts',getDoc(pd(B,'alice','0','gen0003C_core_0')),false);
await t('alice reads her part',getDoc(pd(A,'alice','0','gen0003C_core_0')),true);
// --- account deletion (resumable order: parts, careers, then profile + name together)
await t('alice deletes a part',deleteDoc(pd(A,'alice','0','gen0003C_core_0')),true);
await t('alice deletes her career head',deleteDoc(cd(A,'alice','0')),true);
await t('final step: profile + username deleted together',(()=>{const b=writeBatch(A);b.delete(doc(A,'users','alice'));b.delete(doc(A,'usernames','alice_2'));return b.commit();})(),true);
await t('after deletion the name is claimable (carol takes it)',claim(ctx('carol'),'carol','alice_2'),true);
await env.cleanup();
for(const r of res)console.log(r.join(' | '));const f=res.filter(r=>r[0]==='FAIL').length;console.log(`\n${res.length-f}/${res.length} passed`);process.exit(f?1:0);
