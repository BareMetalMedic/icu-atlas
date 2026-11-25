/* Floor: the bedside layer for med-surg, tele, cardiac and ortho floors. Hub, CCRN-ordered module map, telemetry trainer
   (live monitor, rhythm pages, interleaved drill with confidence ratings, calipers), cardiac-floor med cards, and
   simulation cases. Own learning record in profile.floor (validated, merged on import like the Resuscitation record).
   Learning design: pretest before reveal, retrieval with confidence (sure/think/guess) so overconfidence shows,
   interleaved practice across look-alike rhythms, expanding review intervals, worked feedback with the why. */
const FL_BOX=[0,1,3,7,14,30],FL_ID=/^[a-z0-9-]{2,24}$/;
const emptyFloor=()=>({v:1,rh:{},ra:[],mq:{},sims:{},cal:[]});
const fl=()=>profile.floor||(profile.floor=emptyFloor());
function validFloor(f){
 const o=x=>x&&typeof x==="object"&&!Array.isArray(x),int=Number.isSafeInteger,tm=t=>int(t)&&t>0&&t<=Date.now()+400*864e5;
 if(!o(f)||f.v!==1||!o(f.rh)||!Array.isArray(f.ra)||f.ra.length>50000||!o(f.mq)||!o(f.sims))return false;
 if(!Object.entries(f.rh).every(([k,v])=>FL_ID.test(k)&&Array.isArray(v)&&v.length===4&&v.every(int)))return false;
 if(!f.ra.every(a=>a&&FL_ID.test(a.r)&&[0,1].includes(a.ok)&&[0,1,2].includes(a.c)&&tm(a.t)))return false;
 if(!Object.entries(f.mq).every(([k,v])=>FL_ID.test(k)&&Array.isArray(v)&&v.length===3&&v.every(int)))return false;
 if(!Object.entries(f.sims).every(([k,v])=>FL_ID.test(k)&&Array.isArray(v)&&v.length===3&&v.every(int)))return false;
 if(f.cal!==undefined&&(!Array.isArray(f.cal)||f.cal.length>20000||!f.cal.every(a=>a&&[0,1].includes(a.ok)&&tm(a.t))))return false;
 return true;
}
function floorMerge(a,b){if(!a)return b||emptyFloor();if(!b)return a;const m=emptyFloor(),u=(x,f)=>[...new Map(x.map(v=>[f(v),v])).values()].sort((p,q)=>p.t-q.t);
 m.ra=u([...a.ra,...b.ra],v=>v.r+v.t);m.cal=u([...(a.cal||[]),...(b.cal||[])],v=>""+v.t);
 for(const f of ["rh","mq","sims"])for(const k of new Set([...Object.keys(a[f]),...Object.keys(b[f])])){const x=a[f][k],y=b[f][k];m[f][k]=!x?y:!y?x:(f==="rh"?(y[1]>=x[1]?y:x):f==="sims"?[Math.max(x[0],y[0]),Math.max(x[1],y[1]),Math.max(x[2],y[2])]:(y[2]>=x[2]?y:x))}
 return m}

// ---------------------------------------------------------------- rhythm learning state
const rhState=id=>{const v=fl().rh[id];return v?{box:v[0],due:v[1],n:v[2],ok:v[3]}:{box:0,due:0,n:0,ok:0}};
const RH_LABEL=["New","Learning","Learning","Familiar","Strong","Retained"];
function rhRecord(id,ok,conf){const s=rhState(id),now=Date.now();let box=s.box;
 if(!ok)box=0;else if(conf===2)box=Math.min(5,box+1);else if(conf===1)box=Math.min(5,Math.max(1,box));else box=Math.max(1,box);
 const due=now+(box?FL_BOX[box]*864e5:0);fl().rh[id]=[box,due,s.n+1,s.ok+(ok?1:0)];fl().ra.push({r:id,ok:ok?1:0,c:conf,t:now});if(fl().ra.length>50000)fl().ra.splice(0,1000);save()}
function rhDue(){const now=Date.now();return FE_RHYTHMS.filter(r=>{const s=rhState(r.id);return s.n&&s.due<=now})}
function overconf(){const a=fl().ra.filter(x=>x.c===2);return a.length>=5?Math.round(100*a.filter(x=>!x.ok).length/a.length):null}
// Pick the next drill rhythm: due first, then never-seen, then weakest; never the same twice in a row.
function rhPick(prev){const now=Date.now(),pool=FE_RHYTHMS.filter(r=>r.id!==prev),sc=r=>{const s=rhState(r.id);return (s.n&&s.due<=now?0:s.n?2:1)*10+s.box+Math.random()*1.5};return pool.sort((a,b)=>sc(a)-sc(b))[0]}
const FL_CONF={afib:["afrvr","flutter","pac","artifact"],afrvr:["afib","flutter","svt","stach"],flutter:["afib","svt","afrvr","stach"],svt:["stach","flutter","afrvr","vt"],stach:["svt","nsr","flutter","afrvr"],nsr:["sbrady","stach","avb1","pac"],sbrady:["junct","nsr","avb2i","avb1"],junct:["sbrady","avb3","nsr","avb1"],avb1:["nsr","avb2i","sbrady","avb2ii"],avb2i:["avb2ii","avb1","pac","avb3"],avb2ii:["avb2i","avb3","avb1","pac"],avb3:["avb2ii","junct","vpace","sbrady"],pac:["pvc","afib","nsr","avb2i"],pvc:["pac","vt","vpace","artifact"],vt:["svt","vf","vpace","afrvr"],vf:["artifact","vt","asys","flutter"],asys:["vf","avb3","artifact","sbrady"],vpace:["vt","avb3","pvc","junct"],artifact:["vf","vt","afib","nsr"]};
function rhOptions(id){const d=(FL_CONF[id]||[]).slice(0,3);while(d.length<3){const x=FE_RHYTHMS[Math.floor(Math.random()*FE_RHYTHMS.length)].id;if(x!==id&&!d.includes(x))d.push(x)}return shuffle([id,...d])}

