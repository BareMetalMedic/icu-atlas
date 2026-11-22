// Original explanatory schematics. Time is normalized, not measured physiology.
const studioInk={teal:"#6ee8db",coral:"#ff9b82",blue:"#75dfff",amber:"#ffc477",lavender:"#d7b7ff",wall:"#8f77a5"};
const studioClamp=x=>Math.max(0,Math.min(1,x));
const studioEase=x=>{const u=studioClamp(x);return u*u*(3-2*u)};
function studioDraw(key,altered,t,focus=-1,variant="live"){
 const s=STUDIO[key], a=!!altered,T=studioClamp(t), ease=(at,to)=>studioEase((T-at)/(to-at));
 const {teal,coral,blue,amber,lavender,wall}=studioInk, prefix=`sd-${key}-${variant}`;
 const n=x=>Math.round(x*100)/100, url=name=>`url(#${prefix}-${name})`;
 const path=(d,fill="none",stroke="none",w=1,extra="")=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
 const line=(x,y,xx,yy,c,w=2,extra="")=>path(`M${n(x)} ${n(y)}L${n(xx)} ${n(yy)}`,"none",c,w,extra);
 const el=(x,y,rx,ry,fill,stroke="none",w=1,extra="")=>`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
 const rect=(x,y,w,h,fill,stroke="none",r=8)=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
 const text=(x,y,value,anchor="middle",color="#e3eef0")=>`<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="17" font-weight="600">${value}</text>`;
 const grid=(xs,ys,fn)=>ys.map((y,j)=>xs.map((x,i)=>fn(x,y,i,j)).join("")).join("");
 const dot=(x,y,r,c)=>el(x,y,r,r,c);
 const rbc=(x,y,size=7,fill=coral,roll=0)=>`<g transform="translate(${n(x)} ${n(y)}) rotate(${n(roll)})">${el(0,0,size,size*.68,fill,"#2b263b",.75)}${el(0,0,size*.45,size*.24,"#582e4d","none",1,'opacity=".63"')}</g>`;
 const plate=(x,y)=>`${el(x,y,6.8,3.5,amber,"#ae6859",.6)}${dot(x-1,y,1.1,"#815148")}`;
 function flow(points,count,speed,glyph,span=1,offset=0){
  const lengths=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1])), total=lengths.reduce((x,y)=>x+y,0);
  return Array.from({length:count},(_,i)=>{
   const u=((i/count+offset+T*speed)%1+1)%1*span;let left=u*total,j=0;
   while(j<lengths.length-1&&left>lengths[j])left-=lengths[j++];
   const [x,y]=points[j], [xx,yy]=points[j+1], q=left/lengths[j];
   return glyph(x+(xx-x)*q,y+(yy-y)*q,u,Math.atan2(yy-y,xx-x)*180/Math.PI,i);
  }).join("");
 }
 const vessel=(d,w,inside="#542e4e",outside="#b47598")=>path(d,"none",outside,w+4)+path(d,"none",inside,w);
 const call=(i,x,y,xx,yy)=>{
  const active=focus===i,c=active?"#ffd490":"#b4e1db";
  return line(x,y,xx,yy,c,active?2.8:1.2,'opacity=".8"')+el(xx,yy,active?5:3,active?5:3,c)+`<g data-st-marker="${i}" aria-hidden="true">${el(x,y,23,23,"transparent")}${el(x,y,16,16,active?"#ffd490":"#133445",c,active?2.4:1.2)}${text(x,y+6,i+1,"middle",active?"#182331":"#f2fbfa")}</g>`;
 };
 let picture="", names=[], calls=[];
 switch(key){
  case "filling": {
   const expanded=ease(.01,.31)-ease(.65,.92), base=a?.82:1, width=(.89+.17*expanded)*base;
   const height=.95+.11*expanded, shiftY=185-185*height;
   const opening=T<.34?14:0, out=T>=.66?14:0, lv="M186 140C228 139 286 134 300 164C322 201 314 249 272 273C239 290 197 249 186 219C176 190 176 159 186 140Z";
   picture=vessel("M103 77H171Q185 77 201 92",27)+vessel("M300 145V72Q300 47 325 47H377",35)+
    path("M162 77C182 51 234 56 261 74C281 89 281 121 251 134C211 149 173 135 161 112Z",url("blood"),"#dba2ba",4)+
    `<g transform="translate(${n(246-246*width)} ${n(shiftY)}) scale(${n(width)} ${n(height)})">${path(lv,url("blood"),"#d49eb6",14)}${path("M194 157C174 202 216 262 263 275M286 158C312 192 302 240 281 257","none","#ffbfca",2,'opacity=".46"')}${grid([215,239,264,283],[175,203,232],(x,y,i,j)=>i===0&&j===2?"":rbc(x+3*Math.sin(T*5+i),y+4*Math.cos(T*7+j),a?6:8,coral,30+i*12))}</g>`+
    path(`M195 139l${26-opening*.65} ${opening}m24 ${-opening}l-${24-opening*.65} ${opening}`,"none","#ffe0d3",5)+
    path(`M282 126l${18-out*.6} ${-out}m18 ${out}l-${18-out*.6} ${-out}`,"none","#ffe0d3",5)+
    flow([[113,77],[171,78],[208,95]],4,1.25,(x,y)=>rbc(x,y,6))+
    (opening?flow([[211,96],[220,137],[223,177],[239,203]],a?2:5,2.2,(x,y,u,v)=>rbc(x,y,6,coral,v),1,T):"")+
    (out?flow([[265,190],[293,145],[301,107],[302,65],[332,47],[370,47]],a?3:7,2.8,(x,y,u,v)=>rbc(x,y,6,coral,v)):"");
   names=[[95,49,"Pulmonary vein"],[389,24,"Aorta"],[323,288,"Left ventricle"]];
   calls=[[125,118,188,107],[370,215,287,213],[405,62,354,46]];break;
  }
  case "gas": {
   const swell=1+.052*Math.sin(T*Math.PI*2), flood=a?ease(.03,.38):0, fy=206-65*flood;
   const sac="M186 51H248V78C285 87 318 124 313 164C310 202 279 218 237 218C194 220 153 209 136 181C118 147 139 96 186 78Z";
   picture=`<g transform="translate(${n(219-219*swell)} 0) scale(${n(swell)} 1)">${path(sac,url("air"),"#a3d4cf",6)}<clipPath id="${prefix}-sac">${path(sac,"white")}</clipPath>${flood?`<g clip-path="${url("sac")}">${path(`M114 ${n(fy)}Q157 ${n(fy+10*Math.sin(T*11))} 211 ${n(fy)}T321 ${n(fy)}V225H114Z`,url("fluid"),"#8acbff",2)}${grid([155,188,218,248,273],[163,181,197],(x,y,i,j)=>y>fy+8?el(x+3*Math.sin(T*10+i),y+j,5,2.7,"none","#93ccff",1):"")}</g>`:""}</g>`+
    vessel("M89 253Q137 253 157 242C183 223 237 221 286 229Q335 245 394 245",25,"#3d426f","#be9db9")+
    flow([[89,253],[132,251],[172,233],[220,229],[266,229],[316,238],[389,245]],8,1.08,(x,y,u,v)=>rbc(x,y,8,u>.56&&!a?coral:"#b9a0dd",v))+
    flow([[213,60],[214,103],[219,135],[216,177],[213,211],[211,229]],a?2:8,1.7,(x,y,u)=>dot(x+9*Math.sin(u*18),y,3.7,teal),a?.74:1)+
    flow([[277,227],[266,195],[254,162],[237,130],[230,92],[229,58]],a?3:5,1.34,(x,y,u)=>dot(x+5*Math.sin(u*20),y,3.4,amber));
   names=[[215,31,"Airway"],[103,287,"Blood in"],[390,282,"Blood out"]];
   calls=[[90,125,154,130],[350,189,278,215],[405,217,375,244]];break;
  }
  case "filtration": {
   const fade=ease(.15,.6), amount=a?3:11;
   const tuft=[[86,152],[145,149],[165,111],[193,91],[225,112],[202,140],[175,149],[187,179],[228,192],[256,167],[244,135],[267,101],[293,124],[293,157],[335,157]];
   picture=path("M151 94C127 122 130 189 169 216C198 238 246 236 283 225L308 235C326 243 313 271 339 276H406","none","#d3b8d6",24)+
    path("M151 94C127 122 130 189 169 216C198 238 246 236 283 225L308 235C326 243 313 271 339 276H406","none","#304e61",16)+
    path("M140 157C139 194 175 229 213 230C251 228 288 216 302 177","none","#82cbd0",5,`opacity="${n(.29+fade*(a?.14:.57))}"`)+
    vessel("M81 152H142C158 151 156 98 196 92C219 87 237 107 213 137C200 153 170 139 180 170C198 203 242 205 254 172C263 151 231 137 251 113C276 77 300 109 294 142Q290 159 332 157",19)+
    flow(tuft,12,1.48,(x,y,u,v)=>rbc(x,y,6.9,coral,v))+
    flow([[185,178],[175,203],[206,222],[240,228],[282,224],[310,238],[320,263],[344,275],[400,275]],amount,1.14,(x,y)=>dot(x,y,3,teal));
   names=[[103,119,"Afferent"],[350,137,"Efferent"],[231,268,"Bowman’s space"]];
   calls=[[206,51,207,95],[95,205,154,186],[402,234,378,275]];break;
  }
  case "csf": {
   const b=a?1:0, growth=b*ease(.28,.94);
   const brain="M112 158C99 90 165 44 237 49C295 40 348 70 365 122C383 161 366 203 335 223Q319 260 285 250Q275 243 278 226L277 210C243 228 207 218 184 209C140 209 123 190 112 158Z";
   const upper="M166 129Q213 77 274 105Q303 113 311 139Q285 126 259 130Q237 132 230 151L246 177";
   const low=[[245,174],[257,186],[277,195],[292,217],[312,237],[342,230],[368,200],[383,156],[379,121],[361,87]];
   picture=path(brain,url("tissue"),"#d1aad0",4)+
    ["M137 140Q150 104 180 104M156 175Q177 142 191 162M192 180Q215 188 224 170","M249 70Q279 67 302 92M319 98Q349 109 345 145M334 151Q336 175 311 178M336 213Q339 200 326 192","M301 218Q320 226 328 208M280 219L292 239L285 265"].map(d=>path(d,"none","#7a557f",5,'opacity=".72"')).join("")+
    path(upper,"none","#44728d",20+23*growth)+path(upper,"none",teal,8+22*growth,'opacity=".65"')+
    el(245,168,10+6*growth,12+8*growth,teal,"#487e96",2)+
    path("M246 175Q257 184 277 195L291 217Q308 241 343 230C369 209 392 172 379 118Q374 98 360 85","none","#6eacbd",6)+
    path("M267 188Q289 187 297 202L289 213L272 207Z",teal,"#76aecc",1,'opacity=".77"')+
    flow([[167,128],[188,110],[222,100],[258,105],[281,114],[246,131],[230,153],[244,169]],a?10:6,1.52,(x,y)=>dot(x,y,2.7,"#c3fff6"))+
    (!a?flow(low,8,1.28,(x,y)=>dot(x,y,3,teal)):path("M255 176l12 16m4-16l-15 16","none",coral,5));
   names=[[220,31,"Ventricular system"],[352,266,"Subarachnoid space"]];
   calls=[[109,88,174,116],[364,162,260,184],[211,233,278,203]];break;
  }
  case "seal": {
   const gather=ease(.19,.67), fibrin=a?0:ease(.65,.98), seep=a?.45+.55*ease(.76,1):1-gather;
   picture=path("M70 112Q163 111 188 118Q222 133 243 124Q282 111 411 112L411 192Q296 191 268 183L245 199L225 186L205 195L187 184Q142 193 70 192Z",url("blood"),"#c58ba0",4)+
    path("M70 192H185l18-7 15 7m36 1 16-9 17 8H411","none","#d9abb9",9)+
    flow([[72,151],[143,152],[212,151],[278,152],[406,152]],10,1.32,(x,y,u,v,i)=>rbc(x,y+(i%3-1)*15,7,coral,(i+3)*10))+
    flow([[109,170],[173,172],[204,176],[223,191]],a?5:7,1.65,(x,y)=>plate(x,y),.14+.86*gather)+
    Array.from({length:Math.ceil(16*gather)},(_,i)=>plate(212+(i%6)*7,192-(i%4)*5+Math.sin(T*6+i)*2)).join("")+
    Array.from({length:Math.ceil(13*fibrin)},(_,i)=>line(204+i*4,197-i%3*5,261-i*3,171+i%4*7,lavender,1.6)).join("")+
    (seep>.15?flow([[225,181],[236,206],[243,229],[257,260]],Math.ceil(seep*5),.92,(x,y)=>rbc(x,y,5,coral,65),.48+.52*seep):"");
   names=[[134,84,"Vessel lumen"],[302,267,"Surrounding tissue"]];
   calls=[[139,219,204,190],[310,218,243,190],[349,97,252,176]];break;
  }
  case "breathing": {
   const breath=(ease(.02,.56)-ease(.65,.99))*(a?.35:1), w=1+breath*.13, h=1+breath*.13, dy=27*breath;
   const lung="M225 105C193 89 173 100 150 136C132 160 123 193 132 215Q150 233 189 217Q218 214 226 198Z";
   picture=path("M174 65C112 90 98 154 108 219Q125 261 240 264Q365 261 373 219C383 153 358 89 307 65","none","#6a8497",3)+
    grid([0],[0,1,2,3],(_,__,i,j)=>path(`M${117-j*2} ${106+j*31}Q239 ${135+j*31} ${363+j*2} ${106+j*31}`,"none","#6f8298",4,'opacity=".49"'))+
    `<g transform="translate(${n(242-242*w)} ${n(104-104*h)}) scale(${n(w)} ${n(h)})">${path(lung,url("air"),"#87c7c3",3)}<g transform="translate(482 0) scale(-1 1)">${path(lung,url("air"),"#87c7c3",3)}</g>${path("M236 100L201 140L164 156M201 140L192 181L169 199M245 100L280 140L317 156M280 140L290 183L316 195","none","#a1d7d0",12)}${path("M236 100L201 140L164 156M201 140L192 181L169 199M245 100L280 140L317 156M280 140L290 183L316 195","none","#407782",8)}</g>`+
    vessel("M240 47V100",17,"#487984","#a2cfc9")+
    path(`M107 248Q241 ${n(163+dy*2.5)} 373 248`,"none",coral,9)+
    path(`M107 254Q241 ${n(175+dy*2.4)} 373 254`,"none","#a26588",3)+
    [1,-1].map(k=>{
     let pts=[[240+k*2,48],[240+k*2,96],[240+k*37,139],[240+k*59,169+dy*.4]];
     return flow(T<.66?pts:pts.reverse(),a?3:7,1.55,(x,y)=>dot(x,y,2.8,"#e3f5ff"),.97,k*.1);
    }).join("");
   names=[[240,25,"Airway"],[239,288,"Diaphragmatic dome"]];
   calls=[[292,60,240,69],[74,158,156,166],[389,240,345,236+dy*.2]];break;
  }
  case "barrier": {
   const leak=a?ease(.12,.92):0, white=a?ease(.25,.81):0, gap=a?5*ease(.08,.64):0;
   picture=rect(56,66,368,104,url("blood"),"#a984a0",27)+
    rect(56,178,368,96,url("air"),"#3d7884",15)+
    grid([80,122,164,206,248,290,332,374,410],[166],(x,y,i)=>el(x,y,21-gap,9,"#ce9fbd","#e4b6cd",1))+
    grid([96,148,205,261,316,372],[223,256],(x,y,i,j)=>el(x+j*13,y,19+6*leak,8+4*leak,"#52848b","#7ea6a6",1))+
    flow([[62,116],[413,116]],10,1.27,(x,y,u,v,i)=>rbc(x,y+17*Math.sin(i*3),7.2,coral,i*17))+
    flow([[120,142],[145,173],[144,201],[165,218]],a?7:2,1.56,(x,y)=>dot(x,y,3,teal),a?.94:.83)+
    (a?flow([[236,127],[267,155],[271,190],[291,219],[307,252]],6,1.38,(x,y,u,v,i)=>dot(x+(i%2)*12,y,i%2?3:4,i%2?teal:amber),.42+.58*leak):"")+
    el(a?184+46*white:210+72*(T-.5),a?119+92*white:120,14+white*2,12,lavender,"#765e91",1.7)+
    path(`M${n(a?179+46*white:205+72*(T-.5))} ${n(a?119+92*white:120)}q3-7 5 0t5 0`,"none","#78588e",4)+
    (leak?el(286,249,65*leak,12*leak,"#6ddbd0","none",1,'opacity=".26"'):"");
   names=[[240,42,"Microvessel"],[240,296,"Tissue compartment"]];
   calls=[[97,92,126,114],[389,181,369,164],[396,228,349,246]];break;
  }
  case "water": {
   const channels=a?1:1+Math.ceil(4*ease(.1,.62));
   picture=rect(73,45,114,225,url("fluid"),"#77bacd",15)+
    rect(291,46,113,224,url("air"),"#619e9e",15)+
    grid([187],[53,98,143,188,233],(x,y)=>rect(x,y,104,40,url("tissue"),"#a885ad",8)+el(237,y+20,11,9,"#775385"))+
    grid([306,330,353,379],[75,106,143,171,210,243],(x,y,i,j)=>dot(x+(j%2)*6,y,2.6,"#82a7a6"))+
    grid([190],[73,118,163,208,253],(x,y,i,j)=>j<channels?rect(x-8,y-7,19,14,amber,"#e4b976",4)+rect(x-3,y-2,11,4,"#5b637b","none",2):"")+
    flow([[101,50],[101,266]],a?10:5,1.44,(x,y,u,v,i)=>dot(x+18*Math.sin(i*2.3),y,4,blue))+
    Array.from({length:channels},(_,i)=>{
     let y=73+i*45;return flow([[119,y-11],[160,y],[194,y],[225,y],[292,y],[363,y+6]],a?1:4,1.18,(x,yy)=>dot(x,yy,3.4,blue),a?.72:1,i*.16);
    }).join("");
   names=[[128,28,"Duct lumen"],[347,28,"Interstitium"],[235,298,"Collecting duct wall"]];
   calls=[[108,141,137,146],[223,114,188,118],[382,204,327,199]];break;
  }
  case "pressure": {
   const load=a?(ease(.015,.49)-ease(.72,.996)):0, surface=65+34*load, cap=175+22*load;
   picture=path(`M50 65Q128 67 171 ${n(65+15*load)}Q239 ${n(surface+12*load)} 309 ${n(65+13*load)}Q359 65 428 65V92Q345 92 309 ${n(92+13*load)}Q242 ${n(surface+40)} 172 ${n(92+13*load)}Q124 92 50 92Z`,"#e4a3a0","#ffbfb2",2)+
    path(`M50 92Q141 91 176 ${n(92+15*load)}Q240 ${n(surface+40)} 309 ${n(92+13*load)}Q360 92 428 92V177Q372 175 324 172Q246 ${n(172+26*load)} 153 174Q100 178 50 177Z`,url("tissue"),"#ba91aa",2)+
    path(`M50 178Q147 163 241 ${n(cap+14)}Q314 167 428 178V269H50Z`,"#665164","#a4889a",2)+
    grid([71,105,138,171,208,240,274,311,349,383,411],[210,241,260],(x,y,i,j)=>el(x,y+(i%2)*6,13,7,"#a77d78","#bf9e93",.8))+
    path("M140 274Q186 256 202 232Q238 196 273 229Q293 256 345 274Z","#ded2bb","#ffebd0",3)+
    vessel(`M57 154Q124 153 172 ${n(cap-6)}M309 ${n(cap-6)}Q352 157 422 154`,14)+
    path(`M172 ${n(cap-6)}Q235 ${n(cap+12-9*load)} 309 ${n(cap-6)}`,"none","#b47598",18-13*load)+
    path(`M172 ${n(cap-6)}Q235 ${n(cap+12-9*load)} 309 ${n(cap-6)}`,"none","#542e4e",14-12*load)+
    (load>.28?el(239,210,55*load,17*load,amber,"none",1,'opacity=".35"'):"")+
    flow([[59,154],[120,155],[170,cap-6],[232,cap+3-4*load],[311,cap-6],[361,157],[421,154]],load>.46?4:10,1.5-load*.94,(x,y,u,v)=>rbc(x,y,5.4,coral,v),load>.46?.48:1)+
    (a&&T<.95?[207,239,271].map(x=>path(`M${x} 29v${n(11+16*load)}m-5-6l5 6 5-6`,"none",amber,2.7)).join(""):"");
   names=[[118,39,"Skin surface"],[239,298,"Bone"]];
   calls=[[80,106,120,75],[367,125,319,156],[403,231,277,237]];break;
  }
  case "portal": {
   const resist=a?ease(.16,.58):0, alternate=a?ease(.38,.95):0;
   const portal=[[103,262],[143,232],[183,206],[224,162],[235,141]], main=[[235,141],[269,124],[312,110],[340,92],[367,81],[420,69]];
   const coll=[[159,223],[129,187],[113,146],[110,119],[123,95],[146,73],[212,66],[277,64],[358,77],[420,69]];
   picture=path("M85 254C61 237 69 198 96 196Q135 195 135 220Q134 235 115 239Q94 244 105 254Q125 270 162 257Q183 249 184 269H84Z",url("tissue"),"#c798b0",3)+
    path("M210 125Q245 75 317 81Q355 84 382 109Q398 137 363 160Q320 195 265 196Q218 193 185 169Q166 153 210 125Z",url("tissue"),"#d5a3ae",4)+
    grid([232,263,292,319,352],[117,145,173],(x,y,i,j)=>el(x+(j%2)*11,y,16,8,"none","#ac7692",1))+
    vessel("M103 262Q144 227 183 206L235 141",18+9*resist)+
    vessel("M235 141C253 126 268 127 283 118Q324 105 340 92Q372 73 420 69",16-9*resist)+
    vessel("M235 141Q278 151 304 133Q319 118 340 92",11-6*resist)+
    vessel("M159 223Q117 186 111 138Q101 117 121 101Q131 90 147 73C224 51 272 69 343 74Q378 83 421 69",6+10*alternate,"#52446f","#9b82bf")+
    flow(portal,7,1.1,(x,y,u,v)=>rbc(x,y,6,coral,v))+
    flow(main,a?3:8,.98-resist*.55,(x,y,u,v)=>rbc(x,y,5.2,coral,v))+
    flow(coll,a?7:1,.34+alternate*.9,(x,y)=>dot(x,y,3+alternate,lavender));
   names=[[111,288,"Gut"],[298,214,"Liver"],[357,41,"Systemic veins"]];
   calls=[[227,239,175,201],[404,153,309,125],[73,99,116,109]];break;
  }
  case "junction": {
   const release=ease(.05,.31), response=a?.08:ease(.5,.88), d=12*response;
   picture=path("M202 31H276V80Q321 108 308 146Q297 169 239 169Q183 170 172 145Q160 105 202 80Z",url("air"),"#8bd8d4",4)+
    grid([202,244,282],[111,139],(x,y,i,j)=>el(x+3*Math.cos(T*6+i),y+j*5*release,9,9,"#527985","#8acac6",1)+dot(x,y+j*4*release,3,amber))+
    path(`M65 228Q111 211 161 221L186 221L193 ${n(241-d)}L209 220H222L229 ${n(244-d)}L245 220H259L269 ${n(243-d)}L285 221H304L312 ${n(241-d)}L329 221Q376 212 415 229V270H65Z`,url("tissue"),"#e1a6c1",3)+
    grid([84,116,148,181,215,249,281,313,345,379,404],[253,264],(x,y,i)=>line(x+d*Math.sin(i),y,x+9+d*Math.sin(i),y,"#b481a6",4))+
    grid([177,207,235,263,293,318],[221],(x,y,i)=>path(`M${x-5} ${y-12}v8q5 5 10 0v-8`,"none",a&&i!==2?"#a099b6":teal,4))+
    Array.from({length:10},(_,i)=>{let x=187+i*13, u=studioClamp(T*2.2-i*.025);return u>.96&&(a&&i!==4&&i!==5||T>.85)?"":dot(x+3*Math.sin(T*15+i),153+54*u,3.2,amber)}).join("")+
    (!a&&T>.54?line(80,242,80+310*response,242,"#ffdb99",2.4):"");
   names=[[126,45,"Motor axon"],[241,296,"Muscle fiber"]];
   calls=[[339,100,291,118],[127,176,200,185],[393,204,316,212]];break;
  }
  case "tissue": {
   const need=a?ease(.37,.99):0;
   picture=vessel("M56 111H424",39,"#522f4b","#c58ea6")+
    rect(56,145,368,124,url("air"),"#467783",14)+
    grid([110,195,284,369],[220,251],(x,y,i,j)=>el(x+(j%2)*15,y,28,12,need>.42?"#626778":"#538486",need>.42?"#dca977":"#90b9b2",1.5)+el(x+j*15,y,7,4,need>.42?"#bc9b83":"#376a76"))+
    flow([[60,111],[421,111]],a?4:11,a?.45:1.68,(x,y,u,v,i)=>rbc(x,y+7*Math.sin(i*4),9,u>.49?"#b879a8":coral,i*12))+
    (a?[177,266]:[97,163,229,295,351]).map((x,i)=>flow([[x,116],[x+8,148],[x+12,170],[x+13,211]],a?2:5,a?.71:1.25,(xx,y,u)=>dot(xx+5*Math.cos(u*12+i),y,3,teal),.98,i*.13)).join("")+
    (need>.18?grid([116,202,293,375],[218],(x,y)=>el(x,y,24+7*need,11+4*need,"none",amber,1.2,`opacity="${n(.5+.28*Math.sin(T*19))}"`)):"");
   names=[[103,65,"Blood in"],[376,65,"Blood out"],[236,291,"Local tissue demand"]];
   calls=[[81,160,112,109],[407,170,362,163],[402,246,368,223]];break;
  }
 }
 const grad=(id,c1,c2)=>`<linearGradient id="${prefix}-${id}" x2=".85" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
 return `<svg viewBox="0 0 480 310" class="studio-svg" role="img" aria-label="${esc(s.title)}, ${esc(s.states[altered])}"><defs>${grad("tissue","#9a6d91","#513e61")}${grad("air","#417c84","#2c5267")}${grad("fluid","#438dc5","#294878")}${grad("blood","#925472","#542e4e")}<pattern id="${prefix}-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" stroke="#7ca9b0" stroke-opacity=".09" fill="none"/></pattern></defs><rect width="480" height="310" fill="#132e40"/><rect width="480" height="310" fill="${url("grid")}"/>${picture}${names.map(row=>text(...row)).join("")}${calls.map(([x,y,xx,yy],i)=>call(i,x,y,xx,yy)).join("")}</svg>`;
}
