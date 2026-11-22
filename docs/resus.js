/* Resuscitation section: learning record, mastery levels, hub, unit pages, algorithm walker, step-order game,
   flashcards and the quiz ladder. Simulator runtime lives in resus-play.js. Content: resus-content*.js, resus-sims.js. */
const RS_LEVELS=["Not started","Attempted","Familiar","Proficient","Mastered"],RS_POINTS=[0,0,50,80,100],RS_BOX=[0,1,3,7,14];
const RS_ID=/^[a-z]{2,12}\.[fc]\d{1,3}$/,RS_KEY=/^[a-z0-9-]{1,24}$/,RS_QUIZ={micro:"Micro quiz",unit:"Unit quiz",chapter:"Chapter quiz",course:"Course challenge",review:"Review missed questions"};
const emptyResus=()=>({v:1,attempts:[],cards:{},sims:{},orders:{},quizzes:[],seen:[],explored:{},quiz:null});
const rs=()=>profile.resus||(profile.resus=emptyResus());
function validResus(r){
 const int=n=>Number.isSafeInteger(n),time=t=>int(t)&&t>0&&t<=NOW()+400*DAY,obj=o=>o&&typeof o==="object"&&!Array.isArray(o),key=k=>RS_KEY.test(k);
 if(!obj(r)||r.v!==1||!Array.isArray(r.attempts)||r.attempts.length>250000||!Array.isArray(r.quizzes)||r.quizzes.length>20000||!Array.isArray(r.seen)||r.seen.length>200||!obj(r.cards)||!obj(r.sims)||!obj(r.orders)||!obj(r.explored))return false;
 if(!r.attempts.every(a=>a&&RS_ID.test(a.id)&&[-1,0,1,2].includes(a.c)&&time(a.t)))return false;
 if(!Object.entries(r.cards).every(([k,v])=>RS_ID.test(k)&&Array.isArray(v)&&v.length===2&&[0,1,2,3,4].includes(v[0])&&time(v[1])))return false;
 const tally=o=>Object.entries(o).every(([k,v])=>key(k)&&Array.isArray(v)&&v.length===3&&int(v[0])&&v[0]>0&&int(v[1])&&v[1]>=0&&v[1]<=100&&time(v[2]));
 if(!tally(r.sims)||!tally(r.orders)||!r.seen.every(key))return false;
 if(!Object.entries(r.explored).every(([k,v])=>key(k)&&Array.isArray(v)&&v.length<=80&&v.every(key)))return false;
 if(!r.quizzes.every(q=>q&&RS_QUIZ[q.k]&&(q.id===""||key(q.id))&&int(q.s)&&int(q.n)&&q.s>=0&&q.n>0&&q.n<=60&&q.s<=q.n&&time(q.t)&&obj(q.u)&&Object.entries(q.u).every(([k,v])=>key(k)&&Array.isArray(v)&&v.length===2&&int(v[0])&&int(v[1])&&v[0]>=0&&v[0]<=v[1]&&v[1]<=60)))return false;
 const q=r.quiz;if(q!=null&&!(obj(q)&&RS_QUIZ[q.k]&&(q.id===""||key(q.id))&&int(q.i)&&Array.isArray(q.items)&&q.items.length>0&&q.items.length<=60&&q.i>=0&&q.i<=q.items.length&&q.items.every(x=>x&&RS_ID.test(x.id)&&Array.isArray(x.o)&&x.o.length===3&&new Set(x.o).size===3&&x.o.every(v=>[0,1,2].includes(v))&&(x.a===null||[-1,0,1,2].includes(x.a)))))return false;
 return true;
}
function rMerge(a,b){if(!a)return b||emptyResus();if(!b)return a;const m=emptyResus(),uniq=(x,f)=>[...new Map(x.map(v=>[f(v),v])).values()].sort((p,q)=>p.t-q.t);
 m.attempts=uniq([...a.attempts,...b.attempts],v=>v.id+":"+v.c+":"+v.t);m.quizzes=uniq([...a.quizzes,...b.quizzes],v=>v.k+":"+v.id+":"+v.t);m.seen=[...new Set([...a.seen,...b.seen])];
 for(const k of new Set([...Object.keys(a.cards),...Object.keys(b.cards)])){const x=a.cards[k],y=b.cards[k];m.cards[k]=!x?y:!y?x:(y[1]>=x[1]?y:x)}
 for(const f of ["sims","orders"])for(const k of new Set([...Object.keys(a[f]),...Object.keys(b[f])])){const x=a[f][k]||[0,0,0],y=b[f][k]||[0,0,0];m[f][k]=[Math.max(x[0],y[0]),Math.max(x[1],y[1]),Math.max(x[2],y[2])]}
 for(const k of new Set([...Object.keys(a.explored),...Object.keys(b.explored)]))m.explored[k]=[...new Set([...(a.explored[k]||[]),...(b.explored[k]||[])])];
 m.quiz=b.quiz||a.quiz||null;return m}

/* ---------- items and mastery ---------- */
const rChapter=id=>RCH.find(c=>c.id===id),rUnits=ch=>RU.filter(u=>u.ch===ch);
const rIds=u=>[...u.facts.map((_,i)=>u.id+".f"+i),...u.cases.map((_,i)=>u.id+".c"+i)];
function rItem(id){const [uid,k]=String(id).split("."),u=RUNIT(uid);if(!u||!k)return null;const row=(k[0]==="f"?u.facts:u.cases)[Number(k.slice(1))];if(!row)return null;
 return k[0]==="f"?{id,u,kind:"f",q:row[0],opts:row.slice(1,4),why:"",ev:row[4]}:{id,u,kind:"c",q:row[0],opts:row.slice(1,4),why:row[4],ev:""}}