// ---------------------------------------------------------------- CCRN-ordered module map
// Weights: AACN Adult CCRN test plan for exams from Nov 2025 (Clinical Judgment 80%: CV 13, Resp 12, Multisystem 16,
// Neuro ~12, GI ~7, Renal ~5 …; Professional Caring & Ethical Practice 20%). Floor content is built module by module;
// every module already links its ICU Atlas lessons and life-support units.
const FL_MODS=[
 {id:"m0",n:"Orientation: the floor shift",w:"Start here",units:[],floor:["tele","meds","sims"],sub:"Report, priorities, tele and P-Mon, Plum pumps, Epic, paging and SBAR."},
 {id:"m1",n:"Foundations",w:"Underpins all",units:[],concepts:true,sub:"Oxygen delivery, perfusion, preload and afterload, acid-base, fluids and electrolytes."},
 {id:"m2",n:"Cardiovascular",w:"13%",units:["cardio"],floor:["tele","meds","sims"],sub:"Conduction and rhythms, 12-lead, ACS, heart failure, AFib, hypertensive emergency, post-cath."},
 {id:"m3",n:"Respiratory",w:"12%",units:["resp"],sub:"O2 escalation, ABGs, COPD, pneumonia, PE, chest tubes, BiPAP."},
 {id:"m4",n:"Multisystem",w:"16%",units:["multi"],sub:"Sepsis, shock, transfusion, pain and opioid safety, withdrawal, end of life."},
 {id:"m5",n:"Neurological",w:"≈12%",units:["neuro"],sub:"Neuro checks, stroke alert, seizures, post-op deficits."},
 {id:"m6",n:"Gastrointestinal",w:"≈7%",units:["gi"],sub:"GI bleed, obstruction and ileus, pancreatitis, liver disease, nutrition."},
 {id:"m7",n:"Renal & GU",w:"≈5%",units:["renal"],sub:"AKI, dialysis patients on the floor, potassium and the ECG, contrast after cath."},
 {id:"m8",n:"Endocrine",w:"Clinical judgment",units:["endo"],sub:"Insulin, DKA and HHS, hypoglycemia protocol, steroids, thyroid."},
 {id:"m9",n:"Hematology & immunity",w:"Clinical judgment",units:["heme"],sub:"Anemia, anticoagulation, HIT, neutropenia, transfusion."},
 {id:"m10",n:"Skin & musculoskeletal (ortho)",w:"Clinical judgment",units:["skin","msk"],sub:"Hip and knee replacement, neurovascular checks, compartment syndrome, DVT, wounds."},
 {id:"m11",n:"Behavioral & psychosocial",w:"Clinical judgment",units:["psych"],sub:"Delirium, agitation, capacity, refusals."},
 {id:"m12",n:"Professional caring & ethics",w:"20%",units:["ethics"],sub:"Advocacy, handoff, family meetings, systems thinking, chain of command."}];

// ---------------------------------------------------------------- shared bits
let FL={drill:null,sim:null,cal:null,medAns:{},rhSeed:{}};
const flHead=(k,t,s)=>head(k,t,s);
const flBack=(r,l)=>back(r,l);
const flBtn=(go,label,cls="btn")=>`<button class="${cls}" data-go="${go}">${label}</button>`;
function floorStop(){feMonitorStop()}
function rhCount(){const r=FE_RHYTHMS.map(x=>rhState(x.id));return{seen:r.filter(s=>s.n).length,strong:r.filter(s=>s.box>=4).length,due:rhDue().length}}

// Home: one line that opens the floor layer.
function floorHomeCard(){const c=rhCount();return `<button class="fl-homecard" data-go="floor"><span class="fl-hc-ic">${I("activity",22)}</span><span><b>Floor: tele, meds and live cases</b><small>${c.due?`${c.due} rhythm${c.due>1?"s":""} due · `:""}Monitor, strips, calipers, cardiac meds, simulation with SBAR and MAR</small></span>${I("arrow",17)}</button>`}

// ---------------------------------------------------------------- pages
function floorPage(p){const [,a,b]=p.split("/");
 if(!a)return flHub();if(a==="m")return flModule(b);if(a==="tele")return flTele();if(a==="r")return flRhythm(b);if(a==="drill")return flDrill();if(a==="cal")return flCal();
 if(a==="meds")return flMeds();if(a==="med")return flMed(b);if(a==="sims")return flSims();if(a==="sim")return flSim(b);return flHub()}
