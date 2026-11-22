/* Simulator runtime for the resuscitation section. One run at a time, never saved mid-run; only the finished score is
   written to the learning record. A step is "first-try correct" when it is solved without a miss. */
let rRun=null,rHold=null;const rT=new Set();
const rLater=(fn,ms)=>{const t=setTimeout(()=>{rT.delete(t);fn()},ms);rT.add(t);return t};
const rEvery=(fn,ms)=>{const t=setInterval(fn,ms);rT.add(t);return t};
function resusStop(){for(const t of rT){clearTimeout(t);clearInterval(t)}rT.clear();rHold=null;if(rRun&&rRun.w&&!rRun.w.solved)rRun.w=null}
const RS_J=[1,2,3,4,5,6,7,8,9,10,15,20,30,40,50,60,70,80,100,120,150,170,200,300,360];
const rScored=s=>s.score!==false&&s.t!=="info"&&!(s.t==="tap"&&s.n===1);
const rFmt=(v,dp=0)=>Number(v).toFixed(dp);
const rClock=t=>Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0");
const rEl=id=>document.getElementById(id);

function rSimPage(id){const s=RSIM[id],u=RUNIT(s.unit),d=rs().sims[id];
 return back("resus/u/"+u.id+"/practice",u.title)+head("SIMULATOR",s.title,s.sub)+`<div class="panel rs-sim"><div id="rs-stage" class="rs-stage"></div></div><p class="quiet rs-simsrc">Screen practice only: no real call, shock, or medicine. Timing on a screen cannot assess compression depth, recoil, hand position, or effective ventilation. Based on: ${[...new Set(s.src.map(a=>RALGO(a).title))].map(esc).join("; ")}. ${esc(u.cr)}.${d?` Your best: ${d[1]}% over ${d[0]} run${d[0]===1?"":"s"}.`:""}</p><div class="refs">${refLink("Compare with the official AHA algorithms",RESUS_SRC)}${id==="cardiovert"?refLink("AHA Adult Advanced Life Support: polymorphic VT","https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support"):""}</div>`}
function rSimMount(id){if(!rRun||rRun.id!==id)rSimNew(id);rPaint()}
function rSimNew(id){resusStop();rRun={id,steps:rSimSteps(id),i:0,ok:[],w:null,done:false,rec:null}}
function rInit(s){const w={solved:false,missed:false,tries:0,msg:""};
 if(s.t==="choice"){const n=(s.opts||s.o).length;w.order=s.opts?[...Array(n).keys()]:shuffle([...Array(n).keys()]);w.right=s.opts?s.a:0;w.wrong=new Set()}
 if(s.t==="multi"){w.order=shuffle([...Array(s.o.length).keys()]);w.sel=new Set()}
 if(s.t==="tap")w.c=0;
 if(s.t==="dial")w.v=s.start??s.min;
 if(s.t==="keypad")w.d="";
 if(s.t==="defib"){w.sync=false;w.j=0;w.state="idle"}
 if(s.t==="cpr"){w.taps=[];w.beat=true}
 if(s.t==="pace")w.taps=[];
 if(s.t==="pattern"){w.pos=0;w.cyc=0}
 if(s.t==="clock"){w.on=false;w.t=0;w.log=[];w.errs=[]}
 return w}