const rLatest=()=>{const m=new Map();for(const a of rs().attempts)m.set(a.id,a);return m};
function rLevel(uid,L=rLatest()){const R=rs(),u=RUNIT(uid),ids=rIds(u),tried=ids.filter(i=>L.has(i)),right=tried.filter(i=>L.get(i).c===0).length,acc=tried.length?right/tried.length:0;
 const sims=u.sims.filter(s=>R.sims[s]).length,boxes=u.algos.reduce((n,a)=>n+Object.keys(a.nodes).length,0),seenBoxes=u.algos.reduce((n,a)=>n+(R.explored[a.id]||[]).filter(k=>a.nodes[k]).length,0);
 const ev=R.quizzes.filter(q=>q.k==="unit"&&q.id===uid&&q.u[uid]&&q.u[uid][1]>=Math.min(10,ids.length)).map(q=>({t:q.t,ok:q.u[uid][0]/q.u[uid][1]>=.8}));
 let lvl=tried.length||sims||seenBoxes||R.seen.includes(uid)?1:0;if(tried.length>=5&&acc>=.7)lvl=2;
 if(ev.length&&ev.at(-1).ok){lvl=3;let i=ev.length-1;while(i>0&&ev[i-1].ok)i--;if(ev.at(-1).t-ev[i].t>=DAY)lvl=4}
 return {lvl,label:RS_LEVELS[lvl],acc,tried:tried.length,right,total:ids.length,sims,simTotal:u.sims.length,boxes,seenBoxes,tests:ev.length}}
const rPill=l=>`<span class="pill rs-l${l.lvl}">${l.label}</span>`;
const rCourse=()=>{const L=rLatest(),lv=RU.map(u=>rLevel(u.id,L));return {lv,pts:Math.round(lv.reduce((s,l)=>s+RS_POINTS[l.lvl],0)/RU.length)}};
function rNext(){const R=rs(),L=rLatest();
 for(const u of RU){const l=rLevel(u.id,L);if(l.lvl>=3)continue;
  if(!R.seen.includes(u.id))return {t:"Learn: "+u.title,s:"Start with the plain-language lesson, then walk the algorithm.",go:"resus/u/"+u.id};
  if(!l.seenBoxes)return {t:"Walk the algorithm: "+u.title,s:"Follow the boxes one decision at a time.",go:"resus/u/"+u.id+"/algo"};
  if(!l.sims)return {t:"Run a simulator: "+u.title,s:RSIM[u.sims[0]].title,go:"resus/sim/"+u.sims[0]};
  if(l.tried<5)return {t:"Micro quiz: "+u.title,s:"Five quick questions on this unit.",r:"quiz:micro:"+u.id};
  return {t:"Unit quiz: "+u.title,s:"Ten questions. 80% moves this unit to Proficient.",r:"quiz:unit:"+u.id}}
 if(rDue("all").length)return {t:"Flashcards due",s:"Keep the numbers fresh with spaced review.",go:"resus/cards/due"};
 const m=RU.find(u=>rLevel(u.id,L).lvl<4);return m?{t:"Unit quiz again: "+m.title,s:"A second pass at least a day after the first moves this unit to Mastered.",r:"quiz:unit:"+m.id}:{t:"Course challenge",s:"Two questions from every unit.",r:"quiz:course:"}}

/* ---------- hub ---------- */
const rSimCard=id=>{const s=RSIM[id],d=rs().sims[id];return `<button class="tool-card rs-simcard" data-go="resus/sim/${id}"><span class="tileicon">${I(s.icon,19)}</span><span><b>${esc(s.title)}</b><small>${esc(s.sub)}</small><em class="${d?(d[1]>=80?"ok":"try"):""}">${d?`Best ${d[1]}% · ${d[0]} run${d[0]===1?"":"s"}`:"Not run yet"}</em></span></button>`};
function rHub(){const R=rs(),{lv,pts}=rCourse(),nx=rNext(),due=rDue("all").length,missed=rMissed().length,counts=RS_LEVELS.map((_,i)=>lv.filter(l=>l.lvl===i).length),active=R.quiz&&R.quiz.i<R.quiz.items.length;
 return head("LIFE SUPPORT","Resuscitation","Newborn to adult CPR, AED, choking, PALS and ACLS, built from the 2025 American Heart Association algorithms.")+
 `<div class="rs-top"><section class="panel rs-mastery"><span class="kicker">COURSE MASTERY</span><div class="rs-score"><b>${pts}%</b><span>${counts[4]} mastered · ${counts[3]} proficient · ${counts[2]} familiar · ${counts[1]+counts[0]} to go</span></div><div class="rs-bar" aria-hidden="true">${lv.map(l=>`<i class="rs-l${l.lvl}"></i>`).join("")}</div><div class="rs-next"><span class="kicker">UP NEXT</span><b>${esc(nx.t)}</b><small>${esc(nx.s)}</small><div class="actionbar"><button class="btn" ${nx.go?`data-go="${nx.go}"`:`data-r="${nx.r}"`}>Continue ${I("arrow",15)}</button>${active?`<button class="soft" data-go="resus/quiz">Resume quiz (${R.quiz.i+1}/${R.quiz.items.length})</button>`:""}</div></div></section>
 <section class="rs-code"><span class="kicker">RANDOM SCENARIO</span><h2>Code Blue</h2><p>One press pages you to an emergency. You run it from the first box.</p><button class="rs-codebtn" data-r="code" aria-label="Code Blue: start a random emergency scenario"><span>CODE<br>BLUE</span></button></section></div>`+
 RCH.map((c,i)=>{const us=rUnits(c.id),cl=us.map(u=>lv[RU.indexOf(u)]),cp=Math.round(cl.reduce((s,l)=>s+RS_POINTS[l.lvl],0)/us.length);
  return `<section class="rs-chapter" style="--c:${c.color};--tint:${c.tint}"><div class="rs-chead"><span class="rs-cnum">${pad(i+1)}</span><div><h2>${esc(c.title)}</h2><p>${esc(c.sub)}</p></div><div class="rs-cside"><b>${cp}%</b><button class="textbtn" data-r="quiz:chapter:${c.id}">Chapter quiz ${I("arrow",14)}</button></div></div><div class="list">${us.map((u,j)=>{const l=cl[j];return `<button class="listitem" data-go="resus/u/${u.id}"><span class="rs-tag">${esc(u.tag)}</span><span class="itemtext"><b>${esc(u.title)}</b><small>${esc(u.sub)}</small><div class="meter" style="margin-top:6px"><i style="width:${RS_POINTS[l.lvl]}%"></i></div></span>${rPill(l)}${I("chev",13)}</button>`}).join("")}</div></section>`}).join("")+
 section("Keep it fresh","Short sessions that bring back what you are about to forget.")+`<div class="tools rs-tools">
 <button class="tool-card" data-go="resus/cards/due"><span class="tileicon">${I("repeat",19)}</span><span><b>Flashcards</b><small>${due?due+" card"+(due===1?"":"s")+" ready":"Nothing due right now"}</small></span></button>
 <button class="tool-card" data-r="quiz:review:"><span class="tileicon">${I("target",19)}</span><span><b>Review missed questions</b><small>${missed?missed+" to recover":"No open misses"}</small></span></button>
 <button class="tool-card" data-r="quiz:course:"><span class="tileicon">${I("cap",19)}</span><span><b>Course challenge</b><small>Two questions from each of the ${RU.length} units</small></span></button></div>`+
 section("Simulator arcade",`${RSIM_ORDER.length} hands-on drills. Each scored step is tied to wording in an AHA algorithm.`)+`<div class="tools rs-arcade">${RSIM_ORDER.map(rSimCard).join("")}</div>`+rScope()}