function flHub(){
 const c=rhCount(),oc=overconf(),sc=FS_SCEN[0],done=fl().sims[sc.id];
 return flHead("FLOOR NURSING","Floor","Cardiac, tele, ortho and med-surg: the bedside skills, drilled until they're automatic, then put to work in live cases. Built in the order you'd train for the CCRN.")+
 `<div class="fl-hero"><section class="fl-shift"><span class="fl-tag">${I("clock",14)} 2 MINUTES BETWEEN PATIENTS</span><h2>${c.due?`${c.due} rhythm${c.due>1?"s":""} due for review`:c.seen?"Keep the rhythms sharp":"Start with the rhythms"}</h2><p>Six-second strips, one at a time. Say how sure you are before you answer: the misses you were sure about are the ones that matter.</p>
  <div class="fl-row">${flBtn("floor/drill",`Rhythm drill ${I("arrow",15)}`,"btn mint")}${flBtn("floor/cal","Calipers","btn ghostbtn")}</div></section>
  <button class="fl-case" data-go="floor/sim/${sc.id}"><span class="fl-tag">${I("case",14)} SIMULATION · ${esc(sc.mins)}</span><h2>${esc(sc.title)}</h2><p>${esc(sc.unit)}. Live monitor, Epic-style chart, page the hospitalist, give the med, chart it.</p><span class="fl-meta">${done?`Best ${done[1]}% · ${done[0]} run${done[0]>1?"s":""}`:"Not run yet"}</span></button></div>`+
 `<div class="fl-stats">${[["Rhythms seen",`${c.seen}/${FE_RHYTHMS.length}`],["Retained",c.strong],["Due now",c.due],["Overconfident misses",oc==null?"—":oc+"%"]].map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join("")}</div>`+
 section("Telemetry & ECG","Every rhythm on a live monitor and a measurable strip","Open the trainer","floor/tele")+
 `<div class="fl-tools">${tool("Live monitor + rhythm library","19 rhythms, cell to strip to action","activity","floor/tele")}${tool("Cardiac floor meds",`${FM_MEDS.length} cards with hold parameters`,"clipboard","floor/meds")}${tool("Simulation cases",`${FS_SCEN.length} case${FS_SCEN.length>1?"s":""} · more each module`,"case","floor/sims")}</div>`+
 section("CCRN path","Modules in the order you'd train, weighted to AACN's current Adult CCRN test plan")+
 `<div class="fl-mods">${FL_MODS.map((m,i)=>{const n=m.units.reduce((a,u)=>a+count(u).length,0),built=m.floor?.length;return `<button class="fl-mod ${built?"built":""}" data-go="floor/m/${m.id}"><span class="fl-mn">${pad(i)}</span><span class="fl-mt"><b>${esc(m.n)}</b><small>${esc(m.sub)}</small><span class="fl-mm">${built?`<i class="fl-live">Floor tools live</i>`:""}${n?`${n} ICU lessons`:m.concepts?"Foundation articles":""}</span></span><span class="fl-w">${esc(m.w)}</span></button>`}).join("")}</div>`+
 `<p class="fl-src">Weights: <a href="https://www.aacn.org/-/media/aacn-website/education/online-courses/adult-ccrn-certification-review/adult-ccrn-review-course-syllabus.pdf" target="_blank" rel="noopener noreferrer">AACN Adult CCRN review course syllabus</a>. Equipment workflows are modeled on Philips IntelliVue telemetry and monitors, the ICU Medical Plum 360 and Epic; screens are drawn in this app's own style. Your unit's policy and the provider's order always win.</p>`}
function flModule(id){const m=FL_MODS.find(x=>x.id===id);if(!m)return flHub();
 const lessons=m.units.flatMap(u=>count(u)),tools={tele:tool("Telemetry trainer","Live monitor, strips, calipers, drill","activity","floor/tele"),meds:tool("Cardiac floor meds","Hold parameters, monitoring, antidotes","clipboard","floor/meds"),sims:tool("Simulation cases","Live cases with SBAR and MAR","case","floor/sims")};
 const rs=typeof RU!=="undefined"?RU.filter(u=>m.id==="m2"&&/brady|tachy|adult|arrest|post/i.test(u.title+u.id)).slice(0,6):[];
 return flBack("floor","Floor")+flHead(`MODULE ${pad(FL_MODS.indexOf(m))} · ${m.w}`,m.n,m.sub)+
 (m.floor?.length?section("Floor tools")+`<div class="fl-tools">${m.floor.map(k=>tools[k]).join("")}</div>`:`<div class="softtip">Floor simulations for this module come next. The ICU lessons below already teach the cell-to-bedside reasoning, with cases and spaced review.</div>`)+
 (m.concepts?section("Foundation articles","Cell to organ, the physiology everything else builds on","Open anatomy & pathophysiology","anatomy"):"")+
 (lessons.length?section("ICU Atlas lessons",`${lessons.length} lessons with four case questions each`)+`<div class="list">${lessons.map(lessonRow).join("")}</div>`:"")+
 (rs.length?section("Life support")+`<div class="rs-chips">${rs.map(u=>`<button class="rs-chip" data-go="resus/u/${u.id}">${esc(u.title)}</button>`).join("")}</div>`:"")}
