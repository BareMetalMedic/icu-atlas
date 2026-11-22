const UNIT=[
 ["cardio","Cardiovascular","Pressure, flow, and cardiac function.","pulse","#b15551","#f6eae5"],
 ["resp","Respiratory","Gas exchange, airways, and ventilation.","wind","#326d97","#e5eff4"],
 ["neuro","Neurological","Consciousness, perfusion, and neurologic change.","brain","#72618d","#eee9f3"],
 ["renal","Renal & genitourinary","Fluid balance, filtration, and kidney support.","drop","#427b78","#e1f0ed"],
 ["gi","Gastrointestinal","Bleeding, nutrition, and abdominal emergencies.","layers","#956d34","#f4eddf"],
 ["heme","Hematology & immunity","Blood cells, clotting, transfusion, and immune injury.","drop","#a44b67","#f5e7ee"],
 ["endo","Endocrine","Glucose, hormones, and water balance.","activity","#4d7e69","#e1eee8"],
 ["skin","Integumentary","Skin integrity, infection, and tissue perfusion.","layers","#91684f","#f4e8dc"],
 ["msk","Musculoskeletal","Limb threats, fractures, and critical illness weakness.","activity","#5d678f","#e8ebf4"],
 ["multi","Multisystem","Shock, organ interactions, and complex ICU care.","grid","#377c8a","#dfeef1"],
 ["psych","Behavioral & psychosocial","Cognition, safety, and recovery after intensive care.","brain","#88627d","#f1e7ed"],
 ["ethics","Professional caring & ethics","Advocacy, collaboration, and patient-centered decisions.","users","#467c6d","#e5f0ea"]
];
const unit=k=>UNIT.find(u=>u[0]===k);
const P={
 book:"M3 4q5-2 9 1 4-3 9-1v15q-5-2-9 1-4-3-9-1z M12 5v15",
 grid:"M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
 layers:"M12 3 2 8l10 5 10-5z M3 12l9 5 9-5 M3 16l9 5 9-5",
 flask:"M9 3h6 M10 3v6L4 19q0 2 2 2h12q2 0 2-2l-6-10V3 M7 15h10",
 repeat:"M4 10a8 8 0 1 1 1 7 M4 4v6h6",chart:"M4 3v17h17 M8 16v-4 M13 16V9 M18 16V6",
 arrow:"M4 12h15 M13 6l6 6-6 6",chev:"m9 5 7 7-7 7",back:"M20 12H5 M11 6l-6 6 6 6",
 clock:"M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0 M12 7v5l3 2",check:"m5 12 4 4L19 6",
 target:"M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 1 1 10 0 M12 12h.01",
 pulse:"M2 12h5l3-8 4 16 3-8h5",activity:"M2 13h5l3-7 4 12 3-5h5",wind:"M2 9h13q5 0 4-4-1-3-4-1 M2 13h16q5 0 3 4-1 2-3 1 M3 17h7q4 0 2 3",
 brain:"M12 5q-4-5-7 1-4 1-2 6-2 4 2 5 0 5 5 3l2-2z M12 5q4-5 7 1 4 1 2 6 2 4-2 5 0 5-5 3l-2-2 M6 8l2 2 M6 15l3-2 M18 8l-2 2 M18 15l-3-2",
 drop:"M12 2q-2 4-6 9-6 10 6 11 12-1 6-11-4-5-6-9z",users:"M15 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0 M3 21v-2q0-5 8-5t8 5v2 M18 4q4 1 2 5 M19 14q4 2 3 6",
 menu:"M3 6h18 M3 12h18 M3 18h18",x:"m5 5 14 14 M19 5 5 19",search:"M16 10a6 6 0 1 1-12 0 6 6 0 1 1 12 0 M15 15l6 6",
 settings:"M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M9 15v6",device:"M7 2h10q2 0 2 2v16q0 2-2 2H7q-2 0-2-2V4q0-2 2-2z M10 18h4",
 play:"m7 4 13 8-13 8z",spark:"m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z",
 case:"M4 7h16q1 0 1 1v12H3V8q0-1 1-1z M8 7V4h8v3 M9 13h6 M12 10v6",
 mark:"M6 3h12v18l-6-4-6 4z",external:"M13 3h8v8 M21 3 10 14 M9 5H4v15h15v-5",
 calendar:"M3 6h18v15H3z M3 10h18 M7 3v6 M17 3v6",wave:"M2 12q3-13 6 0t6 0 6 0",pin:"M8 3h8l-1 6 3 4v2H6v-2l3-4z M12 15v7",cap:"m2 8 10-5 10 5-10 5z M6 10v5q6 5 12 0v-5",clipboard:"M7 5H4v16h16V5h-3 M8 3h8v4H8z M8 12h8 M8 16h5",bars:"M4 19v-4 M9 19V9 M14 19V5 M19 19V2"
};
function I(name,size=18){return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${P[name]||P.book}"/></svg>`}
const refs={
 scope:["AACN · Adult CCRN course outline","https://www.aacn.org/education/online-courses/adult-ccrn-certification-review/adult-ccrn-certification-review-course-syllabus"],
 manual:["OpenStax · Medical-Surgical Nursing","https://openstax.org/books/medical-surgical-nursing/pages/1-introduction"],
 learning:["Trumble et al. · Distributed and retrieval practice","https://pmc.ncbi.nlm.nih.gov/articles/PMC11078833/"],
 hemo:["OpenStax · Cardiovascular concerns","https://openstax.org/books/medical-surgical-nursing/pages/35-2-cardiovascular-concerns"],
 cpp:["StatPearls · Cerebral perfusion pressure","https://www.ncbi.nlm.nih.gov/books/NBK537271/"],
 gas:["Merck Manual · Measurement of gas exchange","https://www.merckmanuals.com/professional/pulmonary-disorders/tests-of-pulmonary-function-pft/measurement-of-gas-exchange"],
 abg:["Merck Manual · Acid-base disorders","https://www.merckmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/acid-base-disorders"],
 ecg:["OpenStax · Cardiac muscle and electrical activity","https://openstax.org/books/anatomy-and-physiology-2e/pages/19-2-cardiac-muscle-and-electrical-activity"]
};
