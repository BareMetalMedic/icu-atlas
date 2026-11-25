/* Floor: procedural ECG engine, rhythm library, 6-second strips with calipers, and a live bedside monitor.
   Paper: 25 mm/s, 10 mm/mV. 1 small box = 1 mm = 0.04 s; 1 large box = 5 mm = 0.20 s. Everything is drawn from a
   beat schedule, so every strip is new (seeded) but always obeys the rhythm's rules. */
const FE_RNG=seed=>{let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const FE_G=(t,mu,s,a)=>a*Math.exp(-((t-mu)*(t-mu))/(2*s*s));
const FE_FS=250;
// One beat: t = QRS onset (s). p = P-wave peak time or null. kind: n (narrow) | w (wide, aberrant/BBB) | v (ventricular) | pace.
function feBeat(t,o={}){return {t,kind:"n",p:null,pAmp:.15,pInv:false,tAmp:.32,...o}}
function feWave(beats,base,t){
 let v=0;
 for(const b of beats){const d=t-b.t;if(d<-.45||d>.75)continue;
  if(b.p!=null)v+=FE_G(t,b.p,.022,b.pInv?-b.pAmp:b.pAmp);
  if(b.dead)continue;
  const qt=b.qt||.36;
  if(b.kind==="n"){v+=FE_G(t,b.t+.012,.007,-.08)+FE_G(t,b.t+.038,.009,1.15)+FE_G(t,b.t+.062,.009,-.24)+FE_G(t,b.t+qt-.09,.045,b.tAmp)}
  else if(b.kind==="w"){v+=FE_G(t,b.t+.03,.012,.75)+FE_G(t,b.t+.085,.016,.6)+FE_G(t,b.t+.115,.012,-.2)+FE_G(t,b.t+qt-.06,.05,-.22)}
  else if(b.kind==="v"){const s=b.sign||1;v+=s*(FE_G(t,b.t+.055,.03,1.25)+FE_G(t,b.t+.12,.022,-.35))+FE_G(t,b.t+qt,.07,-s*.45)}
  else if(b.kind==="pace"){v+=FE_G(t,b.t,.0018,1.6)+FE_G(t,b.t+.06,.03,-1.0)+FE_G(t,b.t+.13,.025,.25)+FE_G(t,b.t+qt+.02,.07,.4)}
 }
 return v+base(t);
}
// Baselines
const feNoise=r=>{const ph=r()*6.28,w=.25+r()*.15;return t=>.025*Math.sin(6.283*w*t+ph)+.012*(Math.sin(t*97.3+ph)*Math.sin(t*41.7))};
const feFib=(r,amp=.042)=>{const c=Array.from({length:6},()=>[4.2+r()*3.6,r()*6.28,amp*(.4+r()*.8)]);return t=>c.reduce((s,[f,p,a])=>s+a*Math.sin(6.283*f*t+p),0)};
const feFlutter=(r,rate=300)=>{const f=rate/60,ph=r();return t=>{const x=(t*f+ph)%1;return -.32*(x<.78?x/.78:(1-x)/.22)+.14}};
const feVF=(r,coarse=true)=>{const c=Array.from({length:7},()=>[3.5+r()*4,r()*6.28,(coarse?.35:.12)*(.5+r())]);return t=>c.reduce((s,[f,p,a])=>s+a*Math.sin(6.283*f*t+p+.8*Math.sin(t*1.3+p)),0)*(.7+.3*Math.sin(t*.9))};
const feArtifact=r=>{const n=feNoise(r);return t=>n(t)+(t>1.6&&t<4.2?(.55*Math.sin(t*61)*Math.sin(t*23.3)+.4*Math.sin(t*9.1)+.3*Math.sin(t*137)):0)};
const fePR=hr=>.16,feQT=rr=>Math.min(.46,Math.max(.28,.4*Math.sqrt(rr)));

/* Rhythm library. gen(r,dur) → {beats, base, hr}. Facts per rhythm: rate, regularity, P waves, PR, QRS. why = cell to conduction.
   floor = what the floor nurse does. Sources: AHA 2025 ACLS algorithms; OpenStax A&P 2e ch. 19; StatPearls ECG chapters. */
function feSinusBeats(r,dur,hr,jit=.02,o={}){const out=[];let t=.25+r()*.4;while(t<dur+.5){const rr=60/hr*(1+(r()-.5)*jit);out.push(feBeat(t,{p:t-(o.pr||.16)+.05,qt:feQT(rr),...o}));t+=rr}return out}
const FE_RHYTHMS=[
 {id:"nsr",name:"Normal sinus rhythm",group:"Sinus",rate:"60–100",reg:"Regular",p:"Upright, one before every QRS",pr:"0.12–0.20 s",qrs:"< 0.12 s",
  gen:(r,d)=>{const hr=64+r()*30;return{beats:feSinusBeats(r,d,hr),base:feNoise(r),hr}},
  why:"The SA node fires 60–100 times a minute because its cells leak sodium and calcium inward (the funny current) until they reach threshold. The impulse spreads through the atria (P wave), pauses in the AV node (PR segment) so the ventricles can fill, then races down the His-Purkinje system (narrow QRS).",
  floor:"Baseline. Know the patient's normal rate and rhythm at the start of the shift so you notice a change."},
 {id:"sbrady",name:"Sinus bradycardia",group:"Sinus",rate:"< 60",reg:"Regular",p:"Normal, one per QRS",pr:"Normal",qrs:"Narrow",
  gen:(r,d)=>{const hr=40+r()*14;return{beats:feSinusBeats(r,d,hr),base:feNoise(r),hr}},
  why:"Slower SA-node firing: high vagal tone (sleep, athletes, vomiting, bearing down), beta blockers, calcium channel blockers, digoxin, hypothermia, hypothyroidism, increased intracranial pressure, or ischemia of the SA node (often RCA territory).",
  floor:"Look at the patient, not the number. Asymptomatic and asleep: document and watch. Symptomatic (hypotension, altered mental status, chest pain, signs of shock, acute heart failure): call a rapid response, attach pads, and follow the bradycardia algorithm (atropine 1 mg IV, repeat every 3–5 min, max 3 mg; then pacing or dopamine/epinephrine infusion). Check what you gave: hold the next beta blocker or diltiazem dose and call the provider."},
 {id:"stach",name:"Sinus tachycardia",group:"Sinus",rate:"100–150 (rarely higher)",reg:"Regular",p:"Normal (may merge into the T at fast rates)",pr:"Normal",qrs:"Narrow",
  gen:(r,d)=>{const hr=108+r()*30;return{beats:feSinusBeats(r,d,hr,.015),base:feNoise(r),hr}},
  why:"The body asking for more cardiac output: pain, fever, fear, hypovolemia, bleeding, hypoxia, anemia, sepsis, PE, withdrawal, stimulants. The SA node is responding normally to sympathetic drive.",
  floor:"Treat the cause, not the rate. Find it: pain score, temperature, blood loss, I&O, SpO2, new oxygen need, signs of DVT/PE (post-op ortho), withdrawal. Never rate-control a compensatory sinus tach with a beta blocker or diltiazem without the provider knowing the cause."},
 {id:"afib",name:"Atrial fibrillation",group:"Atrial",rate:"Variable; RVR if > 100",reg:"Irregularly irregular",p:"None; wavy fibrillatory baseline",pr:"None",qrs:"Narrow",
  gen:(r,d)=>{const hr=72+r()*24,out=[];let t=.2+r()*.3;while(t<d+.5){const rr=60/hr*(.55+r()*.95);out.push(feBeat(t,{qt:feQT(rr)}));t+=rr}return{beats:out,base:(f=>t=>f(t)+feNoise(r)(t)*.5)(feFib(r)),hr}},
  why:"Hundreds of chaotic re-entry wavelets, usually started by triggers in the pulmonary vein sleeves, keep the atria quivering at 350–600/min. No organized atrial contraction (lost 'atrial kick', 15–30% of filling) and blood pools in the left atrial appendage, which is why stroke risk and anticoagulation matter. The AV node lets impulses through at random, so the R-R intervals are irregularly irregular.",
  floor:"New AFib: vitals and symptoms first, then a 12-lead, BMP and Mg, and call the provider (SBAR: rate, BP, symptoms, onset time, anticoagulant status). Controlled rate (< 100) and stable: rate control and anticoagulation decisions belong to the provider. Know the onset time; it changes cardioversion decisions."},
 {id:"afrvr",name:"Atrial fibrillation with RVR",group:"Atrial",rate:"> 100 (often 120–170)",reg:"Irregularly irregular",p:"None",pr:"None",qrs:"Narrow",
  gen:(r,d)=>{const hr=128+r()*30,out=[];let t=.15+r()*.2;while(t<d+.5){const rr=60/hr*(.6+r()*.8);out.push(feBeat(t,{qt:feQT(rr),tAmp:.25}));t+=rr}return{beats:out,base:(f=>t=>f(t)+feNoise(r)(t)*.5)(feFib(r,.035)),hr}},
  why:"Same chaotic atria, but the AV node conducts too many impulses: less filling time, falling stroke volume, rising myocardial oxygen demand. Triggers on the floor: post-op state, pain, hypovolemia, infection, hypokalemia, hypomagnesemia, missed beta blocker, alcohol withdrawal, PE, hyperthyroidism.",
  floor:"Stable (BP holding, mentating, no chest pain, no acute HF): 12-lead, labs (K, Mg, TSH per provider), SBAR, then rate control as ordered (IV diltiazem or metoprolol; check BP right before and after). Unstable (hypotension, altered mental status, shock signs, ischemic chest pain, acute HF): rapid response, pads on, synchronized cardioversion per the tachycardia algorithm."},
 {id:"flutter",name:"Atrial flutter",group:"Atrial",rate:"Atria ≈ 300; ventricles often 150 (2:1) or 75 (4:1)",reg:"Usually regular",p:"Sawtooth flutter waves",pr:"Not measurable",qrs:"Narrow",
  gen:(r,d)=>{const ratio=r()<.5?2:4,hr=300/ratio,out=[];let t=.25;while(t<d+.5){out.push(feBeat(t,{qt:feQT(60/hr)}));t+=60/hr}return{beats:out,base:(f=>t=>f(t)+feNoise(r)(t)*.4)(feFlutter(r)),hr,note:ratio+":1 conduction"}},
  why:"One large re-entry circuit loops around the right atrium (usually around the tricuspid annulus) about 300 times a minute, drawing the sawtooth. The AV node blocks a fixed share, so the ventricular rate is a neat fraction: 150 (2:1), 100 (3:1), 75 (4:1). A regular narrow rate of exactly ~150 should make you look for hidden flutter waves.",
  floor:"Same thinking as AFib: stability, 12-lead, labs, SBAR. Flutter is hard to rate-control and stroke risk is treated like AFib."},
 {id:"svt",name:"Supraventricular tachycardia (SVT)",group:"Atrial",rate:"150–250",reg:"Regular",p:"Usually hidden",pr:"Not measurable",qrs:"Narrow",
  gen:(r,d)=>{const hr=170+r()*40,out=[];let t=.2;while(t<d+.5){out.push(feBeat(t,{qt:.26,tAmp:.22}));t+=60/hr}return{beats:out,base:feNoise(r),hr}},
  why:"Most often AV nodal re-entry: two pathways in or near the AV node with different speeds form a loop. A premature beat finds one path blocked, travels the other, and re-enters, spinning at 150–250/min. Abrupt onset and abrupt offset.",
  floor:"Stable: vagal maneuvers (modified Valsalva), then adenosine 6 mg rapid IV push with an immediate saline flush through the closest port; 12 mg if needed. Warn the patient: a few seconds of a sense of doom and a pause on the monitor are expected. Run a strip during the push. Unstable: synchronized cardioversion."},
 {id:"pac",name:"Sinus rhythm with PACs",group:"Atrial",rate:"Underlying rate",reg:"Irregular at the early beats",p:"Early P, different shape",pr:"Normal or slightly different",qrs:"Narrow",
  gen:(r,d)=>{const hr=72+r()*14,out=[];let t=.3,i=0;while(t<d+.5){let rr=60/hr;const early=i%4===2&&r()<.9;if(early){out.push(feBeat(t-rr*.3,{p:t-rr*.3-.11,pAmp:.12,pInv:r()<.4,qt:.34}));t+=rr*.95}else out.push(feBeat(t,{p:t-.11,qt:feQT(rr)}));t+=rr;i++}return{beats:out,base:feNoise(r),hr}},
  why:"An irritable spot in the atria fires before the SA node. Caffeine, stress, stretch from heart failure, low K or Mg, COPD, alcohol. The early P wave looks different because it starts somewhere else.",
  floor:"Usually benign. Frequent or increasing PACs can come before AFib: check K and Mg trends and mention it in report."},
 {id:"junct",name:"Junctional rhythm",group:"Junctional",rate:"40–60 (accelerated 60–100)",reg:"Regular",p:"Absent, inverted before, or after the QRS",pr:"< 0.12 s if P present",qrs:"Narrow",
  gen:(r,d)=>{const hr=42+r()*16,out=[];let t=.4;const mode=r();while(t<d+.5){out.push(feBeat(t,{p:mode<.5?null:t-.07,pInv:true,pAmp:.12,qt:feQT(60/hr)}));t+=60/hr}return{beats:out,base:feNoise(r),hr}},
  why:"The AV junction takes over as pacemaker (intrinsic rate 40–60) when the SA node fails or slows. The impulse travels backward up into the atria (inverted P) and forward into the ventricles at the same time. Causes: digoxin toxicity, ischemia (inferior MI), beta blockers, post cardiac surgery.",
  floor:"Assess for symptoms of low output. Check digoxin dose, level and K. Notify the provider; hold rate-slowing meds until they answer."},
 {id:"avb1",name:"First-degree AV block",group:"AV block",rate:"Underlying",reg:"Regular",p:"Normal, one per QRS",pr:"> 0.20 s, constant",qrs:"Narrow",
  gen:(r,d)=>{const hr=62+r()*20,pr=.26+r()*.08;return{beats:feSinusBeats(r,d,hr,.02,{pr}),base:feNoise(r),hr,pr}},
  why:"Every impulse gets through, just slowly: delay in the AV node. Beta blockers, calcium channel blockers, digoxin, amiodarone, ischemia, high vagal tone, aging conduction tissue.",
  floor:"Usually no symptoms. Measure and document the PR each shift; watch for it getting longer or for dropped beats. Mention it before rate-slowing meds."},
 {id:"avb2i",name:"Second-degree AV block, type I (Wenckebach)",group:"AV block",rate:"Atrial normal; ventricular a bit slower",reg:"Regularly irregular (grouped beats)",p:"Normal; one P without a QRS",pr:"Gets longer each beat until a QRS drops",qrs:"Narrow",
  gen:(r,d)=>{const hr=78+r()*12,rr=60/hr,out=[];let t=.25,k=0;const cyc=3+Math.floor(r()*2);while(t<d+.6){const pT=t,i=k%(cyc+1);if(i<cyc){const pr=.18+i*.08;out.push(feBeat(pT+pr-.05,{p:pT,qt:.36}))}else out.push(feBeat(pT+.2,{p:pT,dead:true}));t+=rr;k++}return{beats:out,base:feNoise(r),hr:Math.round(hr*cyc/(cyc+1))}},
  why:"The AV node fatigues: each impulse arrives during more of its refractory period, conduction slows (PR lengthens) until one impulse can't get through. The pause lets the node recover and the cycle restarts. Block is at the AV node itself, so it is usually stable.",
  floor:"Usually benign (inferior MI, drugs, vagal tone). Assess, document, review rate-slowing meds with the provider. Treat only if symptomatic."},
 {id:"avb2ii",name:"Second-degree AV block, type II (Mobitz II)",group:"AV block",rate:"Ventricular slower than atrial",reg:"Irregular where beats drop",p:"Normal; some not followed by a QRS",pr:"Constant before every conducted beat",qrs:"Often wide",
  gen:(r,d)=>{const hr=76+r()*10,rr=60/hr,out=[];let t=.25,k=0;while(t<d+.6){const drop=k%3===2;out.push(drop?feBeat(t+.2,{p:t,dead:true}):feBeat(t+.15,{p:t+.05,kind:r()<.6?"w":"n",qt:.4}));t+=rr;k++}return{beats:out,base:feNoise(r),hr:Math.round(hr*2/3)}},
  why:"The block is below the AV node (His bundle or bundle branches). Conduction is all-or-nothing: the PR never changes, and suddenly a beat doesn't conduct. It can progress without warning to complete heart block, which is why it is the dangerous one.",
  floor:"Call the provider now even if the patient looks fine. Pads on the patient (transcutaneous pacing ready), hold rate-slowing meds, be ready for the bradycardia algorithm. Atropine often fails at this level of block; pacing is the plan."},
 {id:"avb3",name:"Third-degree (complete) heart block",group:"AV block",rate:"Atria 60–100; ventricles 20–40 (wide) or 40–60 (narrow)",reg:"P–P regular and R–R regular, unrelated",p:"Normal, march through at their own rate",pr:"Varies; no relationship",qrs:"Wide if ventricular escape",
  gen:(r,d)=>{const ah=75+r()*15,vh=32+r()*8,out=[];for(let t=.15;t<d+.5;t+=60/ah)out.push(feBeat(t,{p:t,dead:true}));for(let t=.5+r()*.4;t<d+.5;t+=60/vh)out.push(feBeat(t,{kind:"v",qt:.46,sign:1}));return{beats:out,base:feNoise(r),hr:Math.round(vh)}},
  why:"Nothing from the atria reaches the ventricles. A backup pacemaker below the block keeps the ventricles going at its own slow rate. P waves and QRS complexes are each regular but have no relationship; some P waves hide inside QRS or T waves.",
  floor:"Emergency. Rapid response, pads on and pacing ready, assess perfusion, IV access, follow the bradycardia algorithm. Atropine is unlikely to work with a wide escape. Hold all AV-blocking drugs."},
 {id:"pvc",name:"Sinus rhythm with PVCs",group:"Ventricular",rate:"Underlying",reg:"Irregular at the PVCs",p:"None before the PVC",pr:"None for the PVC",qrs:"PVC wide (≥ 0.12 s) and bizarre, T opposite",
  gen:(r,d)=>{const hr=70+r()*16,rr=60/hr,out=[];let t=.3,i=0;const big=r()<.5;while(t<d+.6){if(big?i%2===1:i%4===2){out.push(feBeat(t-rr*.35,{kind:"v",qt:.38}));t+=rr*.35}else out.push(feBeat(t,{p:t-.11,qt:feQT(rr)}));t+=rr;i++}return{beats:out,base:feNoise(r),hr,note:big?"Every other beat is a PVC: ventricular bigeminy":""}},
  why:"An irritable ventricular cell fires early. The impulse spreads muscle-to-muscle instead of through the fast Purkinje fibers, so the QRS is wide and strange and repolarization runs backward (T wave opposite the QRS). A full compensatory pause usually follows. Low K or Mg, ischemia, hypoxia, stimulants, heart failure, digoxin toxicity, a central line tip irritating the ventricle.",
  floor:"Count them and look at the trend. Check K and Mg (many cardiac units replace to K ≥ 4.0 and Mg ≥ 2.0 per protocol), SpO2, chest pain. New, frequent, multifocal or runs: call the provider. A PVC landing on the T wave can trigger VT."},
 {id:"vt",name:"Ventricular tachycardia (monomorphic)",group:"Ventricular",rate:"120–250",reg:"Regular",p:"None visible (AV dissociation)",pr:"None",qrs:"Wide, all the same shape",
  gen:(r,d)=>{const hr=160+r()*30,out=[];let t=.15;while(t<d+.5){out.push(feBeat(t,{kind:"v",qt:.26,sign:r()<.5?1:-1}));t+=60/hr}const s=out[0]?.sign||1;out.forEach(b=>b.sign=s);return{beats:out,base:feNoise(r),hr}},
  why:"Re-entry around scar (old MI, cardiomyopathy) or a rapidly firing ventricular focus. The ventricles beat fast and out of step with the atria, filling time collapses, and output can fall to nothing.",
  floor:"Check the patient and a pulse first. No pulse: code (CPR, defibrillate). Pulse and unstable: synchronized cardioversion. Pulse and stable: rapid response, 12-lead, amiodarone per orders (150 mg over 10 min), pads on. Check K and Mg."},
 {id:"vf",name:"Ventricular fibrillation",group:"Ventricular",rate:"None measurable",reg:"Chaotic",p:"None",pr:"None",qrs:"None; chaotic waves",
  gen:(r,d)=>({beats:[],base:feVF(r,r()<.6),hr:0}),
  why:"Thousands of disorganized re-entry wavelets; the ventricles quiver and pump nothing. Untreated, coarse VF fades to fine VF and then asystole within minutes.",
  floor:"Check the patient: unresponsive, no pulse. Call the code, start compressions, defibrillate as soon as the defibrillator is on. A loose lead looks like VF on a talking patient: always look before you shock."},
 {id:"asys",name:"Asystole",group:"Ventricular",rate:"0",reg:"None",p:"None (sometimes P waves alone)",pr:"None",qrs:"None",
  gen:(r,d)=>({beats:r()<.4?Array.from({length:8},(_,i)=>feBeat(.3+i*.78,{p:.3+i*.78,dead:true})):[],base:t=>.015*Math.sin(t*1.7),hr:0}),
  why:"No ventricular electrical activity. Not shockable: there is nothing to reset.",
  floor:"Confirm in another lead and check that leads are attached and gain is up. Then code: CPR and epinephrine; look for reversible causes (Hs and Ts)."},
 {id:"vpace",name:"Ventricular paced rhythm",group:"Paced",rate:"Set rate (often 60–70)",reg:"Regular",p:"May be absent",pr:"None",qrs:"Pacer spike then wide QRS",
  gen:(r,d)=>{const hr=r()<.5?60:70,out=[];for(let t=.3;t<d+.5;t+=60/hr)out.push(feBeat(t,{kind:"pace",qt:.42}));return{beats:out,base:feNoise(r),hr}},
  why:"A pacemaker lead in the right ventricle fires (the spike), and the impulse spreads muscle-to-muscle, so the QRS is wide. Each spike should be followed by a QRS (capture).",
  floor:"Know the patient has a pacer and its set rate. Problems to catch: spikes without a QRS (failure to capture), no spikes when the rate drops below the set rate (failure to pace), spikes firing on top of the patient's own beats (failure to sense). Call the provider for any of these."},
 {id:"artifact",name:"Artifact (movement)",group:"Look-alikes",rate:"The real rhythm underneath",reg:"Underlying rhythm visible before and after",p:"Visible outside the noise",pr:"Normal",qrs:"Normal QRS keeps marching through the noise",
  gen:(r,d)=>{const hr=78+r()*12;return{beats:feSinusBeats(r,d,hr),base:feArtifact(r),hr}},
  why:"Brushing teeth, shivering, tremor, CPT, a loose electrode. Skeletal muscle and lead movement make electrical noise that can look like VT or VF on the monitor.",
  floor:"Look at the patient before anything else. Talking and pink means artifact. Find the normal QRS marching through the noise, fix electrodes (fresh pads, dry skin), and document. Never shock a strip; shock a patient."},
];
const feById=id=>FE_RHYTHMS.find(x=>x.id===id);
// Build a strip: { id, seed, dur, beats, base, hr }
function feStrip(id,seed=Math.floor(Math.random()*1e9),dur=6){const R=feById(id),r=FE_RNG(seed),g=R.gen(r,dur);return{id,seed,dur,...g}}
function feSamples(s,from=0,to=s.dur,fs=FE_FS){const n=Math.round((to-from)*fs),out=new Float32Array(n);for(let i=0;i<n;i++)out[i]=feWave(s.beats,s.base,from+i/fs);return out}

// 6-second strip as SVG in millimetres: x = t·25, y = baseline − mV·10.
function feStripSVG(s,{cal=false,label=true,h=36,id="fs",from=0,to=s.dur}={}){
 const W=(to-from)*25,base=h*.62,pts=feSamples(s,from,to);let d="";for(let i=0;i<pts.length;i++){const x=(i/FE_FS*25).toFixed(2),y=(base-pts[i]*10).toFixed(2);d+=(i?"L":"M")+x+" "+y}
 let grid="";for(let x=0;x<=W;x++)grid+=`<line x1="${x}" y1="0" x2="${x}" y2="${h}" class="${x%5?"gm":"gM"}"/>`;for(let y=0;y<=h;y++)grid+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" class="${y%5?"gm":"gM"}"/>`;
 const ticks=[0,3,6].filter(sec=>sec*25<=W).map(sec=>`<line x1="${sec*25}" y1="0" x2="${sec*25}" y2="3" class="gT"/>`).join("");
 const ca=W*.27,cb=W*.4,calTool=cal?`<g class="cal" data-cal="${id}"><rect class="calBand" x="${ca}" y="0" width="${cb-ca}" height="${h}"/><line class="calA" x1="${ca}" y1="0" x2="${ca}" y2="${h}"/><line class="calB" x1="${cb}" y1="0" x2="${cb}" y2="${h}"/><circle class="calHA" cx="${ca}" cy="${h-2.5}" r="2.3"/><circle class="calHB" cx="${cb}" cy="${h-2.5}" r="2.3"/></g>`:"";
 return `<svg class="fe-strip" id="${id}" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" role="img" aria-label="Six-second ECG strip, lead II">${grid}${ticks}<path d="${d}" class="trace"/>${label?`<text x="1.5" y="4.2" class="lead">II${from?` · ${from}–${to} s`:""}</text>`:""}${calTool}</svg>`;
}
// Calipers: drag either handle (or the band) along the strip; read ms, small boxes and rate.
function feCalMount(id,onChange){
 const svg=document.getElementById(id);if(!svg)return;const g=svg.querySelector(".cal");if(!g)return;
 const W=svg.viewBox.baseVal.width;let a=W*.27,b=W*.4,drag=null,off=0;
 const draw=()=>{const lo=Math.min(a,b),hi=Math.max(a,b);g.querySelector(".calA").setAttribute("x1",a);g.querySelector(".calA").setAttribute("x2",a);g.querySelector(".calB").setAttribute("x1",b);g.querySelector(".calB").setAttribute("x2",b);g.querySelector(".calHA").setAttribute("cx",a);g.querySelector(".calHB").setAttribute("cx",b);const band=g.querySelector(".calBand");band.setAttribute("x",lo);band.setAttribute("width",hi-lo);const ms=Math.round((hi-lo)*40);onChange&&onChange({ms,boxes:(hi-lo),rate:ms?Math.round(60000/ms):0})};
 const xOf=e=>{const r=svg.getBoundingClientRect();return Math.max(0,Math.min(W,(e.clientX-r.left)/r.width*W))};
 svg.addEventListener("pointerdown",e=>{const x=xOf(e);const da=Math.abs(x-a),db=Math.abs(x-b),lo=Math.min(a,b),hi=Math.max(a,b);drag=da<4&&da<=db?"a":db<4?"b":(x>lo&&x<hi?"band":(da<db?"a":"b"));off=x-a;svg.setPointerCapture(e.pointerId);if(drag!=="band"){drag==="a"?a=x:b=x;draw()}e.preventDefault()});
 svg.addEventListener("pointermove",e=>{if(!drag)return;const x=xOf(e);if(drag==="a")a=x;else if(drag==="b")b=x;else{const w=b-a;a=Math.max(0,Math.min(W-Math.abs(w),x-off));b=a+w}draw()});
 const up=()=>drag=null;svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
 svg.feSet=(x1,x2)=>{a=x1;b=x2;draw()};draw();
}

/* Live bedside monitor (Philips-style layout: waveforms left, big numerics right, alarm bar on top).
   state: { rhythm, seed, hr?, spo2, nbp:[s,d], rr, temp, alarm:{level:'red'|'yellow'|'cyan', text} }. */
let FE_MON=null;
function feMonitorHTML(id="fmon"){return `<div class="fe-mon" id="${id}"><div class="fe-alarm" hidden></div><canvas aria-label="Bedside monitor showing ECG lead II, SpO2 pleth and respirations"></canvas><div class="fe-num"><div class="n hr"><small>HR</small><b>--</b><i>bpm</i></div><div class="n sp"><small>SpO₂</small><b>--</b><i>%</i></div><div class="n bp"><small>NBP <span class="nbpt"></span></small><b>--/--</b><i class="map">(--)</i></div><div class="n rr"><small>RESP</small><b>--</b><i>rpm</i></div><div class="n tp"><small>TEMP</small><b>--</b><i>°C</i></div></div></div>`}
function feMonitorStart(id,state){
 feMonitorStop();const el=document.getElementById(id);if(!el)return;const cv=el.querySelector("canvas"),ctx=cv.getContext("2d");
 const M={el,cv,ctx,state:{...state},raf:0,t0:performance.now(),x:0,strip:null,stripT:0,still:!!(typeof profile!=="undefined"&&profile.prefs?.still)};
 const size=()=>{const r=cv.getBoundingClientRect(),dp=Math.min(2,devicePixelRatio||1);cv.width=Math.max(300,r.width*dp);cv.height=Math.max(150,r.height*dp);M.dp=dp;ctx.fillStyle="#000";ctx.fillRect(0,0,cv.width,cv.height);M.prev=null};
 size();M.resize=size;addEventListener("resize",size);
 M.set=s=>{const ch=s.rhythm&&(s.rhythm!==M.state.rhythm||s.seed!==M.state.seed);M.state={...M.state,...s};if(ch)M.strip=null;feNumerics(M)};
 const newStrip=()=>{M.strip=feStrip(M.state.rhythm,M.state.seed??Math.floor(Math.random()*1e9),12);M.stripT=0};
 feNumerics(M);
 // About 6 s across a wide screen; narrow phone screens show fewer seconds so complexes stay readable.
 const pxPerS=()=>cv.width/Math.max(3,Math.min(6.4,cv.width/M.dp/58));
 const frame=now=>{
  const dt=Math.min(.1,(now-(M.last||now))/1000);M.last=now;if(!M.strip)newStrip();
  const h=cv.height,rows=[h*.1,h*.5,h*.7,h*.88],fs=FE_FS;let steps=Math.max(1,Math.round(dt*fs));
  for(let k=0;k<steps;k++){
   M.stripT+=1/fs;if(M.stripT>=M.strip.dur-.6){const keep=M.state.seed;M.state.seed=keep!=null?keep+1:undefined;newStrip()}
   const x=M.x;M.x+=pxPerS()/fs;if(M.x>=cv.width){M.x=0;M.prev=null}
   const t=M.stripT,ecg=feWave(M.strip.beats,M.strip.base,t);
   // pleth: pulse 0.22 s after each conducted QRS
   let pl=0;for(const b of M.strip.beats){if(b.dead)continue;const d=t-b.t-.22;if(d>-.05&&d<.9)pl+=Math.max(0,Math.exp(-((d-.12)**2)/.006)*.9+Math.exp(-((d-.38)**2)/.01)*.25)}
   if(M.state.rhythm==="vf"||M.state.rhythm==="asys")pl=0;
   const resp=Math.sin(t*6.283*(M.state.rr||16)/60);
   ctx.fillStyle="#000";ctx.fillRect(x,0,Math.ceil(pxPerS()/fs)+8*M.dp,h);
   const y1=rows[0]+h*.22-ecg*h*.17,y2=rows[2]-pl*h*.15,y3=rows[3]-resp*h*.045;
   if(M.prev){ctx.lineWidth=1.6*M.dp;ctx.lineJoin="round";
    ctx.strokeStyle="#3df27a";ctx.beginPath();ctx.moveTo(M.prev[0],M.prev[1]);ctx.lineTo(x,y1);ctx.stroke();
    ctx.strokeStyle="#35d4f5";ctx.beginPath();ctx.moveTo(M.prev[0],M.prev[2]);ctx.lineTo(x,y2);ctx.stroke();
    ctx.strokeStyle="#f5e04a";ctx.beginPath();ctx.moveTo(M.prev[0],M.prev[3]);ctx.lineTo(x,y3);ctx.stroke()}
   M.prev=[x,y1,y2,y3];
  }
  ctx.fillStyle="#3df27a";ctx.font=`${11*M.dp}px ui-monospace,monospace`;ctx.fillText("II",4*M.dp,14*M.dp);ctx.fillStyle="#35d4f5";ctx.fillText("Pleth",4*M.dp,h*.58);ctx.fillStyle="#f5e04a";ctx.fillText("Resp",4*M.dp,h*.82);
  if(!M.still)M.raf=requestAnimationFrame(frame);
 };
 if(M.still){for(let i=0;i<50;i++)frame(performance.now()+i*100)}else M.raf=requestAnimationFrame(frame);
 FE_MON=M;return M;
}
function feNumerics(M){
 const s=M.state,el=M.el,set=(sel,v)=>{const n=el.querySelector(sel);if(n)n.textContent=v};
 const R=feById(s.rhythm),hr=s.hr??(R?Math.round(feStrip(s.rhythm,s.seed??1).hr):0);
 set(".hr b",s.rhythm==="vf"||s.rhythm==="asys"?"---":hr);set(".sp b",s.spo2??"--");set(".rr b",s.rr??"--");set(".tp b",s.temp!=null?Number(s.temp).toFixed(1):"--");
 if(s.nbp){set(".bp b",`${s.nbp[0]}/${s.nbp[1]}`);set(".bp .map",`(${Math.round((s.nbp[0]+2*s.nbp[1])/3)})`);set(".nbpt",s.nbpTime||"")}
 const a=el.querySelector(".fe-alarm");if(s.alarm){a.hidden=false;a.className="fe-alarm "+s.alarm.level;a.textContent=s.alarm.text}else a.hidden=true;
}
function feMonitorStop(){if(FE_MON){cancelAnimationFrame(FE_MON.raf);removeEventListener("resize",FE_MON.resize);FE_MON=null}}

// A 6-second strip mounted like a printed rhythm strip: two 3-second rows, each with its own calipers and readout.
function feStripRows(s,{id="rs",cal=true}={}){const half=s.dur/2;return [0,1].map(i=>`<div class="fl-strip two">${feStripSVG(s,{cal,id:id+i,from:i*half,to:(i+1)*half})}</div>${cal?`<div class="fl-calread" id="${id+i}-read">Drag the calipers</div>`:""}`).join("")}
