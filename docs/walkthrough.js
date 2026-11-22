/* Self-paced, reduced-motion-aware four-scene reasoning diagrams. */
let scene={id:"",step:0,playing:false,timer:0};
function haltScenes(){clearTimeout(scene.timer);scene.timer=0;scene.playing=false}
function sceneStep(id,index){if(!byId(id))return;scene.id=id;scene.step=Math.max(0,Math.min(3,index));render()}
function playScenes(id){
 if(scene.playing){haltScenes();render();return}
 if(scene.step===3)scene.step=0;
 scene.playing=true;render();
 const next=()=>{if(path!=="lesson/"+id||lessonTab!=="map"||!scene.playing){haltScenes();return}scene.step++;if(scene.step>=3){scene.step=3;haltScenes()}render();if(scene.playing)scene.timer=setTimeout(next,6500)};
 scene.timer=setTimeout(next,6500);
}
function storyboard(l){
 if(scene.id!==l.id){haltScenes();scene={id:l.id,step:0,playing:false,timer:0}}
 let frames=l.frames;if(!frames?.length)return `<p>See the worked bedside case for this skill.</p>`;
 let index=scene.step,f=frames[index],u=unit(l.unit),icons=[u[3],"search","users","pulse"],stage=["Situation","Bedside cue","Nursing priority","Reassessment"];
 const reduce=profile.prefs.still||matchMedia("(prefers-reduced-motion: reduce)").matches;
 return `<div class="between"><span class="kicker">VISUAL WALKTHROUGH</span><span class="pill">Scene ${index+1} of 4</span></div><h2>A bedside reasoning map</h2><p class="quiet">Follow the case from the first clue to reassessment. Select any scene to explore it at your own pace.</p><div class="scene-map"><div class="scene-line"></div>${frames.map((s,i)=>`<button class="scene-node ${i===index?"here":""} ${i<index?"past":""}" aria-label="Scene ${i+1}: ${esc(s.label)}" aria-pressed="${i===index}" data-scene="${i}"><span class="scene-bubble">${I(icons[i],23)}</span><small>${pad(i+1)}</small></button>`).join("")}</div><div class="scene-copy" aria-live="polite"><span class="kicker">${stage[index]}</span><h3>${esc(f.label)}</h3><p>${esc(f.detail)}</p></div><div class="actionbar">${index>0?`<button class="soft" data-scene="${index-1}">${I("back",14)} Back</button>`:""}${index<3?`<button class="btn" data-scene="${index+1}">Next scene ${I("arrow",14)}</button>`:`<button class="btn" data-tab="case">Try the bedside case ${I("arrow",14)}</button>`}${reduce?"":`<button class="soft" data-act="play-scenes">${scene.playing?"Pause":"Play walkthrough"}</button>`}</div><details><summary>Read all four scenes</summary>${frames.map((s,i)=>`<p><b>${stage[i]}: ${esc(s.label)}.</b> ${esc(s.detail)}</p>`).join("")}</details>`;
}