const rScope=()=>`<div class="panel rs-scope"><span class="kicker">SCOPE AND SOURCE</span><p>This section is a personal study companion built from the 2025 American Heart Association algorithm figures. It is not an AHA course, does not issue a course completion card, and has had an automated wording check against the figures, not an independent clinical review. For patient care follow current AHA materials, your instructor, and your employer's protocols.</p><p>Pictures here are original teaching diagrams. Open the official figures at the source:</p><div class="refs">${refLink("American Heart Association: CPR and ECC algorithms",RESUS_SRC)}</div></div>`;
function rProgressPanel(){const {lv,pts}=rCourse(),R=rs();return section("Resuscitation","CPR, PALS and ACLS mastery is tracked separately from the critical-care pathways.","Open section","resus")+`<div class="stats"><div class="stat"><b>${pts}%</b><span>Course mastery</span></div><div class="stat"><b>${lv.filter(l=>l.lvl>=3).length}/${RU.length}</b><span>Units proficient or mastered</span></div><div class="stat"><b>${Object.keys(R.sims).filter(k=>RSIM[k]).length}/${RSIM_ORDER.length}</b><span>Simulators run</span></div></div><div class="list">${RU.map((u,i)=>`<button class="listitem" data-go="resus/u/${u.id}"><span class="rs-tag">${esc(u.tag)}</span><span class="itemtext"><b>${esc(u.title)}</b><small>${lv[i].right}/${lv[i].total} questions correct on the latest try · ${lv[i].sims}/${lv[i].simTotal} simulators</small></span>${rPill(lv[i])}</button>`).join("")}</div>`}

/* ---------- unit page ---------- */
const RS_ART={nrp:["newborn",{hr:80,vent:true}],pbls:["cpr",{size:"child",pump:true}],pfbao:["choke",{who:"infant",mode:"back"}],pca:["ecg","vf"],pbrady:["ecg","brady"],ptachy:["ecg","svt"],lay:"down",abls:["cpr",{pump:true}],afbao:["choke",{who:"adult",mode:"abdo"}],aca:["ecg","vf"],abrady:["ecg","avb"],atachy:["ecg","vt"],cardiovert:["ecg","af"],pcac:["ecg","sinus"],preg:["preg",{lud:true}],lvad:"lvad",tor:["ecg","asystole"]};
const RS_TABS=[["learn","Learn"],["algo","Algorithm"],["practice","Practice"],["cards","Flashcards"],["quiz","Quiz"]];
let rAlgoPick={},rWalk=null;
function rUnitPage(u,tab){if(!RS_TABS.some(t=>t[0]===tab))tab="learn";const R=rs(),ch=rChapter(u.ch),l=rLevel(u.id),ix=RU.indexOf(u),prev=RU[ix-1],nextU=RU[ix+1];
 if(tab==="learn"&&!R.seen.includes(u.id)){R.seen.push(u.id);save()}
 const body=tab==="learn"?rLearn(u):tab==="algo"?rAlgoTab(u):tab==="practice"?rPracticeTab(u):tab==="cards"?rCardsTab(u):rQuizTab(u,l);
 return back("resus","Resuscitation")+head(`${ch.title} · ${u.tag}`,u.title,u.sub)+`<div class="tabs" aria-label="Unit sections">${RS_TABS.map(([v,n])=>`<button class="tab ${tab===v?"on":""}" data-go="resus/u/${u.id}${v==="learn"?"":"/"+v}" aria-pressed="${tab===v}">${n}</button>`).join("")}</div>
 <div class="lessonlayout"><article class="lessonbox lessonbody rs-body">${body}</article><aside><div class="panel"><span class="kicker">YOUR RECORD</span>${rPill(l)}<p>${l.right}/${l.total} questions correct on the latest try</p><div class="meter" style="margin:8px 0"><i style="width:${100*l.right/l.total}%"></i></div><p class="quiet">${l.seenBoxes}/${l.boxes} algorithm boxes visited · ${l.sims}/${l.simTotal} simulators run · ${l.tests} unit-level test${l.tests===1?"":"s"}</p></div>
 <div class="panel"><span class="kicker">SOURCE</span><p>${u.algos.map(a=>esc(a.title)).join("; ")}.</p><p class="quiet">${esc(u.cr)}. Wording and numbers are taken from the AHA figure; pictures are original teaching diagrams.</p><div class="refs" style="margin-top:8px">${refLink("Open the official AHA algorithms",RESUS_SRC)}</div></div>
 ${u.links.length?`<div class="panel"><span class="kicker">RELATED ICU LESSONS</span>${u.links.map(id=>byId(id)?`<button class="textbtn rs-rel" data-go="lesson/${id}">${esc(byId(id).title)} ${I("arrow",13)}</button>`:"").join("")}</div>`:""}</aside></div>
 <div class="between lesson-next">${prev?`<button class="textbtn" data-go="resus/u/${prev.id}">${I("back",14)} ${esc(prev.title)}</button>`:"<span></span>"}${nextU?`<button class="textbtn" data-go="resus/u/${nextU.id}">Next: ${esc(nextU.title)} ${I("arrow",14)}</button>`:"<span></span>"}</div>`}
