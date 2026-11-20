const studioKeys=Object.keys(STUDIO);
const studioLesson=new Map(),studioConcept=new Map();
for(const key of studioKeys){
 const s=STUDIO[key];
 for(const id of s.lessons.split(" "))studioLesson.set(id,key);
 for(const id of [s.concept,...s.concepts.split(" ").filter(Boolean)])studioConcept.set(id,key);
}
const studioTextbook="https://openstax.org/books/anatomy-and-physiology-2e/pages/";
const studioLicense="https://creativecommons.org/licenses/by-nc-sa/4.0/";
const studioStops=[.18,.51,.87];
const studioBeat=t=>t<.333?0:t<.666?1:2;
const studioMemory=new Map();
let studioRun=0;
const studioRecord=key=>{
 if(!studioMemory.has(key))studioMemory.set(key,{a:0,t:studioStops[0],spot:-1,compare:false,choice:null,playing:false});
 return studioMemory.get(key);
};
function studioDirectory(){
 return `<section class="studio-directory" aria-label="New visual activities"><div class="studio-intro"><div><span class="kicker">VISUAL LEARNING STUDIO</span><h2>Change one thing. Watch what happens.</h2><p>${studioKeys.length} new cutaways with textbook pictures, two conditions and quick predictions. Your original atlas and labs are still here.</p></div><div class="studio-jumps"><button class="soft" data-scrollto="original-plates">Original anatomy plates ↓</button><button class="soft" data-scrollto="original-labs">Interactive physiology labs ↓</button></div></div><div class="studio-grid">${studioKeys.map((key,i)=>{
  const s=STUDIO[key];return `<button class="studio-tile" data-go="studio/${key}"><span class="studio-thumbnail" aria-hidden="true">${studioDraw(key,1,.64,-1,"card")}</span><span class="studio-tiletext"><small>${esc(s.system)} / ${pad(i+1)}</small><b>${esc(s.title)}</b><span>${esc(s.intro)}</span></span>${I("arrow",16)}</button>`;
 }).join("")}</div></section>`;
}
function studioDoor(key,inline=false){
 if(!key)return "";
 const s=STUDIO[key];
 return `<section class="studio-door"><div class="studio-mini" aria-hidden="true">${studioDraw(key,1,.54,-1,"door")}</div><div><span class="kicker">SEE THE MECHANISM</span><h3>${esc(s.title)}</h3><p>${esc(s.intro)}</p><button class="textbtn" ${inline?'data-tab="map" data-st-enter':'data-go="studio/'+key+'"'}>${inline?"Open in Visual walkthrough":"Open interactive cutaway"} ${I("arrow",14)}</button></div></section>`;
}
function studioPicture(key){
 const s=STUDIO[key],[chapter,anchor,num,title,note]=s.photo, src="./assets/studio-"+key+".webp";
 return `<figure class="studio-picture" id="studio-picture"><div class="studio-picturehead"><div><span class="kicker">LABELED TEXTBOOK PICTURE</span><h3>${esc(title)}</h3></div><button class="soft" data-st-zoom>Enlarge picture</button></div><div class="studio-photowell"><img src="${src}" loading="lazy" alt="OpenStax Figure ${num}: ${esc(title)}. ${esc(note)}"></div><figcaption><p>${esc(note)}</p><p class="quiet"><a href="${studioTextbook+chapter}#${anchor}" target="_blank" rel="noopener">OpenStax Anatomy and Physiology 2e, Figure ${num}</a>. Copyright Rice University, OpenStax, under <a href="${studioLicense}" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a> license. Resized for the app.</p></figcaption></figure>
 <dialog class="studio-zoom" aria-labelledby="studio-zoom-title"><div class="studio-zoomhead"><h3 id="studio-zoom-title">${esc(title)}</h3><button class="soft" data-st-close autofocus>Close picture</button></div><div class="studio-zoomscroll"><img src="${src}" loading="lazy" alt="${esc(title)}. ${esc(note)}"></div></dialog>`;
}
function studioWidget(key,standalone=false){
 const s=STUDIO[key],m=studioRecord(key),step=studioBeat(m.t),[question,choices]=s.ask;
 return `<section class="studio" data-studio="${key}" data-nolink><header class="studio-header${standalone?" studio-compact":""}"><div><span class="kicker">${standalone?"CHANGE ONE CONDITION":"MECHANISM LAB / "+esc(s.system)}</span>${standalone?"":`<h2>${esc(s.title)}</h2><p>${esc(s.intro)}</p>`}</div><button class="textbtn" data-scrollto="studio-picture">See labeled picture ↓</button></header>
 <div class="studio-tools"><div class="studio-conditions" role="group" aria-label="Model condition">${s.states.map((n,i)=>`<button type="button" data-st-condition="${i}" aria-pressed="${m.a===i}">${esc(n)}</button>`).join("")}</div><button class="soft studio-compare" data-st-compare aria-pressed="${m.compare}">${m.compare?"Hide comparison":"Compare conditions"}</button></div>
 <div class="studio-views"><div class="studio-view studio-reference" ${m.compare?"":"hidden"}><span>REFERENCE / ${esc(s.states[0])}</span><div data-st-reference>${m.compare?studioDraw(key,0,m.t,m.spot,"ref"):""}</div></div><div class="studio-view"><span data-st-label>${m.compare?"SELECTED / ":""}${esc(s.states[m.a])}</span><div data-st-canvas>${studioDraw(key,m.a,m.t,m.spot)}</div></div></div>
 <div class="studio-legend">${s.legend.map(([color,label])=>`<span><i style="--marker:${color}"></i>${esc(label)}</span>`).join("")}</div>
 <div class="studio-controls"><div class="studio-time"><button class="btn studio-play" data-st-play ${reduced()?"hidden":""}>${I("play",14)} Play sequence</button><span class="pill studio-still" ${reduced()?"":"hidden"}>Manual view</span><label>Explore the sequence <input type="range" min="0" max="1000" value="${Math.round(m.t*1000)}" data-st-scrub aria-valuetext="${esc(s.beats[step][0])}"></label></div><div class="studio-steps" role="group" aria-label="Sequence stages">${s.beats.map(([name],i)=>`<button data-st-step="${i}" aria-pressed="${step===i}"><small>${pad(i+1)}</small>${esc(name)}</button>`).join("")}</div>
 <div class="studio-stage"><h3 data-st-stage>${esc(s.beats[step][0])}</h3><p data-st-explain>${esc(s.beats[step][m.a+1])}</p></div></div>
 <div class="studio-inspect"><h3>Inspect the anatomy</h3><p class="quiet">Tap a number on the drawing, or choose a structure here.</p><div class="studio-structures" role="group" aria-label="Structures">${s.spots.map(([label],i)=>`<button class="soft" data-st-spot="${i}" aria-pressed="${m.spot===i}"><span>${i+1}</span>${esc(label)}</button>`).join("")}</div><p class="studio-spotnote" data-st-spotnote aria-live="polite">${m.spot<0?"Select a structure for a closer look.":esc(s.spots[m.spot][1])}</p></div>
 <div class="studio-prediction"><span class="kicker">QUICK PREDICTION / UNSCORED</span><h3>${esc(question)}</h3><div class="studio-answers">${choices.map((choice,i)=>`<button class="soft" data-st-choice="${i}" aria-pressed="${m.choice===i}">${esc(choice)}</button>`).join("")}</div><div class="studio-feedback" data-st-feedback aria-live="polite">${studioFeedback(s,m)}</div></div>
 <details class="studio-fact"><summary>Did you know?</summary><p>${esc(s.fact)}</p></details>
 <details class="studio-transcript"><summary>Read both conditions without motion</summary>${s.states.map((name,j)=>`<div><h3>${esc(name)}</h3><ol>${s.beats.map(b=>`<li><b>${esc(b[0])}:</b> ${esc(b[j+1])}</li>`).join("")}</ol></div>`).join("")}</details>
 ${studioPicture(key)}
 <div class="studio-sources"><p class="quiet">Original illustrative cutaway, not to scale or a prediction tool. Educational practice only; quick predictions never change your mastery or review queue.</p><div class="refs">${termAnchor(s.concept,"Read the anatomy foundation","chiplink")}${refLink("OpenStax: Read the physiology",studioTextbook+s.source)}</div></div></section>`;
}
function studioFeedback(s,m){
 if(m.choice===null)return "";
 const [, , answer, feedback]=s.ask;
 return `<p><b>${m.choice===answer?"That’s right.":"Compare the two conditions."}</b> ${esc(feedback[m.choice])}${m.choice===answer?"":" "+esc(feedback[answer])}</p><button class="textbtn" data-st-outcome>See the outcome in the model ↑</button>`;
}
function studioPage(key){
 if(!Object.hasOwn(STUDIO,key))return plateDirectory();
 const s=STUDIO[key],i=studioKeys.indexOf(key);
 return back("labs","All visual models")+head("VISUAL LEARNING STUDIO / "+s.system,s.title,s.intro)+
 `<div class="studio-page">${studioWidget(key,true)}<div class="studio-next"><button class="textbtn" data-go="studio/${studioKeys[(i+studioKeys.length-1)%studioKeys.length]}">${I("back",14)} Previous cutaway</button><button class="textbtn" data-go="studio/${studioKeys[(i+1)%studioKeys.length]}">Next cutaway ${I("arrow",14)}</button></div></div>`;
}
function studioSync(root,{draw=true,controls=true}={}){
 const key=root.dataset.studio,s=STUDIO[key],m=studioRecord(key),step=studioBeat(m.t),q=t=>root.querySelector(t);
 if(draw){
  q("[data-st-canvas]").innerHTML=studioDraw(key,m.a,m.t,m.spot);
  if(m.compare)q("[data-st-reference]").innerHTML=studioDraw(key,0,m.t,m.spot,"ref");
 }
 const put=(sel,str)=>{let el=q(sel);if(el.textContent!==str)el.textContent=str};
 const scrub=q("[data-st-scrub]");scrub.value=Math.round(m.t*1000);scrub.setAttribute("aria-valuetext",s.beats[step][0]);
 put("[data-st-stage]",s.beats[step][0]);put("[data-st-explain]",s.beats[step][m.a+1]);
 root.querySelectorAll("[data-st-step]").forEach((el,i)=>el.setAttribute("aria-pressed",String(i===step)));
 if(!controls)return;
 const play=q("[data-st-play]");play.hidden=reduced();q(".studio-still").hidden=!reduced();
 const playText=m.playing?"Pause sequence":m.t>=.999?"Replay sequence":m.t===studioStops[0]?"Play sequence":"Continue sequence";
 if(play.textContent.trim()!==playText)play.innerHTML=I(m.playing?"clock":"play",14)+" "+playText;
 q(".studio-reference").hidden=!m.compare;
 q("[data-st-compare]").setAttribute("aria-pressed",String(m.compare));put("[data-st-compare]",m.compare?"Hide comparison":"Compare conditions");
 put("[data-st-label]",(m.compare?"SELECTED / ":"")+s.states[m.a]);
 root.querySelectorAll("[data-st-condition]").forEach((el,i)=>el.setAttribute("aria-pressed",String(i===m.a)));
 root.querySelectorAll("[data-st-spot]").forEach((el,i)=>el.setAttribute("aria-pressed",String(i===m.spot)));
 put("[data-st-spotnote]",m.spot<0?"Select a structure for a closer look.":s.spots[m.spot][1]);
}
function studioStop(root){
 cancelAnimationFrame(studioRun);studioRun=0;
 if(root)studioRecord(root.dataset.studio).playing=false;
}
function studioPlay(root,m){
 studioStop(root);if(reduced())return;
 if(m.t>=.999||m.t===studioStops[0])m.t=0;
 m.playing=true;studioSync(root);
 let prev=0;
 function frame(now){
  if(!root.isConnected||!m.playing||reduced()){studioStop(root);if(root.isConnected)studioSync(root);return}
  if(!prev)prev=now;
  if(now-prev>=49){
   m.t=Math.min(1,m.t+Math.min(80,now-prev)/10000);
   prev=now;
   if(m.t>=1){studioStop(root);studioSync(root);return}
   studioSync(root,{controls:false});
  }
  studioRun=requestAnimationFrame(frame);
 }
 studioRun=requestAnimationFrame(frame);
}
document.addEventListener("click",e=>{
 const root=e.target.closest("[data-studio]"), target=e.target.closest("button,[data-st-marker]");
 if(!root||!target)return;
 const key=root.dataset.studio,s=STUDIO[key],m=studioRecord(key),d=target.dataset;
 if(d.stCondition!==undefined){studioStop(root);m.a=Number(d.stCondition);studioSync(root)}
 if(d.stCompare!==undefined){m.compare=!m.compare;if(m.compare&&m.a===0)m.a=1;studioSync(root)}
 if(d.stStep!==undefined){studioStop(root);m.t=studioStops[Number(d.stStep)];studioSync(root)}
 if(d.stPlay!==undefined){if(m.playing){studioStop(root);studioSync(root)}else studioPlay(root,m)}
 if(d.stSpot!==undefined||d.stMarker!==undefined){m.spot=Number(d.stSpot??d.stMarker);studioSync(root)}
 if(d.stChoice!==undefined){
  m.choice=Number(d.stChoice);root.querySelectorAll("[data-st-choice]").forEach((el,i)=>el.setAttribute("aria-pressed",String(i===m.choice)));
  root.querySelector("[data-st-feedback]").innerHTML=studioFeedback(s,m);
 }
 if(d.stOutcome!==undefined){studioStop(root);m.a=1;m.t=studioStops[2];studioSync(root);root.querySelector('[data-st-step="2"]').focus({preventScroll:true});root.scrollIntoView({block:"start"})}
 if(d.stZoom!==undefined){studioStop(root);studioSync(root,{draw:false});root.querySelector("dialog").showModal()}
 if(d.stClose!==undefined)root.querySelector("dialog").close();
});
document.addEventListener("input",e=>{
 if(e.target.dataset.stScrub===undefined)return;
 const root=e.target.closest("[data-studio]");if(!root)return;
 const m=studioRecord(root.dataset.studio);studioStop(root);m.t=Number(e.target.value)/1000;studioSync(root);
});
document.addEventListener("visibilitychange",()=>{const root=document.querySelector("[data-studio]");if(document.hidden&&root){studioStop(root);studioSync(root,{draw:false})}});
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",()=>{const root=document.querySelector("[data-studio]");if(root){if(reduced())studioStop(root);studioSync(root,{draw:false})}});
