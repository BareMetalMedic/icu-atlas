/* One personal profile. No identifiers, patient data, analytics, or remote writes. */
const DAY=86400000, NOW=()=>Date.now();
const emptyProfile=()=>({app:"icu-atlas",version:1,attempts:[],read:[],last:"",bookmarks:[],notes:{},prefs:{large:false,still:false},quiz:null});
let profile=emptyProfile(),deviceStore=null,saveChain=Promise.resolve(),storageStatus="Checking device storage";
const localDay=t=>{let d=new Date(t);return [d.getFullYear(),d.getMonth()+1,d.getDate()].join("-")};
const cacheScope=new URL("./",location.href).pathname;
const profileURL=new URL("./__personal_learning_record_v1__",location.href).href;
const byId=id=>LESSONS.find(l=>l.id===id);
function validProfile(p){
 const ids=new Set(LESSONS.map(x=>x.id)),id=x=>ids.has(x);
 if(!p||p.app!=="icu-atlas"||p.version!==1||!Array.isArray(p.attempts)||p.attempts.length>250000||!Array.isArray(p.read)||!Array.isArray(p.bookmarks)||!p.notes||typeof p.notes!=="object"||!p.prefs||typeof p.prefs!=="object")return false;
 if(!p.read.every(id)||!p.bookmarks.every(id)||!Object.entries(p.notes).every(([k,v])=>id(k)&&typeof v==="string"&&v.length<=5000)||!p.attempts.every(a=>a&&id(a.id)&&Number.isInteger(a.q)&&a.q>=0&&a.q<4&&[-1,0,1,2].includes(a.choice)&&Number.isSafeInteger(a.t)&&a.t>0&&a.t<=NOW()+DAY))return false;
 if(p.last&&!id(p.last))return false;
 if(p.resus!==undefined&&typeof validResus==="function"&&!validResus(p.resus))return false;
 if(p.floor!==undefined&&typeof validFloor==="function"&&!validFloor(p.floor))return false;
 let q=p.quiz;if(q){
 if(!["Lesson check","Mixed practice","Starting assessment","Review session","Transfer check","Pathway check","Clinical rounds"].includes(q.name)||!Array.isArray(q.items)||!q.items.length||q.items.length>24||!Number.isInteger(q.index)||q.index<0||q.index>q.items.length)return false;
 if(!q.items.every(i=>i&&id(i.id)&&Number.isInteger(i.q)&&i.q>=0&&i.q<4&&Array.isArray(i.order)&&i.order.length===3&&new Set(i.order).size===3&&i.order.every(x=>[0,1,2].includes(x))&&(i.answer===null||[-1,0,1,2].includes(i.answer))))return false;
 }if(p.rounds&&(!Array.isArray(p.rounds)||!p.rounds.every(r=>r&&Number.isSafeInteger(r.t)&&Number.isInteger(r.score)&&r.score>=0&&r.score<=12)))return false;
 const fs=new Set(CONCEPTS.filter(c=>c.questions).map(c=>c.id));if(p.foundationAttempts!==undefined&&(!Array.isArray(p.foundationAttempts)||p.foundationAttempts.length>250000||!p.foundationAttempts.every(a=>a&&fs.has(a.id)&&[0,1].includes(a.q)&&[-1,0,1,2].includes(a.choice)&&Number.isSafeInteger(a.t)&&a.t>0&&a.t<=NOW()+DAY)))return false;
 if(p.foundationDraft!=null){let d=p.foundationDraft;if(!fs.has(d.id)||![0,1].includes(d.q)||!Array.isArray(d.order)||d.order.length!==3||new Set(d.order).size!==3||!d.order.every(x=>[0,1,2].includes(x))||!(d.answer===null||[-1,0,1,2].includes(d.answer)))return false}return true;
}
async function openProfile(){
 try{deviceStore=await caches.open("icu-atlas-profile-v1:"+cacheScope);let r=await deviceStore.match(profileURL);if(r){let p=await r.json();if(!validProfile(p))throw Error("invalid");profile=p}
 await deviceStore.put(profileURL,new Response(JSON.stringify(profile)));storageStatus="Saved on this device";
 }catch(e){deviceStore=null;storageStatus="Session only · export to keep progress"}
}
function save(){
 if(!deviceStore)return;let json=JSON.stringify(profile);
 saveChain=saveChain.then(()=>deviceStore.put(profileURL,new Response(json))).catch(()=>{deviceStore=null;storageStatus="Session only · export to keep progress";announce("Device storage is unavailable. Export a backup in Settings before leaving.")});
}
function skill(id){
 const a=profile.attempts.filter(v=>v.id===id),last=a.at(-1);
 if(!last)return {label:profile.read.includes(id)?"Studied":"Not started",n:a.length,due:0,tier:0};
 let clean=[];for(let i=a.length-1;i>=0&&a[i].choice===0;i--)clean.unshift(a[i]);
 const distinct=new Set(clean.map(x=>x.q)).size,spaced=clean.length>1&&clean.at(-1).t-clean[0].t>=DAY,transfer=clean.some(x=>x.q>=2);
 let tier=!clean.length?1:(distinct>=3&&spaced&&transfer?4:distinct>=2?3:2);
 const due=last.t+(tier===1?0:(tier===4?(clean.at(-1).t-clean[0].t>=7*DAY?14:7):1)*DAY);
 return {label:["Not started","Relearn","Developing","Practiced","Retained"][tier],n:a.length,due,tier};
}
function dueLessons(){return LESSONS.filter(l=>{let s=skill(l.id);return s.due&&s.due<=NOW()}).sort((a,b)=>skill(a.id).tier-skill(b.id).tier||skill(a.id).due-skill(b.id).due)}
function variation(id){let past=profile.attempts.filter(a=>a.id===id);if(!past.length)return 0;let used=[0,1,2,3].map(q=>past.filter(a=>a.q===q).at(-1)?.t||0);return used.indexOf(Math.min(...used))}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeQuiz(name,items){profile.quiz={name,index:0,items:items.map(([id,q])=>({id,q,order:shuffle([0,1,2]),answer:null}))};save()}
function record(choice){let s=profile.quiz,i=s?.items[s.index];if(!i||i.answer!==null)return false;i.answer=choice;profile.attempts.push({id:i.id,q:i.q,choice,t:NOW()});save();return true}
function exportProfile(){const url=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="icu-atlas-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
