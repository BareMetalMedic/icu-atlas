# Floor (bedside layer) · 1.0

The Floor section prepares a float-pool nurse for cardiac/tele, ortho and general med-surg floors, in the order a student would train for the Adult CCRN. It is a self-contained add-on, like Resuscitation.

## Files (docs/)
- `floor-ecg.js`: procedural ECG engine (beat schedules → lead II voltage at 250 Hz), 19-rhythm library with criteria, cell-to-strip explanation and floor actions, 6-second strips on 25 mm/s paper (two 3-second rows), draggable calipers, and a Philips-style live bedside monitor (ECG, pleth, resp, HR/SpO2/NBP/RR/temp, red/yellow/cyan alarm bar).
- `floor-meds.js`: 14 cardiac-floor medication cards (mechanism, dosing per FDA label or AHA 2025, hold-and-call, monitoring, adverse effects, antidote, pearls, one retrieval question, source links).
- `floor-sim.js`: simulation scenarios as small state machines. Node kinds: `choice`, `sbar` (build the page; the provider answers from what you sent), `mar` (scan, check BP, calculate, rate), `note` (SOAP compared to a key), `end` (debrief).
- `floor.js`: hub, CCRN-ordered module map (links every module to its existing ICU Atlas lessons), telemetry trainer, rhythm pages, interleaved drill with confidence ratings and expanding intervals (1/3/7/14/30 d), caliper practice, med pages, simulation runtime, learning record.
- `floor.css`: styles.

## Learning record
`profile.floor = { v:1, rh:{id:[box,due,n,ok]}, ra:[{r,ok,c,t}], mq:{id:[n,ok,t]}, sims:{id:[runs,best,t]}, cal:[{ok,t}] }`. Validated by `validFloor` (model.js calls it) and merged on import by `floorMerge` (app.js `mergeBackup`). Older backups without `floor` still import.

## Adding a scenario
Add an object to `FS_SCEN` in `floor-sim.js`: `pt` (banner + report), `labs`, `vitals`, `mar` (chart rows), `start`, `nodes` (each sets `mon` and either `choices`, or a `kind`), optional `sbar` (items with `need`, provider `asks`) and `mar` (order, weight, dose/rate questions, safety checks), `debrief`, `links`. Max score is computed from the nodes.

## Sources
AHA 2025 adult bradycardia and tachyarrhythmia algorithms; FDA labels via DailyMed (linked on each card); ISMP high-alert list; OpenStax Anatomy & Physiology 2e ch. 19; AACN Adult CCRN review course syllabus (module weights). Equipment workflows are modeled on Philips IntelliVue telemetry/monitors, the ICU Medical Plum 360 and Epic; screens are drawn in this app's own style with no vendor marks. Unit policy and the provider's order always win.

## Next (from claude/icu-atlas-floor-plan.md)
Plum 360 simulator and Philips alarm text once the reference pack (Brief B) returns; labs reader; 12-lead/STEMI; more cases per module (chest pain/STEMI alert, HF flare, symptomatic brady on a beta blocker, post-op hypotension, sepsis, hypoglycemia, compartment syndrome); swap in the illustration set (Brief A).
