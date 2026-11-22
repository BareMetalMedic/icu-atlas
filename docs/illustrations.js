/* Original vector cutaways. Coordinates are deliberately illustrative rather than quantitative.
 * Each scene defines its own topology; a phase advances transport/motion, not the clinical stage. */
function drawPlate(k,s,t){
 const red="#fa9184",deep="#9d505c",blue="#82c8e7",teal="#8be4cb",amber="#f5c582",pale="#e4eeee",nerve="#d2a9e1",ink="#172f40",wall="#996b72",flesh="#b87379";
 const path=(d,fill="none",stroke="none",w=1,a="")=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${a}/>`;
 const el=(x,y,rx,ry,f,st="none",w=1)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${st}" stroke-width="${w}"/>`;
 const dot=(x,y,r,f)=>el(x,y,r,r,f),ch=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join("");
 const line=(d,c,w=2)=>path(d,"none",c,w);
 const txt=(x,y,msg,c=pale,anc="start")=>`<text x="${x}" y="${y}" fill="${c}" text-anchor="${anc}" font-family="system-ui,sans-serif" font-size="12" font-weight="550">${msg}</text>`;
 const key=(x,y,msg,tx,ty)=>line(`M${tx} ${ty} L${x+2} ${y-7}`, "#8aa2ae",1)+txt(x,y,msg);
 const rbc=(x,y,r=1)=>el(x,y,7*r,4.2*r,red,deep,1)+el(x,y,3*r,1.2*r,"#c76e70");
 const bed=(d,w=25)=>line(d,wall,w+8)+line(d,"#603d4e",w);
 const wave=(t%1+1)%1,beat=(1-Math.cos(2*Math.PI*wave))/2;
 const phase=(i,n,spd=1)=>((t*spd+i/n)%1+1)%1;
 const trail=(n,fn,col=teal,r=2.5,spd=1)=>ch(n,i=>{let [x,y]=fn(phase(i,n,spd));return dot(x,y,r,col)});
 const cells=(n,fn,spd=1)=>ch(n,i=>rbc(...fn(phase(i,n,spd))));
 const tubep=(x0,y0,x1,y1,curve,p)=>[x0+(x1-x0)*p,y0+(y1-y0)*p+curve*Math.sin(p*Math.PI)];
 const tubed=(x0,y0,x1,y1,c)=>"M"+ch(25,i=>tubep(x0,y0,x1,y1,c,i/24).map(x=>x.toFixed(1)).join(" ")+(i===24?"":" L"));
 let g="";
 if(k==="aorta"){
  g+=bed("M25 104H419",61)+bed("M246 136Q248 167 267 188",17);
  if(s){let y=s===1?121:113;g+=path(`M134 137Q180 ${y-4} 218 ${y}T318 136L338 140H145Z`,"#45576a",blue,2)+line(`M136 133Q178 ${y-8} 221 ${y}T316 133`,amber,2)+cells(s===1?2:4,p=>[150+p*157,132-6*Math.sin(p*Math.PI)],.42)}
  g+=cells(7,p=>[27+386*p,94],.64)+cells(s===2?1:3,p=>[247+19*p*p,147+38*p],s===2?.2:.5);
  g+=key(25,40,"True lumen",88,85)+key(293,41,s?"Intimal flap":"Layered wall",299,s?127:70)+key(290,214,"Organ branch",262,181);
 }else if(k==="bladder"){
  g+=ch(2,i=>{let x=i?304:144;return el(x,57,23,29,"#976475",red,2)+line(`M${x} 70 Q${x+4} 107 ${i?246:206} 129`,blue,5)+trail(3,p=>[x+((i?246:206)-x)*p,71+p*55],teal,2,.45)});
  let rx=36+s*10,ry=24+s*6;g+=line("M225 151V203",blue,9)+el(225,147,rx,ry,"#507e94",blue,3)+el(225,150,rx-6,ry-7,"#789cac");if(s)g+=el(225,177+s*3,10,4,amber);else g+=trail(3,p=>[225,171+p*27],teal,2.4,.55);
  g+=key(27,46,"Kidney",120,58)+key(324,113,"Ureter",279,100)+key(294,180,"Bladder",259,151)+txt(25,216,s?"Outflow limited at outlet":"Urine exits through the urethra",teal);
 }else if(k==="diaphragm"||k==="abdomen"){
  let h=k==="abdomen"?[159,130,111][s]:s===0?151:s===1?158+beat*18:153+beat*6;
  g+=path("M137 185Q115 80 176 45Q221 22 270 44Q320 62 313 185Z","#345366",blue,3)+line("M220 29v46m0 0-40 39m40-39 39 37",blue,6);
  g+=path(`M153 ${h-4}Q142 85 186 57Q209 42 211 83L206 ${h-26}Z`,flesh,red,2)+path(`M232 56Q278 41 302 107L298 ${h-4}Q268 ${h-20} 236 ${h-23}Z`,flesh,red,2);
  g+=path(`M139 183Q220 ${2*h-206} 310 183V188H139Z`,"#8d6c6c",amber,3);
  if(k==="abdomen")g+=el(222,176,39+s*11,9+s*3,"#a47774",red,2);else if(s)g+=trail(s===1?7:3,p=>[220+(p>.52?(p-.52)*70:0),30+p*75],teal,2.7,s===1?.75:.35);
  g+=key(18,66,"Lung",159,89)+key(307,216,"Diaphragm",262,h)+txt(26,215,k==="abdomen"?"Abdominal contents":"Chest cutaway",teal);
 }else if(k==="recruit"){
  g+=line("M216 30v42m0 0-73 43m73-43 87 43",blue,8);let a=[37,39,51][s]+beat*2,b=[12,32,33][s]+beat*2;g+=el(135,126,a,a*.83,"#426c7a",blue,s===2?2:4)+el(307,126,b,s?b*.84:6,"#426c7a",blue,4);
  g+=bed("M70 178Q224 193 375 165",10)+cells(7,p=>[70+305*p,178+5*Math.sin(p*5)],.45)+trail(5,p=>[214-70*p,61+57*p],teal,2.4,.65)+trail(s?5:1,p=>[221+82*p,68+47*p],teal,2.4,.65)+txt(135,217,"Already aerated",pale,"middle")+txt(304,217,"Recruitable unit",pale,"middle");
 }else if(k==="valves"){
  g+=path("M184 117Q136 65 183 39Q226 23 256 57Q273 88 239 116Z","#835764",red,3)+path("M181 119Q217 86 252 117Q291 155 219 199Q169 171 181 119Z","#925d6b",red,4);
  g+=line("M247 133Q283 102 286 58Q289 36 315 48",red,13)+line(s===0?"M184 108l12 21m45-21-12 21":s===1?"M184 108l28 9 28-9":"M184 108l23 9m33-9-17 8",amber,4);
  g+=s===0?cells(4,p=>[212,67+p*94],.65):cells(4,p=>[244+62*p,137-93*p],.6);if(s===2)g+=trail(7,p=>[216+4*p,136-68*p],teal,2.6,.7);
  g+=key(30,61,"Left atrium",177,69)+key(27,152,"Mitral leaflets",188,112)+key(299,207,"Left ventricle",240,164);
 }else if(k==="crush"){
  g+=el(91,107,56,31,flesh,red,3)+ch(5,i=>line(`M49 ${89+i*8}l81 8`,deep,2))+ch(7,i=>dot(63+i*9,100+(i*7)%16,3,amber));
  g+=bed("M158 109Q218 98 269 111",29)+cells(4,p=>[160+105*p,107],.4);
  g+=line("M306 74q43-17 39 25q-28 28-5 50q25 16 42-1t33-12",blue,12);
  if(s)g+=path("M137 88l-12 11 14 4-13 10 12 11",ink,amber,2)+trail(5,p=>[129+118*p,107+3*Math.sin(p*8)],amber,2.8,.55);if(s===2)g+=trail(6,p=>[332+p*75,114+37*Math.sin(p*3)],amber,3,.5)+el(366,156,8,5,"#bd8b61",amber);
  g+=txt(88,54,"Muscle fiber",pale,"middle")+txt(216,59,"Bloodstream",pale,"middle")+txt(362,53,"Renal tubule",pale,"middle")+txt(116,207,"Amber dots represent myoglobin",amber);
 }else if(k==="swallow"){
  g+=line("M106 68q83-14 104 26q13 18 30 17",flesh,25)+line("M213 102q-35 36-43 89",blue,20)+line("M235 106q23 40 60 86",flesh,19);
  g+=line(s===1?"M186 107l39 8":"M193 89l16 17",amber,6)+ch(5,i=>line(`M${183-i*2} ${140+i*10}l-12 -3`,blue,3));
  if(!s)g+=trail(4,p=>[208-37*p,112+75*p],teal,2.6,.6);
  else g+=trail(5,p=>p<.48?[116+p*197,67+p*76]:s===1?[212+(p-.48)*150,104+(p-.48)*146]:[210-(p-.48)*73,104+(p-.48)*155],amber,4,.45);
  g+=key(28,45,"Pharynx",193,89)+key(289,76,"Esophagus",249,133)+key(42,179,"Trachea",170,169)+txt(197,216,s===2?"Material below the vocal folds":"Air and food pathways",teal);
 }else if(k==="cellular"){
  g+=bed("M18 92 Q109 77 195 86",38)+cells(s===2?2:5,p=>[23+165*p,92-9*Math.sin(p*2.3)],s===2?.3:.54);
  g+=path("M221 150Q210 109 235 80Q259 52 312 55Q382 53 406 89Q433 143 385 174Q331 207 265 183Q230 179 221 150Z","#355c64",teal,3)+el(357,99,22,16,"#526e89",blue,2);
  g+=el(292,140,38,18,"#ad806c",amber,2)+line("M259 138q7-19 10-1t10 1q4-20 9 0t10 1q5-25 10-1t13 1",amber,2.5);
  g+=trail(s===2?2:7,p=>[115+p*158,93+42*p+9*Math.sin(p*3.5)],teal,2.6,s===2?.35:.6);
  if(s)g+=trail(s===2?2:5,p=>[303+43*p,148+10*p],amber,2.6,.65);
  g+=key(24,40,"Capillary / red cells",87,70)+key(306,32,"Tissue cell",332,57)+key(24,187,"Interstitial space",180,122)+key(300,218,"Mitochondrion",291,157);
 }else if(k==="perfusion"){
  const dest=[68,118,168];g+=bed("M20 118H103",25)+bed("M351 118H435",25);
  dest.forEach((y,i)=>{let a=tubed(92,118,222,y,(i-1)*17),b=tubed(222,y,358,118,(i-1)*17);g+=bed(a+" "+b,s===2&&i===0?4:12)+cells(s===0?5:s===1?3:i===0?0:2,p=>p<.5?tubep(92,118,222,y,(i-1)*17,p*2):tubep(222,y,358,118,(i-1)*17,p*2-1),s?0.33:.55)});
  g+=cells(s?2:4,p=>[23+68*p,118],.7)+ch(5,i=>el(129+i*42,202,13,7,"#46696c",teal))+trail(s===0?8:s===1?4:2,p=>[165+(p*160)%155,165+26*p],teal,2,.6)+key(24,38,"Inflow",53,96)+key(252,37,"Capillary paths",280,75)+txt(135,225,"Oxygen-consuming tissue",teal);
 } else if(k==="delivery"){
  g+=bed("M24 97 Q210 79 430 97",55);
  g+=ch(s===0?8:4,i=>{let p=phase(i,s===0?8:4,.42),x=34+p*385,y=89+Math.cos(i*2.1)*9;return rbc(x,y,1.75)+dot(x-5,y-2,1.8,teal)+(s===2&&p>.5?"":dot(x+4,y+2,1.8,teal))});
  g+=ch(6,i=>el(70+64*i,177,23,14,"#426468",teal)+el(70+64*i,177,6,4,"#86a9a5"));
  g+=ch(s===0?7:3,i=>{let p=phase(i,s===0?7:3,.6);return dot(65+i*(s===0?52:125),118+45*p,2.8,teal)})+key(28,37,"Red cells carrying oxygen",98,74)+txt(122,211,"Working tissue cells",teal);
 } else if(k==="pump"||k==="tamponade"){
  let comp=k==="tamponade"?s*0.12:0, squeeze=(k==="pump"&&s?0.11:0.28)*beat,rx=1-comp-squeeze;
  let shape="M214 172 C185 152 132 123 136 85 C136 55 168 46 192 65 Q214 42 233 57 C275 38 304 64 294 102 Q283 145 214 172Z";
  g+=line("M173 70Q160 55 171 29",blue,16)+line("M235 77Q231 31 257 32Q278 31 277 53",red,18);
  if(k==="tamponade")g+=path("M214 205 C149 175 105 136 112 84 Q117 25 190 44 Q277 16 313 60 Q355 127 214 205Z","#23485d",blue,2);
  g+=`<g transform="translate(214 111) scale(${rx} ${1-comp-squeeze*.45}) translate(-214 -111)">`+path(shape,flesh,"#ebb3ab",3)+path("M215 156 Q171 130 175 90Q182 69 202 83Q220 103 215 156", "#4f687f",blue,2)+path("M220 154 Q215 101 225 83 Q247 66 267 82 Q287 106 220 154", "#6f384a",red,3)+line("M214 159Q204 118 212 87",pale,3)+"</g>";
  if(k==="pump"){g+=cells(s?2:5,p=>[246+30*p,56-24*Math.sin(p*Math.PI)],.5);if(s===2)g+=bed("M301 53Q336 46 409 55",10)+cells(2,p=>[304+100*p,53-4*Math.sin(p*3)],.34)+txt(296,81,"Reduced outflow",teal)}
  g+=key(24,155,"Ventricular wall",155,120)+key(292,179,k==="pump"?"Ejecting chamber":"Pericardial fluid",k==="pump"?249:288,122)+txt(28,214,k==="pump"?"Cycle repeats: fill → contract → eject":"Outer sac limits expansion",teal);
 } else if(k==="alveolar"||k==="embolus"){
  const y=88+beat*3;
  g+=path(`M180 27 V63 C124 63 116 ${y+48} 163 144 Q215 175 264 135 C302 105 273 66 234 63V27`,"#345461",blue,4);
  if(k==="alveolar"&&s){let h=s===1?119:86;g+=path(`M${s===1?146:143} ${h} q20 -8 45 0t43 0t${s===1?38:39} 0 Q275 147 228 150 Q171 164 146 ${h}Z`,"#6699ac",blue,1)}
  g+=bed("M72 153 Q210 226 341 150",17)+cells(k==="embolus"&&s?2:7,p=>[71+269*p,151+38*Math.sin(p*Math.PI)],.48);
  g+=trail(k==="alveolar"?[7,4,1][s]:s?1:5,p=>[173+p*65,123+p*60],teal,2.8,.7)+trail(5,p=>[199+Math.sin(p*9)*7,30+p*64],blue,2.3,.7);
  if(k==="embolus"){g+=bed("M64 154Q107 129 128 102",13);if(s)g+=path("M109 130q-13-10-1-20t17-4q10 10-3 18Z",amber,deep,2);if(s===2)g+=cells(5,p=>[71+p*51,152-p*46],.5)}
  g+=key(24,44,"Airway",180,51)+key(288,85,"Air sac",256,105)+key(270,216,"Capillary blood",281,180)+txt(21,215,k==="embolus"&&s?"Clot at branch":s&&k==="alveolar"?"Fluid in air space":"Gas exchange",teal);
 } else if(k==="airway"||k==="coronary"){
  let radius=[42,30,16][s],ay=112;g+=el(120,ay,66,64,k==="airway"?"#9c7379":"#a8626e","#e0ada3",3)+el(120,ay,53,51,"#cc9891");
  if(k==="airway"){g+=el(120,ay,radius,radius*.94,ink,blue,3)+ch(12,i=>{let a=i/12*6.283;return dot(120+57*Math.cos(a),ay+56*Math.sin(a),3.2,"#d8b2a1")});
   g+=path(`M234 72Q299 ${ay-radius} 418 72V151Q308 ${ay+radius} 234 151Z`,wall)+path(`M234 83Q315 ${ay-radius*.65} 418 83V139Q315 ${ay+radius*.65} 234 139Z`,ink,blue,2)+trail(8,p=>[237+175*p,111+Math.sin(p*6)*3],blue,2.5,s?.48:.85);
   if(s===2)g+=path("M105 112q5-17 19-12l-4 7-6 6Z",amber);
  }else{g+=el(120,ay,44,42,"#693947",red,2);if(s)g+=path("M83 92Q104 61 146 79Q163 89 164 122Q154 109 143 105Q116 95 95 117Q81 123 79 116Z",amber);
   if(s===2)g+=path("M92 113Q107 92 132 103Q153 108 157 128Q127 117 109 139Q97 140 92 113Z",deep,red,2);
   g+=bed("M233 113H424",53);if(s)g+=path("M251 88Q295 86 315 104Q329 114 355 98L379 88Z",amber);if(s===2)g+=el(317,116,23,9,deep,red,2);g+=cells(s?3:7,p=>[237+177*p,s?131:114],.45);}
  g+=txt(119,201,"Cross-section",pale,"middle")+txt(328,201,"Longitudinal view",pale,"middle")+txt(25,35,k==="airway"?"Airway wall and lumen":"Vessel wall and lumen",teal);
 } else if(k==="conduction"){
  let nodes=[[193,63],[213,104],[215,144],[191,162],[246,141]],cx=s===0?193:s===1?213:215,cy=s===0?63:s===1?104:144;
  g+=path("M219 194Q136 161 135 90Q131 38 182 40Q210 39 217 62Q254 23 283 54Q339 113 219 194Z","#855764","#e2aba3",3)+line("M147 100Q207 128 292 89",pale,2)+line("M217 102Q227 148 218 181",pale,3)+line("M193 63Q206 75 213 104L215 144L191 162M215 144L246 141",amber,3);
  g+=ch(nodes.length,i=>dot(...nodes[i],i===s?7:4,amber))+el(cx,cy,10+beat*19,10+beat*12,"none",teal,2)+key(31,54,"SA node",190,61)+key(292,94,"AV node",216,104)+key(272,202,"Ventricular branches",242,146);
 } else if(k==="pleura"){
  let w=[1,.76,.57][s]+beat*.022;g+=path("M137 184Q110 99 181 39Q208 18 222 36Q247 34 277 69Q322 119 306 184Z","#345366",blue,4)+line("M216 32v53m0 0-37 39m37-39 31 25",pale,6);
  g+=`<g transform="translate(212 119) scale(${w} ${w}) translate(-212 -119)">`+path("M147 176Q128 101 184 47Q207 30 209 51L201 149Q194 168 147 176Z",flesh,red,2)+"</g>";
  g+=path("M227 47Q247 43 273 78Q302 125 296 175Q250 164 232 150Z",flesh,red,2)+key(22,83,"Pleural space",150,100)+key(335,95,"Lung",277,111)+txt(113,211,s?"Air separates the pleural surfaces":"Thin, coupled pleural surfaces",teal);
 } else if(k==="cranium"){
  g+=path("M145 185Q119 171 120 112Q119 34 212 29Q309 25 320 101Q325 136 301 161L280 181Q258 200 238 202L231 184Z","#d6c8ad","#efe1c5",3)+el(219,110,91,71,"#5b939b",blue,2)+el(218,110,85,64,"#a57b91","#d5b8cc",2);
  g+=ch(7,i=>line(`M${151+i*20} ${101+9*Math.cos(i)}q-10 -26 5 -32t13 4`, "#7e5c73",2))+el(217+s*5,118,19-s*6,8-s*2.4,blue)+el(158+s*4,103,3+s*10,7+s*13,deep,red,2)+key(29,91,"Added volume",157,102)+key(316,70,"Fixed skull",295,60)+key(290,216,"CSF space",225,122);
 } else if(k==="synapse"){
  g+=path("M192 24H236V67Q295 110 262 128Q209 148 158 126Q135 106 191 70Z","#a67c8b",nerve,3)+ch(5,i=>el(167+i*20,114+(i%2)*7,6,6,"#805166",amber))+path("M84 160Q142 147 186 157T280 157T372 157V197H84Z","#a66f71",red,3);
  g+=ch(s===2?3:7,i=>line(`M${152+i*(s===2?47:16)} 156v-7l-4 -4m4 4 4-4`,teal,3));
  g+=s?trail(9,p=>[158+(p*117)%116,132+16*p],amber,2.7,.7):trail(4,p=>[213,25+75*p],teal,3,.7);
  g+=key(28,76,"Motor axon",190,68)+key(304,113,"Terminal",267,119)+key(295,217,"Muscle membrane",275,161);
 } else if(k==="nephron"){
  g+=path("M166 54Q220 24 256 64Q295 117 252 147Q236 158 226 153L247 174Q267 192 299 175Q345 143 389 168","none",blue,10);
  g+=bed("M40 102Q104 102 144 88",s===2?14:24)+line("M142 87Q190 32 210 85T239 89Q253 47 213 61Q171 64 165 109T215 124Q244 78 196 93Q163 110 149 117Q113 136 71 131",red,7)+cells(s===2?2:4,p=>[40+104*p,102-14*p],.6);
  g+=trail(s===2?3:8,p=>[214+43*p,106+p*36],teal,2.2,.7);if(s)g+=trail(s===2?2:6,p=>[232+151*p,155+22*Math.sin(p*5)],teal,2.7,.52);
  g+=key(24,48,"Incoming blood",88,99)+key(252,44,"Capillary tuft",211,78)+key(300,211,"Tubule / filtrate",325,169);
 } else if(k==="osmosis"||k==="glucose"){
  let rx=k==="osmosis"?[65,73,88][s]:76;g+=el(226,123,rx,65+(rx-65)/2,"#385e67",teal,3)+el(237,130,17,12,"#597d80","#97bab4",2);
  g+=ch(11,i=>dot(189+i*7,92+(i*23)%58,2.6,amber))+ch(k==="osmosis"&&s?5:k==="glucose"&&s===2?24:12,i=>dot(58+(i*43)%77,66+(i*29)%106,3,amber));
  if(k==="osmosis"){g+=trail(6,p=>[104+p*84,117+(p*3%1)*12],blue,2.6,.6);g+=trail(s?2:6,p=>[181-p*68,144],blue,2.4,.5)}
  else{let n=s===1?5:2;g+=ch(n,i=>{let a=2.58+i*.24;return el(226+rx*Math.cos(a),123+65*Math.sin(a),4,7,amber,ink,1)})+trail(s===1?6:2,p=>[105+p*98,123],amber,3,.6)}
  g+=txt(22,40,k==="osmosis"?"Extracellular fluid":"Extracellular glucose",amber)+key(309,193,"Cell membrane",277,163)+txt(223,216,k==="osmosis"?"Water moves across the membrane":"Insulin-responsive muscle cell",teal,"middle");
 } else if(k==="leak"){
  g+=path("M20 72H430V119H20Z","#633e4e")+line("M20 71H430",wall,8)+cells(7,p=>[25+400*p,94],.45);
  g+=ch(8,i=>el(43+i*50,120,s?19:25,5,flesh,red,1));if(s)g+=ch(s===1?3:7,i=>{let p=phase(i,s===1?3:7,.45);return dot(67+i*50,124+p*46,2.8,i%2?blue:amber)});
  g+=ch(6,i=>el(57+i*66,171+(s===2?10:0),24,12,"#4c6972",teal));if(s===2)g+=el(219,154,59,9,"#557e95");
  g+=key(28,36,"Capillary lumen",72,77)+key(284,44,"Endothelial lining",331,118)+txt(134,216,"Interstitial tissue",teal);
 } else if(k==="gut"||k==="placenta"){
  if(k==="placenta"){g+=path("M31 171Q230 146 420 172V193H31Z",flesh,red,3);if(s)g+=el(273,161,24+s*18,5+s*4,deep,red,2)}
  g+=ch(6,i=>{let x=54+i*60,y=k==="placenta"?65:162,h=(k==="gut"?-1:1)*(60+9*Math.sin(i));let loss=s===2&&i%3===1&&k==="gut"?18:0;
   return path(`M${x} ${y}q4 ${h+loss} 18 ${h+loss}t18 ${-h-loss}`,flesh,s===2&&i%3===1?amber:red,3)+line(`M${x+8} ${y}q6 ${h*.78} 13 ${h*.78}t6 ${-h*.78}`,blue,3)+dot(x+14,y+h*.7*phase(i,6,s?.4:.7),2.5,teal)});
  if(k==="placenta")g+=line("M45 62H406",red,9)+cells(6,p=>[35+380*p,135+5*Math.sin(p*8)],.38);
  else g+=bed("M31 170H423",12)+cells(s===0?8:s===1?4:2,p=>[34+383*p,171],.42);
  g+=txt(26,39,k==="gut"?"Intestinal lumen":"Fetal vessels inside villi",teal)+txt(115,216,k==="gut"?"Mucosal capillary supply":"Maternal side / uterine wall",pale);
 } else if(k==="portal"){
  g+=path("M140 78Q189 32 285 51Q339 58 346 92Q327 127 284 156Q209 173 149 140Q129 115 140 78Z","#99686b",red,3)+bed("M36 135Q90 139 143 113",19)+bed("M344 90Q387 98 419 76",13);
  for(let i=0;i<5;i++)g+=line(tubed(142,113,344,91,(i-2)*12),s?"#bb8990":red,s?3:5)+cells(s?1:3,p=>tubep(142,113,344,91,(i-2)*12,p),.5);
  if(s)g+=ch(7,i=>line(`M${166+i*20} 82l10 52`,amber,4));
  if(s===2)g+=bed("M81 139Q118 199 188 178T335 144",10)+cells(4,p=>[83+p*249,140+40*Math.sin(p*Math.PI)],.45);
  g+=key(23,51,"Portal inflow",81,128)+key(287,34,"Liver sinusoids",282,83)+txt(122,217,s===2?"Alternate venous outflow":"Flow toward hepatic veins",teal);
 } else if(k==="clot"){
  g+=bed("M27 107H423",57)+path("M195 142l14-29 13 20 14-15 9 24Z",ink,amber,2)+cells(7,p=>[28+391*p,97],.4);
  g+=ch(s===0?3:s===1?11:16,i=>el(s?192+(i*19)%55:118+i*38, s?116+(i*13)%20:119,5,3,amber));
  if(s===2)g+=ch(7,i=>line(`M${187+i*7} 109l19 23m-23 -1 24-22`,teal,1.5));
  g+=key(24,36,"Vessel lumen",80,83)+key(246,186,s===2?"Fibrin mesh":s===1?"Platelet plug":"Damaged lining",221,132)+txt(26,217,"Localized vessel injury",teal);
 } else if(k==="skin"||k==="compartment"||k==="muscle"){
  if(k==="skin"){
   let h=s*10;g+=path(`M45 72Q218 ${72+h*2} 408 72V176H45Z`,"#b69373")+path(`M45 71Q218 ${71+h*2} 408 71v18Q218 ${95+h*2} 45 90Z`,flesh,red,2)+el(225,174,55,15,"#cfc1a4",pale,2)+el(224,133,64,10-s*3.4,"#6b3e51",red,2)+cells(s?2:5,p=>[172+104*p,134],.4)+path(`M169 42h109v${16+h}q-54 15-109 0Z`,"#65818b",blue);
   g+=key(22,35,"External load",170,52)+key(302,209,"Bony prominence",255,174);
  } else{
   g+=el(225,115,129,72,"#73535f",pale,4);
   g+=ch(11,i=>{let x=154+(i%4)*42+(i>7?10:0),y=81+Math.floor(i/4)*33,r=k==="compartment"?14+s*2:19-s*4;return el(x,y,r,r*.74,flesh,red,2)+line(`M${x-r*.5} ${y+2}l${r} -4`,deep,1)});
   if(k==="compartment")g+=el(306,140,19,9-s*3.3,"#63394b",red,2)+el(308,120,9,5,amber)+key(307,201,"Small vessel",305,143);
   else g+=key(302,201,"Muscle fiber",270,143);
   g+=key(26,53,k==="compartment"?"Fascial envelope":"Fiber bundle",119,81);
  }
 }else throw Error("Missing anatomical plate: "+k);
 return `<svg viewBox="0 0 452 236" width="452" height="236" role="img" aria-label="${esc(PLATES[k][0]+': '+PLATES[k][4][s][0]+'. '+PLATES[k][4][s][1])}">${g}</svg>`;
}