function flTele(){const groups=[...new Set(FE_RHYTHMS.map(r=>r.group))],cur=FL.monR||"afrvr";
 return flBack("floor","Floor")+flHead("TELEMETRY & ECG","Telemetry trainer","Learn each rhythm on a live monitor, measure it on paper, then drill until you call it in two seconds.")+
 `<section class="fl-monwrap">${feMonitorHTML("fmon")}<div class="fl-monbar"><label>Show on the monitor <select data-fl="monR">${FE_RHYTHMS.map(r=>`<option value="${r.id}" ${r.id===cur?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label>${flBtn(`floor/r/${cur}`,`Learn this rhythm ${I("arrow",14)}`,"textbtn")}</div></section>`+
 `<div class="fl-row fl-cta">${flBtn("floor/drill",`Rhythm drill ${I("arrow",15)}`,"btn mint")}${flBtn("floor/cal","Caliper practice","btn")}</div>`+
 section("How to read any strip","Same five questions, every time")+`<ol class="fl-steps"><li><b>Rate.</b> 6-second strip: count QRS × 10. Regular: 300 ÷ large boxes between R waves (or 1500 ÷ small boxes).</li><li><b>Regular?</b> March out the R–R intervals with calipers.</li><li><b>P waves?</b> One before every QRS, same shape, upright in lead II?</li><li><b>PR interval.</b> 0.12–0.20 s (3–5 small boxes). Constant, lengthening, or unrelated?</li><li><b>QRS width.</b> Under 0.12 s (3 small boxes) means the impulse used the normal pathway; wide means it didn't.</li></ol>
 <p class="fl-note">Then the question that matters: <b>how is the patient?</b> Look before you treat the screen.</p>`+
 groups.map(g=>section(esc(g))+`<div class="list">${FE_RHYTHMS.filter(r=>r.group===g).map(r=>{const s=rhState(r.id);return `<button class="listitem" data-go="floor/r/${r.id}"><span class="num fl-dot b${s.box}"></span><span class="itemtext"><b>${esc(r.name)}</b><small>${esc(r.rate)} · ${esc(r.reg)}</small></span><span class="pill t${Math.min(4,s.box)}">${s.n?RH_LABEL[s.box]:"New"}</span>${I("chev",13)}</button>`}).join("")}</div>`).join("")}
function flRhythm(id){const r=feById(id);if(!r)return flTele();const s=rhState(id),seed=FL.rhSeed[id]??(FL.rhSeed[id]=Math.floor(Math.random()*1e9)),st=feStrip(id,seed);
 return flBack("floor/tele","Telemetry trainer")+flHead(r.group.toUpperCase(),r.name,`${s.n?`${s.ok}/${s.n} right in drills · ${RH_LABEL[s.box]}`:"Not drilled yet"}`)+
 `<section class="fl-monwrap">${feMonitorHTML("fmon")}</section>`+
 `<section class="fl-card"><div class="between"><h3>Six-second strip · lead II</h3><button class="textbtn" data-fl="newStrip" data-id="${id}">${I("repeat",14)} New strip</button></div>${feStripRows(st,{id:"rstrip"})}${st.note?`<p class="fl-note">${esc(st.note)}</p>`:""}</section>`+
 `<section class="fl-card"><h3>Criteria</h3><dl class="fl-crit">${[["Rate",r.rate],["Rhythm",r.reg],["P waves",r.p],["PR interval",r.pr],["QRS",r.qrs]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl></section>`+
 `<section class="fl-card"><h3>${I("brain",17)} Why it looks like this</h3><p>${esc(r.why)}</p></section><section class="fl-card fl-act"><h3>${I("target",17)} What you do on the floor</h3><p>${esc(r.floor)}</p></section>`+
 `<div class="fl-row fl-cta">${flBtn("floor/drill",`Drill it with the look-alikes ${I("arrow",15)}`,"btn mint")}</div><p class="fl-src">Sources: <a href="${AHA_ALG}" target="_blank" rel="noopener noreferrer">AHA 2025 adult algorithms</a> · <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/19-2-cardiac-muscle-and-electrical-activity" target="_blank" rel="noopener noreferrer">OpenStax A&amp;P 2e, 19.2 Cardiac muscle and electrical activity</a></p>`}

// ---------------------------------------------------------------- drill
function drillNew(){const prev=FL.drill?.item?.id;const r=rhPick(prev);FL.drill={...(FL.drill||{n:0,right:0}),item:{id:r.id,seed:Math.floor(Math.random()*1e9),opts:rhOptions(r.id),conf:null,ans:null}}}
function flDrill(){if(!FL.drill||!FL.drill.item)drillNew();const d=FL.drill,it=d.item,R=feById(it.id),st=feStrip(it.id,it.seed),done=it.ans!=null,ok=done&&it.ans===it.id;
 const confs=[["Guess",0],["Think so",1],["Sure",2]];
 return flBack("floor/tele","Telemetry trainer")+flHead("RHYTHM DRILL",`Strip ${d.n+(done?0:1)}${d.n>=10?"":" of 10"}`,`${d.right} right so far. Interleaved with look-alikes; misses come back sooner.`)+
 `<section class="fl-card">${feStripRows(st,{id:"dstrip"})}</section>`+
 `<section class="fl-card"><h3>How sure are you?</h3><div class="fl-chips">${confs.map(([n,v])=>`<button class="fl-chip ${it.conf===v?"on":""}" data-fl="conf" data-v="${v}" ${done?"disabled":""}>${n}</button>`).join("")}</div>
  <h3 style="margin-top:14px">Name the rhythm</h3><div class="fl-opts">${it.opts.map(o=>{const cls=done?(o===it.id?"right":o===it.ans?"wrong":""):"";return `<button class="fl-opt ${cls}" data-fl="rans" data-v="${o}" ${done||it.conf==null?"disabled":""}>${esc(feById(o).name)}</button>`}).join("")}</div>${it.conf==null&&!done?`<p class="fl-note">Pick your confidence first.</p>`:""}</section>`+
 (done?`<section class="fl-card ${ok?"fl-ok":"fl-no"}" role="status"><h3>${ok?(it.conf===0?"Right, but you guessed: it'll come back soon.":"Right."):(it.conf===2?"Missed, and you were sure. That's the one to fix.":"Not this time.")} It's ${esc(R.name)}.</h3>
  <dl class="fl-crit">${[["Rate",R.rate],["Rhythm",R.reg],["P waves",R.p],["PR",R.pr],["QRS",R.qrs]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>${!ok?`<p><b>${esc(feById(it.ans).name)}</b> would show: rhythm ${esc(feById(it.ans).reg)}; P waves: ${esc(feById(it.ans).p)}; QRS: ${esc(feById(it.ans).qrs)}.</p>`:""}<p><b>On the floor:</b> ${esc(R.floor)}</p>
  <div class="fl-row">${d.n>=10?flBtn("floor/tele","Done","btn")+`<button class="btn mint" data-fl="drillAgain">Another 10</button>`:`<button class="btn mint" data-fl="drillNext">Next strip ${I("arrow",15)}</button>`}${flBtn(`floor/r/${R.id}`,"Study this rhythm","textbtn")}</div></section>`:"")}

// ---------------------------------------------------------------- calipers practice
const CAL_TASKS=[["rr","Measure one R-to-R interval, then read the rate.","Put one caliper on the peak of an R wave and the other on the next R wave."],["pr","Measure the PR interval.","From the start of the P wave to the start of the QRS. Normal is 0.12–0.20 s (3–5 small boxes)."]];
// A 4-second strip drawn twice as large so a phone can measure to the small box.
function calNew(){const ids=["nsr","sbrady","stach","avb1","avb1","nsr","junct","avb1"],id=ids[Math.floor(Math.random()*ids.length)],seed=Math.floor(Math.random()*1e9),st=feStrip(id,seed,4),task=id==="junct"?"rr":Math.random()<.5?"rr":"pr";
 const b=st.beats.filter(x=>!x.dead),i=Math.max(0,b.findIndex((x,j)=>x.t>.15&&b[j+1]&&b[j+1].t<3.85)),rr=b[i+1].t-b[i].t,pr=b[i].p!=null?(b[i].t-(b[i].p-.045)):null;FL.cal={id,seed,task:task==="pr"&&pr==null?"rr":task,truth:{rr,pr},res:null}}
function flCal(){if(!FL.cal)calNew();const c=FL.cal,st=feStrip(c.id,c.seed,4),T=CAL_TASKS.find(t=>t[0]===c.task),r=c.res;
 const truth=c.task==="rr"?Math.round(c.truth.rr*1000):Math.round(c.truth.pr*1000);
 return flBack("floor/tele","Telemetry trainer")+flHead("CALIPERS","Measure it",T[1])+`<section class="fl-card"><p class="fl-note">${esc(T[2])} One small box = 40 ms; one large box = 200 ms.</p><div class="fl-strip big">${feStripSVG(st,{cal:true,id:"cstrip"})}</div><div class="fl-calread" id="cstrip-read">Drag the calipers</div>
 <div class="fl-row"><button class="btn mint" data-fl="calCheck">Check my measurement</button><button class="textbtn" data-fl="calNew">${I("repeat",14)} New strip</button></div>
 ${r?`<div class="fl-card ${r.ok?"fl-ok":"fl-no"}" role="status"><b>${r.ok?"Within one small box.":"Off by more than one small box."}</b> You measured ${r.ms} ms; the strip's ${c.task==="rr"?"R–R":"PR"} is about ${truth} ms${c.task==="rr"?` → rate ${Math.round(60000/truth)}/min (1500 ÷ ${Math.round(truth/40)} small boxes)`:truth>200?" → longer than 0.20 s: first-degree AV block":" → normal"}.</div>`:""}</section>`}

// ---------------------------------------------------------------- meds
function flMeds(){return flBack("floor","Floor")+flHead("PHARMACOLOGY","Cardiac floor meds","What it does from receptor to bedside, how it's given, when you hold and call, what you watch, and how it's reversed.")+
 `<div class="list">${FM_MEDS.map((m,i)=>{const q=fl().mq[m.id];return `<button class="listitem" data-go="floor/med/${m.id}"><span class="num">${pad(i+1)}</span><span class="itemtext"><b>${esc(m.name)}</b><small>${esc(m.cls)}</small></span>${q?`<span class="pill ${q[1]?"t4":"t1"}">${q[1]?"Checked":"Review"}</span>`:""}${I("chev",13)}</button>`}).join("")}</div>`}
function flMed(id){const m=fmById(id);if(!m)return flMeds();const a=FL.medAns[id];
 const blk=(t,arr)=>`<section class="fl-card"><h3>${t}</h3><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>`;
 return flBack("floor/meds","Cardiac floor meds")+flHead(m.cls.toUpperCase(),m.name,m.tags.join(" · "))+
 `<section class="fl-card fl-q"><span class="kicker">CHECK YOURSELF FIRST</span><h3>${esc(m.q)}</h3><div class="fl-opts">${m.opts.map((o,i)=>`<button class="fl-opt ${a!=null?(i===m.a?"right":i===a?"wrong":""):""}" data-fl="mans" data-id="${id}" data-v="${i}" ${a!=null?"disabled":""}>${esc(o)}</button>`).join("")}</div>${a!=null?`<p class="fl-why"><b>${a===m.a?"Right.":"Not quite."}</b> ${esc(m.why)}</p>`:""}</section>`+
 `<section class="fl-card"><h3>${I("brain",17)} How it works</h3><p>${esc(m.how)}</p></section>`+blk("Dose and how it's given",m.dose)+
 `<section class="fl-card fl-hold"><h3>${I("target",17)} Hold and call</h3><p>${esc(m.hold)}</p></section>`+blk("Monitor",m.monitor)+blk("Watch for",m.watch)+
 `<section class="fl-card"><h3>Antidote / reversal</h3><p>${esc(m.antidote)}</p></section>`+blk("Floor pearls",m.pearls)+
 `<p class="fl-src">Sources: ${m.src.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`).join(" · ")}. Dosing follows the FDA label or AHA 2025; hold parameters shown are common defaults. The order and your unit policy win.</p>`}

// ---------------------------------------------------------------- simulation runtime
function flSims(){return flBack("floor","Floor")+flHead("SIMULATION","Cases","A live monitor, a chart, a provider to page and a patient who changes with what you do. Scored, then debriefed.")+
 `<div class="list">${FS_SCEN.map((s,i)=>{const r=fl().sims[s.id];return `<button class="listitem" data-go="floor/sim/${s.id}"><span class="num">${pad(i+1)}</span><span class="itemtext"><b>${esc(s.title)}</b><small>${esc(s.unit)} · ${esc(s.mins)}</small></span>${r?`<span class="pill t${r[1]>=85?4:r[1]>=60?3:2}">Best ${r[1]}%</span>`:`<span class="pill t0">New</span>`}${I("chev",13)}</button>`}).join("")}</div><div class="softtip">More cases arrive module by module: chest pain and STEMI alert, heart failure flare, symptomatic brady on a beta blocker, post-op hypotension, sepsis, hypoglycemia, compartment syndrome after a tib-fib.</div>`}
function simMax(s){let m=0;for(const n of Object.values(s.nodes)){if(n.choices&&n.choices.length>1)m+=Math.max(...n.choices.map(c=>c.p))}return m+3+4+2}
function simStart(id){const s=fsById(id);FL.sim={id,node:s.start,pts:0,log:[],sbar:null,mar:{checks:{},dose:null,rate:null,given:false},note:null,tab:"report",t0:Date.now()}}
function flSim(id){const s=fsById(id);if(!s)return flSims();if(!FL.sim||FL.sim.id!==id)simStart(id);const S=FL.sim,n=s.nodes[S.node],P=s.pt;
 const banner=`<div class="fl-ban"><div class="fl-avatar">${esc(P.name.split(" ").map(x=>x[0]).join(""))}</div><div><b>${esc(P.name)}</b><small>${P.age} y · ${P.sex} · ${P.wt} kg · Rm ${esc(P.room)}</small></div><div><small>Code</small><b>${esc(P.code)}</b></div><div><small>Allergies</small><b class="${P.allergy==="NKDA"?"":"fl-red"}">${esc(P.allergy)}</b></div><div class="fl-ban-dx"><small>Admitted for</small><b>${esc(P.dx)}</b></div></div>`;
 if(n.kind==="end")return flBack("floor/sims","Cases")+banner+simDebrief(s);
 return flBack("floor/sims","Cases")+`<div class="fl-simtop"><span class="kicker">SIMULATION · ${esc(s.unit)}</span><button class="textbtn" data-fl="simRestart">${I("repeat",14)} Restart</button></div>`+banner+
 `<div class="fl-simgrid"><div class="fl-simL">${feMonitorHTML("fmon")}<section class="fl-card fl-scene"><p class="fl-say">${esc(n.say)}</p>${simBody(s,n)}</section></div><div class="fl-simR">${simChart(s)}</div></div>`}
function simBody(s,n){const S=FL.sim;
 if(n.kind==="sbar")return simSBAR(s);
 if(n.kind==="mar")return simMAR(s,n);
 if(n.kind==="note")return simNote(s,n);
 const last=S.log.at(-1);
 return `${last&&last.node!==S.node&&last.fb?`<div class="fl-fb ${last.p>0?"good":last.p<0?"bad":""}">${esc(last.fb)}</div>`:""}<h3>${esc(n.ask)}</h3><div class="fl-opts">${n.choices.map((c,i)=>`<button class="fl-opt" data-fl="simGo" data-i="${i}">${esc(c.t)}</button>`).join("")}</div>`}
function simSBAR(s){const S=FL.sim,b=s.sbar,sel=S.sbarSel||(S.sbarSel={}),groups={S:"Situation",B:"Background",A:"Assessment",R:"Recommendation / request"};
 if(S.sbar)return `<div class="fl-page"><div class="fl-pagehd">${I("device",15)} Secure Chat · Night hospitalist</div>${S.sbar.reply.map(x=>`<div class="fl-msg ${x.me?"me":""}">${esc(x.t)}</div>`).join("")}</div><div class="fl-row"><button class="btn mint" data-fl="simNext" data-to="n4">Open the new orders ${I("arrow",15)}</button></div>`;
 return `<h3>Build the page</h3><p class="fl-note">Tick what you'll send. Too little and you'll get questions back; noise costs the provider time.</p>${Object.entries(groups).map(([k,name])=>`<div class="fl-sbarg"><span class="fl-sbark">${k}</span><b>${name}</b>${b.items.filter(i=>i.s===k).map(i=>`<label class="fl-check"><input type="checkbox" data-fl="sbarTick" data-k="${i.k}" ${sel[i.k]?"checked":""}><span>${esc(i.t)}</span></label>`).join("")}</div>`).join("")}<div class="fl-row"><button class="btn mint" data-fl="sbarSend">${I("device",15)} Send page</button></div>`}
function sbarSend(s){const S=FL.sim,b=s.sbar,sel=S.sbarSel||{},reply=[],picked=b.items.filter(i=>sel[i.k]);
 reply.push({me:1,t:picked.map(i=>`${i.s}: ${i.t}`).join("\n")||"(empty page)"});let pts=3;const missing=b.items.filter(i=>i.need&&!sel[i.k]),noise=picked.filter(i=>!i.need&&!i.good);
 for(const m of missing){reply.push({t:b.asks[m.k]});reply.push({me:1,t:m.t});pts-=.5}
 if(noise.length){pts-=.5*noise.length;reply.push({t:"Got it. (Skip the extras next time: "+noise.map(x=>x.t.toLowerCase()).join("; ")+".)"})}
 reply.push({t:missing.length?"OK, now I have the picture. Orders are in.":"Clear call, thank you. Orders are in: diltiazem bolus now, replace his K and Mg, restart his metoprolol in the morning. Call me if HR > 110 after 15 min or SBP < 90."});
 pts=Math.max(0,Math.round(pts*2)/2);S.pts+=pts;S.log.push({node:S.node,t:"SBAR page",p:pts,fb:[missing.length?`The provider had to ask: ${missing.map(m=>`"${b.asks[m.k]}"`).join(" ")}`:"",noise.length?`Noise: ${noise.map(x=>x.t.toLowerCase()).join("; ")}.`:"",!missing.length&&!noise.length?"Complete and tight.":""].filter(Boolean).join(" ")});S.sbar={reply};}
function simMAR(s,n){const S=FL.sim,M=s.mar,st=S.mar,allChecks=M.checks.every(([k])=>st.checks[k]);
 if(st.given)return `<div class="fl-fb good">Given at 0323. ${esc(st.fb)}</div><div class="fl-row"><button class="btn mint" data-fl="simNext" data-to="n5">Reassess ${I("arrow",15)}</button></div>`;
 return `<div class="fl-mar"><div class="fl-marhd">${I("clipboard",15)} MAR · Medication administration</div><div class="fl-order"><b>${esc(M.order)}</b><small>Dosing weight ${M.wt} kg · ordered 0322 · STAT</small></div>
  <div class="fl-marsteps">${M.checks.map(([k,t])=>`<button class="fl-step ${st.checks[k]?"done":""}" data-fl="marCheck" data-k="${k}" ${st.checks[k]?"disabled":""}>${st.checks[k]?I("target",15):I("mark",15)} ${esc(t)}${k==="bp"&&st.checks.bp?` → <b>${M.bpNow[0]}/${M.bpNow[1]}</b>`:""}</button>`).join("")}</div>
  ${allChecks?`<h3>${esc(M.dose.q)}</h3><div class="fl-opts row">${M.dose.opts.map((o,i)=>`<button class="fl-opt ${st.dose!=null?(i===M.dose.a?"right":i===st.dose?"wrong":""):""}" data-fl="marDose" data-v="${i}" ${st.dose!=null?"disabled":""}>${esc(o)}</button>`).join("")}</div>${st.dose!=null?`<p class="fl-why">${esc(M.dose.why)}</p><h3>${esc(M.rate.q)}</h3><div class="fl-opts">${M.rate.opts.map((o,i)=>`<button class="fl-opt ${st.rate!=null?(i===M.rate.a?"right":i===st.rate?"wrong":""):""}" data-fl="marRate" data-v="${i}" ${st.rate!=null?"disabled":""}>${esc(o)}</button>`).join("")}</div>`:""}${st.rate!=null?`<p class="fl-why">${esc(M.rate.why)}</p><div class="fl-row"><button class="btn mint" data-fl="marGive">Document as given</button></div>`:""}`:`<p class="fl-note">Do the safety steps first.</p>`}</div>`}
function simNote(s,n){const S=FL.sim,N=S.note||(S.note={S:"",O:"",A:"",P:"",shown:false,rate:null});
 return `<h3>Progress note · SOAP</h3>${["S","O","A","P"].map(k=>`<label class="fl-soap"><span>${k}</span><textarea data-fl="soap" data-k="${k}" rows="${k==="O"||k==="P"?4:2}" maxlength="1500" ${N.shown?"readonly":""}>${esc(N[k])}</textarea>${N.shown?`<div class="fl-key"><small>KEY</small>${esc(n.key[k])}</div>`:""}</label>`).join("")}
 ${N.shown?`<h3>How close was yours?</h3><div class="fl-chips">${[["Missed key points",0],["Most of it",1],["All the key points",2]].map(([t,v])=>`<button class="fl-chip ${N.rate===v?"on":""}" data-fl="noteRate" data-v="${v}">${t}</button>`).join("")}</div>`:`<div class="fl-row"><button class="btn mint" data-fl="noteShow">Compare with the key</button></div>`}`}
function simChart(s){const S=FL.sim,P=s.pt,tab=S.tab||"report",tabs=[["report","Report"],["vitals","Vitals"],["labs","Labs"],["mar","MAR"],["log","Timeline"]];
 let body="";
 if(tab==="report")body=`<dl class="fl-kv"><dt>Dx</dt><dd>${esc(P.dx)}</dd><dt>History</dt><dd>${esc(P.hx)}</dd><dt>Home meds</dt><dd>${esc(P.home)}</dd><dt>Handoff</dt><dd>${esc(P.report)}</dd></dl>`;
 if(tab==="vitals"){const rows=[...s.vitals];const m=FE_MON?.state;if(m?.nbp)rows.push([m.nbpTime||"now",m.hr??"",`${m.nbp[0]}/${m.nbp[1]}`,m.rr??"",`${m.spo2}% RA`,m.temp??""]);body=`<table class="fl-tbl"><thead><tr><th>Time</th><th>HR</th><th>BP</th><th>RR</th><th>SpO₂</th><th>T °C</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`}
 if(tab==="labs")body=`<table class="fl-tbl"><thead><tr><th>Test</th><th>Result</th><th>Ref</th></tr></thead><tbody>${s.labs.map(([t,v,r,f])=>`<tr class="${f?"fl-flag":""}"><td>${esc(t)}</td><td><b>${esc(v)}</b> ${f?`<span class="fl-f">${f}</span>`:""}</td><td>${esc(r)}</td></tr>`).join("")}</tbody></table><small class="fl-note">Collected 0500 yesterday</small>`;
 if(tab==="mar")body=`<table class="fl-tbl"><tbody>${s.mar.map(([m,k,st])=>`<tr><td><b>${esc(m)}</b><small>${esc(k)}</small></td><td class="${/not/i.test(st+k)?"fl-red":""}">${esc(st)}</td></tr>`).join("")}</tbody></table>`;
 if(tab==="log")body=S.log.length?`<ol class="fl-log">${S.log.map(l=>`<li class="${l.p>0?"good":l.p<0?"bad":""}"><b>${esc(l.t)}</b>${l.fb?`<small>${esc(l.fb)}</small>`:""}</li>`).join("")}</ol>`:`<p class="fl-note">Your decisions show up here.</p>`;
 return `<section class="fl-chart"><div class="fl-charthd">${I("clipboard",15)} Chart</div><div class="fl-tabs">${tabs.map(([k,t])=>`<button class="${k===tab?"on":""}" data-fl="simTab" data-v="${k}">${t}</button>`).join("")}</div><div class="fl-chartbody">${body}</div></section>`}
function simDebrief(s){const S=FL.sim,max=simMax(s),pct=Math.max(0,Math.min(100,Math.round(100*S.pts/max))),r=fl().sims[s.id];
 if(!S.saved){S.saved=1;const prev=r||[0,0,0];fl().sims[s.id]=[prev[0]+1,Math.max(prev[1],pct),Date.now()];save()}
 return `<section class="fl-card fl-deb"><span class="kicker">DEBRIEF</span><h2>${pct}%</h2><p>${pct>=85?"That's how it's done on a real night.":pct>=60?"Safe, with a few things to tighten.":"Run it again: the order of operations is the lesson here."}</p></section>
 <section class="fl-card"><h3>Your decisions</h3><ol class="fl-log">${S.log.map(l=>`<li class="${l.p>0?"good":l.p<0?"bad":""}"><b>${esc(l.t)}</b>${l.fb?`<small>${esc(l.fb)}</small>`:""}</li>`).join("")}</ol></section>
 <section class="fl-card"><h3>Take-aways</h3><ul>${s.debrief.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>
 <section class="fl-card"><h3>Go deeper</h3><div class="rs-chips">${s.links.map(([t,g])=>`<button class="rs-chip" data-go="${g}">${esc(t)}</button>`).join("")}</div></section>
 <div class="fl-row"><button class="btn mint" data-fl="simRestart">Run it again</button>${flBtn("floor/sims","All cases","btn")}</div>`}
function simGo(s,i){const S=FL.sim,n=s.nodes[S.node],c=n.choices[i];S.pts+=c.p;S.log.push({node:S.node,t:c.t,p:c.p,fb:c.fb});S.node=c.go;S.lastFb=c}

// ---------------------------------------------------------------- mount + events
function floorMounted(p){const [,a,b]=p.split("/");
 if(a==="tele")feMonitorStart("fmon",{rhythm:FL.monR||"afrvr",spo2:95,nbp:[124,78],nbpTime:"q15",rr:16,temp:36.9});
 if(a==="r"){const r=feById(b);if(r)feMonitorStart("fmon",{rhythm:b,seed:FL.rhSeed[b],spo2:["vf","asys"].includes(b)?null:96,nbp:["vf","asys"].includes(b)?null:[118,72],rr:16,temp:37})}
 if(a==="sim"){const s=fsById(b),S=FL.sim;if(s&&S){const n=s.nodes[S.node];if(n&&n.mon){const m={...n.mon};if(n.kind==="mar"&&S.mar.checks.bp){m.nbp=s.mar.bpNow;m.nbpTime="now"}feMonitorStart("fmon",m)}}}
 for(const id of ["rstrip0","rstrip1","dstrip0","dstrip1","cstrip"])feCalMount(id,v=>{const o=document.getElementById(id+"-read");if(o)o.innerHTML=`<b>${v.ms} ms</b> · ${v.boxes.toFixed(1)} small boxes${v.ms>=250?` · rate ${v.rate}/min`:""}`;if(id==="cstrip"&&FL.cal)FL.cal.last=v.ms});
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-fl]");if(!b||b.disabled||b.tagName==="SELECT"||b.tagName==="TEXTAREA"||(b.tagName==="INPUT"&&b.type!=="checkbox"))return;const k=b.dataset.fl,v=b.dataset.v;
 const sim=FL.sim&&fsById(FL.sim.id),rer=()=>{const y=scrollY;render();scrollTo(0,y)};
 if(k==="newStrip"){FL.rhSeed[b.dataset.id]=Math.floor(Math.random()*1e9);rer();return}
 if(k==="conf"){FL.drill.item.conf=+v;rer();return}
 if(k==="rans"){const it=FL.drill.item;it.ans=v;const ok=v===it.id;FL.drill.n++;if(ok)FL.drill.right++;rhRecord(it.id,ok,it.conf);rer();return}
 if(k==="drillNext"){drillNew();render();return}
 if(k==="drillAgain"){FL.drill={n:0,right:0};drillNew();render();return}
 if(k==="calNew"){calNew();render();return}
 if(k==="calCheck"){const c=FL.cal,ms=c.last||0,truth=(c.task==="rr"?c.truth.rr:c.truth.pr)*1000,ok=Math.abs(ms-truth)<=40;c.res={ms,ok};fl().cal.push({ok:ok?1:0,t:Date.now()});save();rer();return}
 if(k==="mans"){const id=b.dataset.id,m=fmById(id),i=+v;FL.medAns[id]=i;const q=fl().mq[id]||[0,0,0];fl().mq[id]=[q[0]+1,i===m.a?1:0,Date.now()];save();rer();return}
 if(!sim)return;const S=FL.sim;
 if(k==="simTab"){S.tab=v;const box=b.closest(".fl-chart");if(box)box.outerHTML=simChart(sim);return}
 if(k==="simRestart"){simStart(sim.id);render();return}
 if(k==="simGo"){simGo(sim,+b.dataset.i);render();return}
 if(k==="simNext"){S.node=b.dataset.to;render();return}
 if(k==="sbarTick"){(S.sbarSel||(S.sbarSel={}))[b.dataset.k]=b.checked;return}
 if(k==="sbarSend"){sbarSend(sim);rer();return}
 if(k==="marCheck"){S.mar.checks[b.dataset.k]=1;if(b.dataset.k==="bp"&&FE_MON)FE_MON.set({nbp:sim.mar.bpNow,nbpTime:"now"});rer();return}
 if(k==="marDose"){S.mar.dose=+v;rer();return}
 if(k==="marRate"){S.mar.rate=+v;rer();return}
 if(k==="marGive"){const M=sim.mar,okD=S.mar.dose===M.dose.a,okR=S.mar.rate===M.rate.a,p=(okD?2:-2)+(okR?1:-1)+1;S.pts+=p;S.mar.given=true;S.mar.fb=okD&&okR?"Right patient, right drug, right dose, right rate, BP checked right before the push.":`${okD?"":"Dose was wrong: "+M.dose.why+" "}${okR?"":"Rate was wrong: "+M.rate.why}`;S.log.push({node:S.node,t:"Gave diltiazem",p,fb:S.mar.fb});rer();return}
 if(k==="noteShow"){S.note.shown=true;rer();return}
 if(k==="noteRate"){const r=+v;S.note.rate=r;S.pts+=r;S.log.push({node:S.node,t:"Progress note",p:r?r:-0,fb:["Compare yours to the key: onset time, numbers before and after, what you gave and when, who you told, call parameters.","Close. Make the before-and-after numbers and times explicit.","Complete note."][r]});S.node="end";render();return}
});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset?.fl==="monR"){FL.monR=t.value;FE_MON?FE_MON.set({rhythm:t.value,seed:Math.floor(Math.random()*1e9),hr:undefined}):0;const a=document.querySelector('.fl-monbar [data-go^="floor/r/"]');if(a)a.dataset.go="floor/r/"+t.value;if(FE_MON){FE_MON.state.hr=undefined;feNumerics(FE_MON)}}});
document.addEventListener("input",e=>{const t=e.target;if(t.dataset?.fl==="soap"&&FL.sim?.note)FL.sim.note[t.dataset.k]=t.value});