function rLearn(u){const title=id=>CONCEPTS.find(c=>c.id===id)?.title;
 return `<div class="rs-art">${rScene(RS_ART[u.id])}</div>`+u.learn.map(([t,text,links],i)=>`<section><span class="kicker">${["STEP 1","STEP 2","STEP 3","STEP 4"][i]||""}</span><h2>${esc(t)}</h2><p>${esc(text)}</p>${links?.length?`<div class="rs-chips"><span class="quiet">Body basics:</span>${links.filter(title).map(id=>`<button class="rs-chip" data-go="concept/${id}">${esc(title(id))}</button>`).join("")}</div>`:""}</section>`).join("")+
 `<div class="actionbar"><button class="btn" data-go="resus/u/${u.id}/algo">Walk the algorithm ${I("arrow",15)}</button><button class="soft" data-go="resus/u/${u.id}/practice">Go to practice</button></div>`}
const rShort=(a,id)=>{const n=a.nodes[id];return n[1]||n[2][0]||""};
function rNodeCard(a,id,cur){const [t,h,lines]=a.nodes[id];return `<div class="rs-node rs-${t} ${cur?"cur":""}"><span class="rs-kind">${{a:"Action",d:"Decision",e:"End of path",x:"Go to"}[t]}</span>${h?`<h3>${esc(h)}</h3>`:""}${lines.length?`<ul>${lines.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}</div>`}
function rAlgoTab(u){const R=rs(),a=u.algos.find(x=>x.id===rAlgoPick[u.id])||u.algos[0];if(!rWalk||rWalk.id!==a.id)rWalk={id:a.id,at:a.start,trail:[]};if(!a.nodes[rWalk.at])rWalk.at=a.start;
 const seen=R.explored[a.id]||(R.explored[a.id]=[]);if(!seen.includes(rWalk.at)){seen.push(rWalk.at);save()}
 const ids=Object.keys(a.nodes),next=a.nodes[rWalk.at][3],notes=a.notes||[],foot=notes.filter(n=>/^[*†‡]/.test(n)),about=notes.filter(n=>!/^[*†‡]/.test(n));
 return (u.algos.length>1?`<div class="tabs rs-subtabs" aria-label="Choose algorithm">${u.algos.map(x=>`<button class="tab ${x.id===a.id?"on":""}" data-r="algo:${u.id}:${x.id}" aria-pressed="${x.id===a.id}">${esc(x.title)}</button>`).join("")}</div>`:"")+
 `<span class="kicker">STEP-BY-STEP WALKER</span><h2>${esc(a.title)}</h2><p class="quiet">Read one box, choose where the patient goes, and visit every box. ${seen.filter(k=>a.nodes[k]).length} of ${ids.length} boxes visited.</p>
 <div class="rs-walk" id="rs-walk">${rWalk.trail.length?`<div class="rs-trail">${rWalk.trail.slice(-3).map(id=>`<span>${esc(rShort(a,id)).slice(0,60)}</span>`).join(I("chev",11))}${I("chev",11)}</div>`:""}${rNodeCard(a,rWalk.at,true)}
 <div class="actionbar">${next.length?next.map(([label,to],i)=>`<button class="${i?"soft":"btn"}" data-r="walk:${to}">${esc(label||"Next box")} ${I("arrow",15)}</button>`).join(""):`<span class="pill">This path ends here</span>`}${rWalk.trail.length?`<button class="textbtn" data-r="walkback">${I("back",14)} Back one box</button><button class="textbtn" data-r="walkreset">Start over</button>`:""}</div></div>
 ${(a.tables||[]).length?`<h2 class="rs-h">Side panels on the figure</h2><div class="rs-tables">${a.tables.map(([t,lines])=>`<div class="rs-table"><h3>${esc(t)}</h3><ul>${lines.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>`:""}
 ${foot.length?`<h2 class="rs-h">Footnotes on the figure</h2>${foot.map(n=>`<p class="rs-foot">${esc(n)}</p>`).join("")}`:""}
 <details class="rs-all"><summary>See every box in this algorithm</summary><ol class="rs-map">${ids.map(id=>`<li>${rNodeCard(a,id,id===rWalk.at)}<div class="rs-out">${seen.includes(id)?`<span class="pill rs-l3">Visited</span>`:""}${a.nodes[id][3].map(([label,to])=>`<button class="textbtn" data-r="walkjump:${to}">${esc(label?label+": ":"Then: ")}${esc(rShort(a,to)).slice(0,70)} ${I("arrow",12)}</button>`).join("")}</div></li>`).join("")}</ol></details>
 ${about.length?`<p class="quiet rs-about"><b>About the figure:</b> ${about.map(esc).join(" ")}</p>`:""}
 <div class="actionbar"><button class="soft" data-go="resus/u/${u.id}/practice">Practice this algorithm ${I("arrow",15)}</button></div>`}
function rPracticeTab(u){const R=rs(),games=u.algos.filter(a=>a.order.length);
 return `<span class="kicker">HANDS-ON</span><h2>Simulators</h2><p class="quiet">Each run scores the steps you get right the first time. 80% is a pass. A wrong step has to be corrected before you move on.</p><div class="tools rs-arcade">${u.sims.map(rSimCard).join("")}</div>
 ${games.length?`<h2 class="rs-h">Put the boxes in order</h2><div class="list">${games.map(a=>{const d=R.orders[a.id];return `<button class="listitem" data-go="resus/order/${a.id}"><span class="tileicon">${I("layers",18)}</span><span class="itemtext"><b>${esc(a.title)}</b><small>${a.order.length} boxes on the main path${d?` · best ${d[1]}% · ${d[0]} run${d[0]===1?"":"s"}`:""}</small></span>${I("chev",13)}</button>`}).join("")}</div>`:""}
 <div class="actionbar"><button class="btn" data-r="quiz:micro:${u.id}">Micro quiz: 5 questions ${I("arrow",15)}</button><button class="soft" data-go="resus/cards/${u.id}">Flashcards for this unit</button></div>`}
function rCardsTab(u){const R=rs(),ids=u.facts.map((_,i)=>u.id+".f"+i),box=[0,0,0,0,0,0];for(const id of ids){const c=R.cards[id];box[c?c[0]+1:0]++}const due=rDue(u.id).length;
 return `<span class="kicker">SPACED RECALL</span><h2>Flashcards</h2><p>${ids.length} cards, one for each key number and rule in this unit. “Got it” moves a card to a longer wait: 1, 3, 7, then 14 days. “Again” brings it straight back.</p><div class="rs-boxes">${["New","Again","1 day","3 days","7 days","14 days"].map((n,i)=>`<div><b>${box[i]}</b><span>${n}</span></div>`).join("")}</div><div class="actionbar"><button class="btn" data-go="resus/cards/${u.id}">${due?`Study ${Math.min(12,due)} card${due===1?"":"s"}`:"Practice ahead"} ${I("arrow",15)}</button></div>`}
function rQuizTab(u,l){const R=rs(),hist=R.quizzes.filter(q=>q.id===u.id&&(q.k==="micro"||q.k==="unit")).slice(-6).reverse(),active=R.quiz&&R.quiz.i<R.quiz.items.length;
 return `<span class="kicker">CHECK YOURSELF</span><h2>Quizzes for this unit</h2><p>Start small, then prove it. A unit quiz at 80% or higher moves this unit to Proficient. A second pass at least 24 hours later, with no failed test between, moves it to Mastered.</p>${active?`<div class="callout"><b>You have an unfinished ${RS_QUIZ[R.quiz.k].toLowerCase()}</b><p>Question ${R.quiz.i+1} of ${R.quiz.items.length}. Starting a new quiz replaces it; answers already given stay in your record.</p><button class="textbtn" data-go="resus/quiz">Resume ${I("arrow",14)}</button></div>`:""}
 <div class="rs-ladder"><div><b>1 · Micro quiz</b><small>5 questions. Counts toward Familiar.</small><button class="soft" data-r="quiz:micro:${u.id}">Start micro quiz</button></div><div><b>2 · Unit quiz</b><small>${Math.min(10,l.total)} questions, numbers and bedside cases.</small><button class="btn" data-r="quiz:unit:${u.id}">Start unit quiz</button></div><div><b>3 · Chapter quiz</b><small>${esc(rChapter(u.ch).title)}: every unit mixed together.</small><button class="soft" data-r="quiz:chapter:${u.ch}">Start chapter quiz</button></div></div>
 <h2 class="rs-h">Recent results</h2>${hist.length?`<div class="list">${hist.map(q=>`<div class="listitem"><span class="itemtext"><b>${RS_QUIZ[q.k]}</b><small>${date(q.t)}</small></span><span class="pill ${q.s/q.n>=.8?"rs-l3":"t1"}">${q.s}/${q.n}</span></div>`).join("")}</div>`:`<p class="quiet">No quiz taken in this unit yet.</p>`}
 <p class="quiet rs-about">Levels: Attempted (any work), Familiar (at least 5 questions tried and 70% of latest answers correct), Proficient (latest unit-level test 80% or higher), Mastered (two passes at least a day apart). These are study signals, not a certification.</p>`}

/* ---------- order the boxes ---------- */
let rOrd=null;
const rOrdLabel=(a,id)=>{const n=a.nodes[id],h=n[1].replace(/^\d+ · /,"");return [h,...n[2]].filter(Boolean).join(" · ")};
function rOrderPage(aid){const a=RALGO(aid);if(!a||!a.order.length)return rHub();if(!rOrd||rOrd.id!==aid||rOrd.fresh)rOrd={id:aid,pos:0,miss:new Set(),deck:shuffle(a.order.map((id,i)=>i)),bad:-1};
 const o=rOrd,n=a.order.length,done=o.pos>=n,pct=Math.round(100*(n-o.miss.size)/n),d=rs().orders[aid];
 return back("resus/u/"+a.unit.id+"/practice",a.unit.title)+head("PUT THE BOXES IN ORDER",a.title,"Tap the boxes in the order the main path of the algorithm follows them.")+`<div class="panel rs-order"><div class="quizhead"><span>${done?"Complete":"Box "+(o.pos+1)+" of "+n}</span><span>${d?"Best "+d[1]+"%":""}</span></div><div class="meter"><i style="width:${100*o.pos/n}%"></i></div>
 ${o.pos?`<ol class="rs-placed">${a.order.slice(0,o.pos).map(id=>`<li>${esc(rOrdLabel(a,id))}</li>`).join("")}</ol>`:`<p class="quiet" style="margin-top:12px">Which box comes first?</p>`}
 ${done?`<div class="callout ${pct>=80?"":"warning"}" role="status"><b>${pct}% placed correctly on the first try</b><p>${pct>=80?"You know the main path.":"Walk the algorithm once more, then try again."}</p></div><div class="actionbar"><button class="btn" data-r="ordagain">Shuffle and repeat</button><button class="soft" data-go="resus/u/${a.unit.id}/algo">Open the algorithm</button></div>`:
 `<div class="options rs-deck">${o.deck.filter(i=>i>=0&&!o.used?.has(i)).map(i=>`<button class="answer ${o.bad===i?"bad":""}" data-r="ord:${i}"><span>${esc(rOrdLabel(a,a.order[i]))}</span></button>`).join("")}</div>${o.bad>=0?`<p class="rs-miss" role="status">Not yet. That box comes later on this path.</p>`:""}`}</div>`}
function rOrdTap(i){const o=rOrd,a=RALGO(o.id);if(!a||o.pos>=a.order.length)return;o.used=o.used||new Set();
 // Boxes with identical wording (for example the repeated rhythm checks) are interchangeable.
 if(rOrdLabel(a,a.order[i])===rOrdLabel(a,a.order[o.pos])){o.used.add(i);o.pos++;o.bad=-1;
  if(o.pos>=a.order.length){const R=rs(),pct=Math.round(100*(a.order.length-o.miss.size)/a.order.length),d=R.orders[o.id]||[0,0,0];R.orders[o.id]=[d[0]+1,Math.max(d[1],pct),NOW()];save()}}
 else{o.miss.add(o.pos);o.bad=i}
 render();(document.querySelector(".rs-deck .answer:not(.bad)")||document.querySelector(".rs-order .btn"))?.focus({preventScroll:true})}

/* ---------- flashcards ---------- */
function rPool(scope){return scope==="all"||scope==="due"?RU.flatMap(u=>u.facts.map((_,i)=>u.id+".f"+i)):rChapter(scope)?rUnits(scope).flatMap(u=>u.facts.map((_,i)=>u.id+".f"+i)):RUNIT(scope)?RUNIT(scope).facts.map((_,i)=>RUNIT(scope).id+".f"+i):[]}
function rDue(scope){const R=rs(),t=NOW();return rPool(scope).filter(id=>!R.cards[id]||R.cards[id][1]<=t)}
let rDeck=null;
function rDeckBuild(scope){const R=rs(),due=rDue(scope),sched=due.filter(id=>R.cards[id]).sort((a,b)=>R.cards[a][1]-R.cards[b][1]),fresh=due.filter(id=>!R.cards[id]);let q=[...sched,...fresh].slice(0,12),ahead=false;
 if(!q.length){q=shuffle(rPool(scope)).sort((a,b)=>R.cards[a][1]-R.cards[b][1]).slice(0,12);ahead=true}
 rDeck={scope,q,i:0,flip:false,got:0,again:0,ahead,n:q.length}}
function rCardsPage(scope){if(!rPool(scope).length)scope="due";if(!rDeck||rDeck.scope!==scope)rDeckBuild(scope);const d=rDeck,u=RUNIT(scope),home=u?"resus/u/"+u.id+"/cards":"resus",done=d.i>=d.q.length;
 const top=back(home,u?u.title:"Resuscitation")+head("SPACED RECALL","Flashcards",u?u.title:"Cards due across every unit, newborn first.");
 if(done)return top+`<div class="panel rs-cardwrap"><span class="kicker">SESSION COMPLETE</span><h2>${d.got} of ${d.n} recalled</h2><p>${d.again?d.again+" card"+(d.again===1?"":"s")+" came back for another look and will return first next time.":"Each card you recalled now waits longer before it returns."}</p><div class="actionbar"><button class="btn" data-r="cardsmore">${rDue(scope).length?"Study more cards":"Practice ahead"}</button><button class="soft" data-go="${home}">Done</button></div></div>`;
 const it=rItem(d.q[d.i]),c=rs().cards[it.id];
 return top+`<div class="rs-cardwrap"><div class="quizhead"><span>${esc(it.u.tag)} · ${esc(it.u.title)}</span><span>${pad(d.i+1)} / ${pad(d.q.length)}</span></div><div class="meter"><i style="width:${100*d.i/d.q.length}%"></i></div>
 <button class="rs-card ${d.flip?"flip":""}" data-r="flip" aria-label="${d.flip?"Answer shown":"Show the answer"}"><span class="rs-cardin"><span class="rs-face"><small>QUESTION</small><b>${esc(it.q)}</b><em>Say the answer out loud, then tap to check.</em></span>${d.flip?`<span class="rs-face rs-backface"><small>ANSWER</small><b>${esc(it.opts[0])}</b><em>AHA algorithm wording: “${esc(it.ev)}”</em></span>`:""}</span></button>
 <div class="actionbar rs-cardbar" role="group" aria-label="Rate your recall">${d.flip?`<button class="soft" data-r="card:0">Again</button><button class="btn" data-r="card:1">Got it</button>`:`<button class="btn" data-r="flip">Show answer</button>`}</div><p class="quiet" role="status">${d.flip?(c?`This card was waiting ${RS_BOX[c[0]]} day${RS_BOX[c[0]]===1?"":"s"}.`:"New card."):d.ahead?"Nothing is due, so this is extra practice.":""}</p></div>`}
function rCardRate(ok){const d=rDeck,R=rs();if(!d||d.i>=d.q.length||!d.flip)return;const id=d.q[d.i],c=R.cards[id],box=ok?Math.min(4,(c?c[0]:0)+1):0;R.cards[id]=[box,NOW()+RS_BOX[box]*DAY];
 if(ok)d.got++;else{d.again++;if(d.q.filter(x=>x===id).length<2)d.q.push(id)}d.i++;d.flip=false;save();render();document.querySelector(".rs-card,.rs-cardwrap .btn")?.focus({preventScroll:true})}

/* ---------- quiz ladder ---------- */
const rMissed=()=>[...rLatest().values()].filter(a=>a.c!==0&&rItem(a.id)).map(a=>a.id);
function rChoose(u,n,L){const rank=id=>{const a=L.get(id);return a?(a.c===0?2+a.t/1e14:0):1},srt=ids=>shuffle(ids).sort((x,y)=>rank(x)-rank(y)),cs=srt(u.cases.map((_,i)=>u.id+".c"+i)),fs=srt(u.facts.map((_,i)=>u.id+".f"+i)),nc=Math.min(cs.length,Math.max(1,Math.round(n*.4)));
 return [...cs.slice(0,nc),...fs.slice(0,n-nc)]}
function rStartQuiz(k,id){const R=rs(),L=rLatest();let ids=[];
 if(k==="micro"||k==="unit"){const u=RUNIT(id);if(!u)return;ids=rChoose(u,k==="micro"?5:10,L)}
 else if(k==="chapter"){const us=rUnits(id);if(!us.length)return;const per=Math.max(3,Math.ceil(12/us.length));ids=us.flatMap(u=>rChoose(u,per,L))}
 else if(k==="course"){id="";ids=RU.flatMap(u=>rChoose(u,2,L))}
 else if(k==="review"){id="";ids=shuffle(rMissed()).slice(0,12);if(!ids.length){announce("No missed questions are waiting. Try a unit quiz.");return}}
 else return;
 R.quiz={k,id,i:0,items:shuffle(ids).map(x=>({id:x,o:shuffle([0,1,2]),a:null}))};rQuizDelta=null;save();move("resus/quiz")}
const rQuizName=q=>RS_QUIZ[q.k]+(q.k==="chapter"?" · "+rChapter(q.id).title:RUNIT(q.id)?" · "+RUNIT(q.id).title:"");
let rQuizDelta=null;
function rQuizPage(){const R=rs(),q=R.quiz;if(!q||q.items.some(x=>!rItem(x.id))||(q.k==="chapter"&&!rChapter(q.id))){if(q){R.quiz=null;save()}return rHub()}
 const home=RUNIT(q.id)?"resus/u/"+q.id+"/quiz":"resus",homeName=RUNIT(q.id)?RUNIT(q.id).title:"Resuscitation";if(q.i>=q.items.length)return rQuizEnd(q,home,homeName);
 const x=q.items[q.i],it=rItem(x.id),done=x.a!==null,ok=x.a===0,unsure=x.a===-1;
 const fb=done?`<div class="callout ${ok?"":"warning"}" role="status"><b>${ok?"Correct":unsure?"Here is the answer":"Not this time"}</b>${ok?"":`<p><b>Answer:</b> ${esc(it.opts[0])}</p>`}${it.why?`<p>${esc(it.why)}</p>`:""}${it.ev?`<p>AHA algorithm wording: “${esc(it.ev)}”</p>`:""}<button class="textbtn" data-go="resus/u/${it.u.id}/algo">See it in the algorithm ${I("arrow",14)}</button></div><div class="actionbar"><button class="btn" data-r="qnext">${q.i===q.items.length-1?"See results":"Next question"} ${I("arrow",15)}</button></div>`:`<div class="actionbar"><button class="soft" data-r="ans:-1">Not sure · show me</button></div>`;
 return back(home,homeName)+head(RS_QUIZ[q.k].toUpperCase(),rQuizName(q),it.kind==="c"?"Read the situation and choose what the algorithm directs.":"Recall the number or rule from the algorithm.")+`<article class="panel quizwrap"><div class="quizhead"><span>${esc(it.u.tag)} · ${esc(it.u.title)}</span><span>${pad(q.i+1)} / ${pad(q.items.length)}</span></div><div class="meter"><i style="width:${100*q.i/q.items.length}%"></i></div><h2>${esc(it.q)}</h2><div class="options">${x.o.map((o,j)=>`<button class="answer ${done&&o===0?"good":done&&x.a===o?"bad":""}" data-r="ans:${o}" ${done?"disabled":""}><span class="letter">${"ABC"[j]}</span><span>${esc(it.opts[o])}</span></button>`).join("")}</div>${fb}</article>`}
function rQuizAnswer(c){const R=rs(),q=R.quiz,x=q?.items[q.i];if(!x||x.a!==null||![-1,0,1,2].includes(c))return;x.a=c;R.attempts.push({id:x.id,c,t:NOW()});save();render();document.querySelector("#main .callout[role=status]")?.scrollIntoView({block:"nearest"});document.querySelector('[data-r="qnext"]')?.focus({preventScroll:true})}
function rQuizNext(){const R=rs(),q=R.quiz;if(!q||q.i>=q.items.length||q.items[q.i].a===null)return;
 if(q.i===q.items.length-1){const u={};for(const x of q.items){const k=x.id.split(".")[0];u[k]=u[k]||[0,0];u[k][1]++;if(x.a===0)u[k][0]++}
  const before=Object.keys(u).map(k=>[k,rLevel(k).lvl]);q.i++;R.quizzes.push({k:q.k,id:q.id,s:q.items.filter(x=>x.a===0).length,n:q.items.length,t:NOW(),u});rQuizDelta=before.map(([k,b])=>[k,b,rLevel(k).lvl]).filter(([,b,a])=>a!==b)}
 else q.i++;
 save();render();window.scrollTo(0,0);document.querySelector("#main").focus({preventScroll:true})}
function rQuizEnd(q,home,homeName){const s=q.items.filter(x=>x.a===0).length,n=q.items.length,pct=Math.round(100*s/n),graded=q.k!=="micro"&&q.k!=="review",miss=q.items.filter(x=>x.a!==0),per={};for(const x of q.items){const k=x.id.split(".")[0];per[k]=per[k]||[0,0];per[k][1]++;if(x.a===0)per[k][0]++}
 return back(home,homeName)+head("RESULTS",rQuizName(q),"Use the misses to decide what to open next.")+`<div class="panel"><span class="kicker">${graded?(pct>=80?"PASSED":"NOT YET"):"PRACTICE"}</span><h2>${s} of ${n} correct · ${pct}%</h2><p>${graded?(pct>=80?"80% or higher counts as a pass for this test.":"A pass is 80%. Review the misses and try again when ready."):"Practice results feed your accuracy and the missed-question review."}</p>
 ${rQuizDelta?.length?`<div class="callout" role="status"><b>Level change</b>${rQuizDelta.map(([k,b,a])=>`<p>${esc(RUNIT(k).title)}: ${RS_LEVELS[b]} → <b>${RS_LEVELS[a]}</b></p>`).join("")}</div>`:""}
 <div class="actionbar">${miss.length?`<button class="btn" data-r="quiz:review:">Review missed questions ${I("arrow",14)}</button>`:""}${q.k==="micro"&&RUNIT(q.id)?`<button class="${miss.length?"soft":"btn"}" data-r="quiz:unit:${q.id}">Take the unit quiz</button>`:""}<button class="soft" data-go="${home}">Back to ${esc(homeName)}</button></div></div>
 ${Object.keys(per).length>1?section("By unit")+`<div class="list">${Object.entries(per).map(([k,[c,t]])=>`<button class="listitem" data-go="resus/u/${k}"><span class="rs-tag">${esc(RUNIT(k).tag)}</span><span class="itemtext"><b>${esc(RUNIT(k).title)}</b></span><span class="pill ${c/t>=.8?"rs-l3":"t1"}">${c}/${t}</span></button>`).join("")}</div>`:""}
 ${section("Your answers")}<div class="list">${q.items.map((x,j)=>{const it=rItem(x.id);return `<button class="listitem" data-go="resus/u/${it.u.id}/algo"><span class="num">${pad(j+1)}</span><span class="itemtext"><b>${esc(it.q)}</b><small>${esc(it.opts[0])}</small></span><span class="pill ${x.a===0?"rs-l3":"t1"}">${x.a===0?"Correct":x.a===-1?"Unsure":"Missed"}</span></button>`}).join("")}</div>`}

/* ---------- routing and events ---------- */
function resusPage(){const [a,b,c]=path.split("/").slice(1);rs();
 if(a==="u"&&RUNIT(b))return rUnitPage(RUNIT(b),c||"learn");
 if(a==="sim"&&RSIM[b])return rSimPage(b);
 if(a==="order"&&RALGO(b))return rOrderPage(b);
 if(a==="cards")return rCardsPage(b||"due");
 if(a==="quiz")return rQuizPage();
 return rHub()}
function resusMounted(){if(!document.getElementById("rs-defs"))document.body.insertAdjacentHTML("beforeend",RS_DEFS.replace("<svg ",'<svg id="rs-defs" '));const [a,b]=path.split("/").slice(1);if(a==="sim"&&RSIM[b])rSimMount(b)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-r]");if(!b||b.disabled)return;const [verb,...rest]=b.dataset.r.split(":"),arg=rest.join(":");
 if(verb==="code"){move("resus/sim/"+RSIM_CODE[Math.floor(Math.random()*RSIM_CODE.length)]);return}
 if(verb==="quiz"){const [k,id]=arg.split(":");rStartQuiz(k,id||"");return}
 if(verb==="ans"){rQuizAnswer(Number(arg));return}
 if(verb==="qnext"){rQuizNext();return}
 if(verb==="algo"){const [u,a]=arg.split(":");rAlgoPick[u]=a;rWalk=null;render();return}
 if(verb==="walk"||verb==="walkjump"||verb==="walkback"||verb==="walkreset"){const a=rWalk&&RALGO(rWalk.id);if(!a)return;
  if(verb==="walkback")rWalk.at=rWalk.trail.pop()||a.start;else if(verb==="walkreset"){rWalk.at=a.start;rWalk.trail=[]}else if(a.nodes[arg]){rWalk.trail.push(rWalk.at);rWalk.at=arg}
  render();const w=document.getElementById("rs-walk");if(w){w.scrollIntoView({block:"nearest"});(w.querySelector(".actionbar button")||w).focus?.({preventScroll:true})}return}
 if(verb==="ord"){rOrdTap(Number(arg));return}
 if(verb==="ordagain"){rOrd.fresh=true;render();return}
 if(verb==="flip"){if(rDeck&&!rDeck.flip){rDeck.flip=true;render();document.querySelector('[data-r="card:1"]')?.focus({preventScroll:true})}return}
 if(verb==="card"){rCardRate(arg==="1");return}
 if(verb==="cardsmore"){rDeckBuild(rDeck.scope);render();return}
 if(typeof rSimClick==="function")rSimClick(verb,arg,b,e)});