function rPaint(focus){const st=rEl("rs-stage");if(!st||!rRun)return;if(rRun.done){st.innerHTML=rResult();if(focus)st.querySelector(".btn")?.focus({preventScroll:true});return}
 const R=rRun,s=R.steps[R.i];if(!R.w)R.w=rInit(s);const w=R.w,view=rView(s,w),scored=R.steps.filter(rScored).length,good=R.ok.filter(v=>v===true).length;
 st.innerHTML=`<div class="quizhead"><span>Step ${R.i+1} of ${R.steps.length}</span><span>${good} first-try correct of ${scored} scored</span></div><div class="meter"><i style="width:${100*R.i/R.steps.length}%"></i></div>
 <div class="rs-grid ${view?"":"solo"}">${view?`<div class="rs-view" id="rs-view">${view}</div>`:""}<div class="rs-work"><p class="rs-q">${esc(s.q||s.say)}</p>${s.list?`<ul class="rs-facts">${s.list.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}<div id="rs-widget">${rWidget(s,w)}</div><div id="rs-fb">${rFb(s,w)}</div></div></div>`;
 if(focus)(st.querySelector(typeof focus==="string"?focus:"#rs-widget button:not(:disabled)")||st.querySelector("#rs-fb .btn"))?.focus({preventScroll:true})}
function rView(s,w){if(s.t==="dial"&&s.viz){const label=rFmt(w.v,s.dp)+" "+s.unit;
  if(s.viz==="syringe")return rSyringe(w.v/s.max,label,{max:s.max+" "+s.unit});
  const span=s.vmax-s.vmin;return rGauge((w.v-s.vmin)/span,label,{zone:w.solved?[(s.ok[0]-s.vmin)/span,Math.min(1,(s.ok[1]-s.vmin)/span)]:null,tag:"SET THE TARGET"})}
 if(s.viz&&s.viz[0]==="gauge")return rGauge(s.viz[1],s.viz[2],{tag:s.viz[3]});
 if(s.t==="defib")return rScene(s.scene)+rDefibFace(s,w);
 return rScene(w.solved&&s.after?s.after:s.scene)}
function rFb(s,w){const skip=!w.solved&&w.tries>=2&&["cpr","pace","clock","hold","pattern"].includes(s.t)?`<button class="textbtn" data-r="skip">Skip this drill (counts as missed)</button>`:"";
 if(w.solved)return `<div class="callout ${w.missed?"warning":""}" role="status"><b>${s.t==="info"?"":w.skipped?"Skipped":w.missed?"Corrected":"Correct"}</b>${w.note?`<p>${esc(w.note)}</p>`:""}${s.why?`<p>${esc(s.why)}</p>`:""}${s.ev?`<p class="rs-ev">AHA algorithm wording: “${esc(s.ev)}”</p>`:""}</div><div class="actionbar"><button class="btn" data-r="cont">${rRun.i===rRun.steps.length-1?"See your score":"Continue"} ${I("arrow",15)}</button></div>`;
 return w.msg?`<div class="callout warning" role="status"><b>Try again</b><p>${esc(w.msg)}</p>${skip}</div>`:""}
function rSolve(note){const R=rRun,s=R.steps[R.i],w=R.w;w.solved=true;w.note=note||"";w.msg="";if(R.id==="mega-vf"&&s.t==="defib")for(const next of R.steps.slice(R.i+1))if(next.t==="defib")next.ok=[Math.max(next.ok[0],RS_J[w.j]),next.ok[1]];if(rScored(s)&&R.ok[R.i]===undefined)R.ok[R.i]=!w.missed;rPaint("#rs-fb .btn")}
function rMiss(msg,focus){const w=rRun.w;w.missed=true;if(rScored(rRun.steps[rRun.i]))rRun.ok[rRun.i]=false;w.tries++;w.msg=msg;rPaint(focus)}
function rHit(){const v=document.querySelector("#rs-view .rs-scene");if(!v)return;v.classList.remove("rs-hit");void v.getBoundingClientRect();v.classList.add("rs-hit");rLater(()=>v.classList.remove("rs-hit"),170)}

function rWidget(s,w){const dis=w.solved?"disabled":"";
 if(s.t==="info")return w.solved?"":`<div class="actionbar"><button class="btn" data-r="cont">Continue ${I("arrow",15)}</button></div>`;
 if(s.t==="choice"){const opts=s.opts||s.o;return `<div class="options">${w.order.map((k,j)=>`<button class="answer ${w.solved&&k===w.right?"good":w.wrong.has(k)?"bad":""}" data-r="pick:${k}" ${w.solved||w.wrong.has(k)?"disabled":""}><span class="letter">${"ABCDE"[j]}</span><span>${esc(opts[k])}</span></button>`).join("")}</div>`}
 if(s.t==="multi"){const show=w.solved||w.tries>=2;return `<p class="quiet">Select every item that applies, then check.</p><div class="options rs-multi">${w.order.map(k=>{const [t,ok]=s.o[k],on=w.sel.has(k);return `<button class="answer ${show?(ok?"good":on?"bad":""):""} ${on?"on":""}" data-r="tog:${k}" aria-pressed="${on}" ${dis}><span class="letter">${on?"✓":""}</span><span>${esc(t)}</span></button>`}).join("")}</div>${w.solved?"":`<div class="actionbar"><button class="btn" data-r="check">Check selection</button></div>`}`}
 if(s.t==="tap")return s.n===1?`<div class="rs-center"><button class="rs-big ${s.big||""}" data-r="tap" ${dis}>${esc(s.label)}</button></div>`:`<div class="rs-center"><div class="rs-count" id="rs-count" aria-live="polite">${w.solved?s.n:w.c}</div><button class="rs-big" data-r="tap" ${dis}>${esc(s.label)}</button></div>${w.solved?"":`<div class="actionbar"><button class="btn" data-r="tapdone">Done</button><button class="soft" data-r="tapreset">Reset count</button></div>`}`;
 if(s.t==="hold")return `<div class="rs-center"><div class="rs-count" id="rs-count" aria-live="off">${w.solved?rFmt(w.held,1):"0.0"}<small> s</small></div><div class="rs-holdbar"><i id="rs-holdfill" style="width:${w.solved?Math.min(100,10*w.held):0}%"></i><span style="left:100%"></span></div><button class="rs-big" data-hold ${dis}>Hold to check</button><p class="quiet">Press and hold, by touch, mouse, or the space bar. Let go when you have your answer.</p></div>`;
 if(s.t==="dial")return `<div class="rs-dial"><button class="soft rs-step" data-r="dial:-1" aria-label="Decrease" ${dis}>−</button><output id="rs-dialv">${rFmt(w.v,s.dp)} <small>${esc(s.unit)}</small></output><button class="soft rs-step" data-r="dial:1" aria-label="Increase" ${dis}>+</button></div><input type="range" class="rs-range" data-rdial min="${s.min}" max="${s.max}" step="${s.step}" value="${w.v}" aria-label="${esc(s.unit)}" ${dis}>${w.solved?"":`<div class="actionbar"><button class="btn" data-r="dialok">Confirm</button></div>`}`;
 if(s.t==="keypad")return `<div class="rs-phone"><output id="rs-digits" aria-live="polite">${esc(w.d)||"&nbsp;"}</output><div class="rs-keys">${["1","2","3","4","5","6","7","8","9","del","0","call"].map(k=>`<button class="${k==="call"?"rs-call":"rs-key"}" data-r="${k==="call"?"call":"key:"+k}" aria-label="${k==="del"?"Delete":k==="call"?"Call":k}" ${dis}>${k==="del"?"⌫":k==="call"?"Call":k}</button>`).join("")}</div></div>`;
 if(s.t==="defib")return `<div class="rs-defib"><div class="rs-drow"><span>Energy</span><button class="soft rs-step" data-r="joule:-1" aria-label="Lower energy" ${dis}>−</button><button class="soft rs-step" data-r="joule:1" aria-label="Raise energy" ${dis}>+</button></div><input type="range" class="rs-range" data-rjoule min="0" max="${RS_J.length-1}" step="1" value="${w.j}" aria-label="Energy in joules" aria-valuetext="${RS_J[w.j]} joules" ${dis}><div class="rs-drow"><button class="soft rs-sync ${w.sync?"on":""}" data-r="sync" aria-pressed="${w.sync}" ${dis}>SYNC ${w.sync?"on":"off"}</button><button class="soft" data-r="charge" ${dis||w.state!=="idle"?"disabled":""}>Charge</button><button class="rs-shock" data-r="shock" ${w.state==="ready"&&!w.solved?"":"disabled"}>${I("spark",17)} Shock</button></div></div>`;
 if(s.t==="cpr")return `<div class="rs-center"><div class="rs-cprtop"><div class="rs-count"><span id="rs-count">${w.solved?s.n:w.taps.length}</span><small> / ${s.n}</small></div><div class="rs-rate"><b id="rs-rate">${w.rate?Math.round(w.rate):"—"}</b><small>per min</small></div></div><div class="rs-ratebar" aria-hidden="true"><i style="left:${100*(s.lo-60)/100}%;width:${100*(s.hi-s.lo)/100}%"></i><span id="rs-needle" style="left:${w.rate?Math.max(0,Math.min(100,w.rate-60)):0}%"></span><em style="left:0">60</em><em style="left:${s.lo-60}%">${s.lo}</em><em style="left:${s.hi-60}%">${s.hi}</em><em style="left:100%">160</em></div><button class="rs-big rs-push" data-r="push" ${dis}>PUSH</button><button class="textbtn" data-r="beat" aria-pressed="${w.beat}" ${dis}><span class="rs-beat ${w.beat&&!w.solved?"on":""}" aria-hidden="true"></span>Guide beat ${w.beat?"on":"off"}</button></div>`;
 if(s.t==="pace")return `<div class="rs-center"><div class="rs-count"><span id="rs-count">${w.solved?s.n:w.taps.length}</span><small> / ${s.n} breaths</small></div><p class="quiet" id="rs-gap" aria-live="polite">${w.taps.length>1?"":"The timer starts with your first breath."}</p><button class="rs-big rs-air" data-r="breath" ${dis}>Give breath</button></div>`;
 if(s.t==="pattern")return `<div class="rs-center"><div id="rs-pat">${rPatDots(s,w)}</div><div class="rs-two"><button class="rs-big" data-r="pat:c" ${dis}>Compress</button><button class="rs-big rs-air" data-r="pat:b" ${dis}>Breathe</button></div></div>`;
 if(s.t==="clock")return `<div class="rs-clock"><div class="rs-time" id="rs-time" aria-live="off">${rClock(w.t)}</div><div class="rs-line" aria-hidden="true"><i id="rs-linefill" style="width:${100*w.t/(s.mins*60)}%"></i>${Array.from({length:s.mins/2},(_,i)=>`<span style="left:${100*(i+1)*2/s.mins}%"></span>`).join("")}</div><p class="quiet" id="rs-epi">Epinephrine given at 0:00.</p>${w.on?`<div class="rs-two"><button class="rs-big" data-r="rc">Rhythm check</button><button class="rs-big rs-drug" data-r="epi">Give epinephrine</button></div>`:w.solved?"":`<div class="actionbar"><button class="btn" data-r="clockgo">Start the clock</button></div>`}<ul class="rs-log" id="rs-log" aria-live="polite">${w.log.map(x=>`<li class="${x[1]?"":"bad"}">${esc(x[0])}</li>`).join("")}</ul></div>`;
 return ""}
const rPatDots=(s,w)=>`<div class="rs-dots">${s.seq.map((k,i)=>`<i class="${k==="b"?"b":""} ${w.solved||i<w.pos?"on":""}"></i>`).join("")}</div><p class="quiet">Cycle ${Math.min(s.cycles,w.cyc+1)} of ${s.cycles}</p>`;
const rDefibFace=(s,w)=>`<div class="rs-dface" id="rs-dface"><div><small>ENERGY</small><b>${RS_J[w.j]} J</b></div><div class="${w.sync?"lit":""}"><small>SYNC</small><b>${w.sync?"ON":"OFF"}</b></div><div class="${w.state==="ready"?"hot":""}"><small>STATUS</small><b>${w.solved?"DELIVERED":w.state==="charging"?"CHARGING":w.state==="ready"?"CHARGED":"STANDBY"}</b></div></div>`;
const rDefibSync=(s,w)=>{const f=rEl("rs-dface");if(f)f.outerHTML=rDefibFace(s,w)};

function rSimClick(verb,arg,b){const R=rRun;if(!R||!rEl("rs-stage"))return;
 if(verb==="simgo"){rSimNew(R.id);rPaint(true);window.scrollTo(0,0);return}
 if(R.done)return;const s=R.steps[R.i],w=R.w;if(!w)return;
 if(verb==="cont"){if(s.t!=="info"&&!w.solved)return;resusStop();R.i++;R.w=null;if(R.i>=R.steps.length)rFinish();rPaint(true);rEl("rs-stage").scrollIntoView({block:"nearest"});if(R.done||R.steps[R.i]?.t==="info")rEl("rs-stage").querySelector(".btn")?.focus({preventScroll:true});else rEl("rs-stage").querySelector("#rs-widget button,#rs-widget input")?.focus({preventScroll:true});return}
 if(w.solved)return;
 if(verb==="skip"){resusStop();R.w=w;w.skipped=true;w.missed=true;rSolve("");return}
 if(verb==="pick"&&s.t==="choice"){const k=Number(arg);if(k===w.right)rSolve();else{w.wrong.add(k);rMiss("Not that one. Read the situation again and choose another.","#rs-widget .answer:not(:disabled)")}return}
 if(verb==="tog"&&s.t==="multi"){const k=Number(arg);w.sel.has(k)?w.sel.delete(k):w.sel.add(k);const on=w.sel.has(k);b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.querySelector(".letter").textContent=on?"✓":"";return}
 if(verb==="check"&&s.t==="multi"){const missing=s.o.filter(([,ok],k)=>ok&&!w.sel.has(k)).length,extra=s.o.filter(([,ok],k)=>!ok&&w.sel.has(k)).length;if(!missing&&!extra)rSolve();else rMiss(`${missing?missing+" item"+(missing===1?"":"s")+" from the algorithm still missing. ":""}${extra?extra+" selected item"+(extra===1?" is":"s are")+" not in the algorithm. ":""}${w.tries>=1?"The list is now marked: fix your selection and check again.":""}`,'[data-r="check"]');return}
 if(verb==="tap"&&s.t==="tap"){rHit();if(s.n===1){rSolve();return}if(w.c<s.n+9)w.c++;rEl("rs-count").textContent=w.c;return}
 if(verb==="tapreset"&&s.t==="tap"){w.c=0;rEl("rs-count").textContent=0;return}
 if(verb==="tapdone"&&s.t==="tap"){if(w.c===s.n)rSolve();else{const c=w.c;w.c=0;rMiss(`You gave ${c}. Check the number in the algorithm and count again.`,'[data-r="tap"]')}return}
 if(verb==="dial"&&s.t==="dial"){rDialSet(s,w,w.v+Number(arg)*s.step);const r=document.querySelector("[data-rdial]");if(r)r.value=w.v;return}
 if(verb==="dialok"&&s.t==="dial"){const e=s.step/1000;if(w.v>=s.ok[0]-e&&w.v<=s.ok[1]+e)rSolve();else rMiss(w.v<s.ok[0]?"Too low for what the algorithm lists. Work it out again.":"Too high for what the algorithm lists. Work it out again.","[data-rdial]");return}
 if(verb==="key"&&s.t==="keypad"){w.d=arg==="del"?w.d.slice(0,-1):(w.d+arg).slice(0,12);rEl("rs-digits").innerHTML=esc(w.d)||"&nbsp;";return}
 if(verb==="call"&&s.t==="keypad"){if(w.d===s.ok)rSolve("Calling "+s.ok+".");else{w.d="";rMiss("That number does not reach emergency services in the United States. Dial 911.",".rs-key")}return}
 if(s.t==="defib"){if(verb==="joule"){w.j=Math.max(0,Math.min(RS_J.length-1,w.j+Number(arg)));w.state="idle";rPaintWidget(s,w,`[data-r="joule:${arg}"]`);return}
  if(verb==="sync"){w.sync=!w.sync;w.state="idle";rPaintWidget(s,w,'[data-r="sync"]');return}
  if(verb==="charge"){w.state="charging";rPaintWidget(s,w);rLater(()=>{if(rRun&&rRun.w===w&&w.state==="charging"){w.state="ready";rPaintWidget(s,w,'[data-r="shock"]')}},900);return}
  if(verb==="shock"&&w.state==="ready"){const J=RS_J[w.j],okS=w.sync===s.sync,okJ=J>=s.ok[0]&&J<=s.ok[1];if(okS&&okJ){const m=document.querySelector("#rs-view .rs-monitor");m?.classList.add("rs-zap");rSolve(`${J} J delivered${s.sync?", synchronized":""}.`)}else{w.state="idle";rMiss(`${okS?"":"Check the SYNC setting for this shock. "}${okJ?"":J<s.ok[0]?"The energy is lower than the algorithm calls for. ":"The energy is higher than the algorithm calls for. "}The charge was dumped.`,'[data-r="charge"]')}return}}
 if(verb==="push"&&s.t==="cpr"){const t=performance.now();rHit();if(w.taps.length&&t-w.taps.at(-1)>2500)w.taps=[];w.taps.push(t);const n=w.taps.length,last=w.taps.slice(-6);if(last.length>1)w.rate=60000*(last.length-1)/(last.at(-1)-last[0]);
  rEl("rs-count").textContent=n;if(w.rate){rEl("rs-rate").textContent=Math.round(w.rate);rEl("rs-needle").style.left=Math.max(0,Math.min(100,w.rate-60))+"%"}
  if(n>=s.n){const avg=60000*(n-1)/(w.taps.at(-1)-w.taps[0]),r=Math.round(avg);w.rate=avg;if(r>=s.lo&&r<=s.hi)rSolve(`${s.n} compressions at an average of ${r}/min.`);else{w.taps=[];rMiss(`Your average pace was ${r}/min. The target is ${s.lo}-${s.hi}/min. ${r<s.lo?"Push faster.":"Slow down a little and let the chest recoil."}`,'[data-r="push"]')}}return}
 if(verb==="beat"&&s.t==="cpr"){w.beat=!w.beat;rPaintWidget(s,w,'[data-r="beat"]');return}
 if(verb==="breath"&&s.t==="pace"){const t=performance.now();rHit();w.taps.push(t);const n=w.taps.length;rEl("rs-count").textContent=n;if(n>1)rEl("rs-gap").textContent=`Last gap: ${((t-w.taps.at(-2))/1000).toFixed(1)} s`;
  if(n>=s.n){const gap=(t-w.taps[0])/(n-1)/1000,g=Math.round(gap*10)/10;if(g>=s.lo&&g<=s.hi)rSolve(`${s.n} breaths, on average one every ${g.toFixed(1)} seconds.`);else{w.taps=[];rMiss(`Your breaths averaged one every ${g.toFixed(1)} seconds. ${g<s.lo?"That is too fast.":"That is too slow."} Count it out and try again.`,'[data-r="breath"]')}}return}
 if(verb==="pat"&&s.t==="pattern"){rHit();if(arg===s.seq[w.pos]){w.pos++;if(w.pos>=s.seq.length){w.pos=0;w.cyc++}if(w.cyc>=s.cycles){rSolve(`${s.cycles} cycles in pattern.`);return}rEl("rs-pat").innerHTML=rPatDots(s,w)}else{w.pos=0;rMiss("Out of pattern. This cycle starts again from its first compression.",`[data-r="pat:c"]`)}return}
 if(s.t==="clock"){if(verb==="clockgo"){rClockStart(s,w);return}if(!w.on)return;
  if(verb==="rc"){if(w.t>=w.mark-10&&w.t<=w.mark+30){rLog(w,`${rClock(w.t)} Rhythm check, compressor change`,1);w.mark+=120;if(w.mark>s.mins*60)rClockEnd(s,w)}else{rLog(w,`${rClock(w.t)} Rhythm check off schedule`,0);w.errs.push(`A rhythm check at ${rClock(w.t)} was not on a 2-minute mark.`)}return}
  if(verb==="epi"){const gap=w.t-w.epi;if(gap<180){rLog(w,`${rClock(w.t)} Epinephrine too early`,0);w.errs.push(`Epinephrine at ${rClock(w.t)} came only ${rClock(gap)} after the last dose.`)}else rLog(w,`${rClock(w.t)} Epinephrine 1 mg`,1);w.epi=w.t;w.late=false;return}}
}
function rPaintWidget(s,w,focus){const el=rEl("rs-widget");if(!el)return;el.innerHTML=rWidget(s,w);if(s.t==="defib")rDefibSync(s,w);if(focus)el.querySelector(focus)?.focus({preventScroll:true})}
function rDialSet(s,w,v){const steps=Math.round((Math.max(s.min,Math.min(s.max,v))-s.min)/s.step);w.v=Number((s.min+steps*s.step).toFixed(4));const o=rEl("rs-dialv");if(o)o.innerHTML=`${rFmt(w.v,s.dp)} <small>${esc(s.unit)}</small>`;if(s.viz&&rEl("rs-view"))rEl("rs-view").innerHTML=rView(s,w)}
function rLog(w,text,ok){w.log.unshift([text,ok]);w.log=w.log.slice(0,8);const l=rEl("rs-log");if(l)l.innerHTML=w.log.map(x=>`<li class="${x[1]?"":"bad"}">${esc(x[0])}</li>`).join("")}
function rClockStart(s,w){Object.assign(w,{on:true,t:0,log:[],errs:[],mark:120,epi:0,late:false,t0:performance.now(),msg:""});rPaint('[data-r="rc"]');
 rEvery(()=>{if(!rRun||rRun.w!==w||!w.on)return;w.t=(performance.now()-w.t0)/1000*s.speed;const end=s.mins*60;
  if(w.t>w.mark+30&&w.mark<=end){rLog(w,`${rClock(w.mark)} Rhythm check missed`,0);w.errs.push(`The rhythm check at ${rClock(w.mark)} was missed.`);w.mark+=120}
  if(!w.late&&w.t-w.epi>300){w.late=true;rLog(w,`${rClock(w.t)} Epinephrine overdue`,0);w.errs.push(`More than 5 minutes passed after the ${rClock(w.epi)} dose of epinephrine.`)}
  const tm=rEl("rs-time");if(tm){tm.textContent=rClock(Math.min(w.t,end+30));rEl("rs-linefill").style.width=Math.min(100,100*w.t/end)+"%";rEl("rs-epi").textContent=`Last epinephrine ${rClock(w.t-w.epi)} ago (given at ${rClock(w.epi)}).`}
  if(w.mark>end||w.t>end+31)rClockEnd(s,w)},100)}
function rClockEnd(s,w){if(!w.on)return;w.on=false;resusStop();rRun.w=w;if(!w.errs.length)rSolve(`${s.mins} minutes with every rhythm check and every dose on time.`);else rMiss(w.errs.slice(0,4).join(" ")+" Run the clock again.",'[data-r="clockgo"]')}

/* Press-and-hold: pointer or keyboard. */
function rHoldStart(btn){const R=rRun,s=R&&R.steps[R.i],w=R&&R.w;if(!s||s.t!=="hold"||w.solved||rHold)return;rHold={t0:performance.now(),w,s};btn.classList.add("down");
 rHold.timer=rEvery(()=>{if(!rHold)return;const d=(performance.now()-rHold.t0)/1000,c=rEl("rs-count"),f=rEl("rs-holdfill");if(c)c.innerHTML=`${d.toFixed(1)}<small> s</small>`;if(f)f.style.width=Math.min(100,d*100/s.max)+"%";if(d>s.max)rHoldEnd(true)},100)}
function rHoldEnd(over){if(!rHold)return;const {t0,w,s,timer}=rHold,d=(performance.now()-t0)/1000;clearInterval(timer);rT.delete(timer);rHold=null;if(!rRun||rRun.w!==w)return;w.held=Math.min(d,s.max+.1);
 if(over||d>s.max)rMiss(`That took more than ${s.max} seconds. The check has to be finished within ${s.max} seconds.`,"[data-hold]");else if(d<s.min){w.msg="Keep holding while you look and feel, then let go.";rPaint("[data-hold]")}else rSolve(`You finished the check in ${d.toFixed(1)} seconds.`)}
document.addEventListener("pointerdown",e=>{const b=e.target.closest("[data-hold]");if(b&&!b.disabled){e.preventDefault();b.focus({preventScroll:true});rHoldStart(b)}});
for(const ev of ["pointerup","pointercancel"])document.addEventListener(ev,()=>rHoldEnd(false));
document.addEventListener("keydown",e=>{if((e.key===" "||e.key==="Enter")&&!e.repeat){const b=e.target.closest?.("[data-hold]");if(b&&!b.disabled){e.preventDefault();rHoldStart(b)}}else if((e.key===" "||e.key==="Enter")&&e.target.closest?.("[data-hold]"))e.preventDefault()});
document.addEventListener("keyup",e=>{if((e.key===" "||e.key==="Enter")&&rHold)rHoldEnd(false)});
document.addEventListener("input",e=>{const el=e.target,R=rRun;if(!R||!R.w||R.w.solved)return;const s=R.steps[R.i],w=R.w;
 if(el.matches?.("[data-rdial]")&&s.t==="dial")rDialSet(s,w,Number(el.value));
 if(el.matches?.("[data-rjoule]")&&s.t==="defib"){w.j=Number(el.value);el.setAttribute("aria-valuetext",RS_J[w.j]+" joules");if(w.state!=="idle"){w.state="idle";rPaintWidget(s,w,"[data-rjoule]")}else rDefibSync(s,w)}});

function rFinish(){const R=rRun,scored=R.steps.map((s,i)=>[s,i]).filter(([s])=>rScored(s)),good=scored.filter(([,i])=>R.ok[i]===true).length,pct=scored.length?Math.round(100*good/scored.length):100,S=rs(),d=S.sims[R.id]||[0,0,0];
 R.done=true;R.rec={pct,good,n:scored.length,best:Math.max(d[1],pct),first:!d[0]};S.sims[R.id]=[d[0]+1,Math.max(d[1],pct),NOW()];save()}
function rResult(){const R=rRun,s=RSIM[R.id],u=RUNIT(s.unit),r=R.rec,ix=u.sims.indexOf(R.id),nx=u.sims[ix+1];
 return `<div class="rs-result"><span class="kicker">${r.pct>=80?"PASSED":"NOT YET"}</span><h2>${r.pct}% · ${r.good} of ${r.n} scored steps right the first time</h2><p>${r.pct>=80?"That is a pass. Run it again another day to keep it.":"A pass is 80%. Every miss below shows the algorithm wording to study."} Best so far: ${r.best}%.</p><div class="actionbar"><button class="btn" data-r="simgo">Run it again</button>${nx?`<button class="soft" data-go="resus/sim/${nx}">Next: ${esc(RSIM[nx].title)}</button>`:""}<button class="soft" data-go="resus/u/${u.id}/quiz">Quiz this unit</button><button class="textbtn" data-go="resus/u/${u.id}/algo">Open the algorithm</button></div>
 <ol class="rs-review">${R.steps.map((st,i)=>rScored(st)?`<li class="${R.ok[i]?"ok":"no"}"><b>${R.ok[i]?"First try":"Needed another try"}</b><span>${esc(st.q)}</span>${R.ok[i]?"":`<em>${esc(st.why)} AHA algorithm wording: “${esc(st.ev)}”</em>`}</li>`:"").join("")}</ol></div>`}
