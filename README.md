# ICU Atlas

A self-contained, mobile-first personal learning app for an adult critical-care nurse. Use the live app in `docs/`. No backend, Firebase configuration, API key, package install, account, or paid service is needed. The app does not contain any Level Up backup data.

## Put it on GitHub Pages

1. Unzip the project. Create a GitHub repository that supports Pages (a public repository works on GitHub Free). Do not upload personal progress backups to the repository.
2. Upload the contents of the `icu-atlas` folder to the repository root. You should see `README.md`, `content/`, `tools/` and `docs/` directly in the repository. In particular, `docs/index.html` must exist. Commit to `main`.
3. In the repository go to Settings → Pages → Build and deployment. Select “Deploy from a branch”, choose `main`, then `/docs`, and save.
4. Open the HTTPS address shown by GitHub Pages once its deployment finishes. Do not open the ZIP or the GitHub code viewer as an app. All asset and worker paths are relative, including for repositories served under a subdirectory.

Platform instructions: [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [Apple’s Safari Home Screen guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Install on iPhone

Open your GitHub Pages address in Safari, select Share → Add to Home Screen, enable “Open as Web App” if shown, and select Add. Launch the Home Screen app once while online so the bundled lessons, graphics, question bank and application shell can be cached. External readings need a network connection.

Use the installed app as the main place you study. Browser contexts and homescreen apps can have different storage; export and import to move progress. Test by finishing one case, closing and reopening the installed app, and reopening a different lesson in airplane mode. The Perplexity preview is not the URL to install.

## Learning flow

- **Start:** A new record opens with “Cells and oxygen.” The suggested eight-stage route moves through foundations, bedside signals, single-organ reasoning, time-sensitive threats, system interactions, complications, organ support and person-centered synthesis. Skip ahead at any time. An unfinished check or a due topic can become the recommended next step.
- **Connect:** The dedicated Anatomy & pathophysiology section offers searchable, referenced pages. Follow an underlined term, then use “Return to…” or browser Back to restore your lesson tab, disclosed case reasoning and reading position. Professional-practice topics have their own context pages rather than spurious physiologic explanations.
- **See:** Compare normal and changed anatomical cutaways. Each has three labeled stages, playback, pause, a side-by-side comparison (stacked on phones), and a text sequence. The drawing represents one mechanism, not an individual patient. Choose Visual atlas to browse or use the relevant plate within a foundation or clinical lesson.
- **Check foundations:** Two distinct correct retrieval items since the latest miss check a foundation on the path. A miss or uncertainty returns it to review now; after one correct answer it returns in one day, and after both it returns in seven. This is tracked separately from clinical-case retention. Restoring an older version-1 backup does not discard newer foundation attempts when merging.
- **Learn:** Study a mechanism, recognize cues, decide what to prioritize, and decide how to reassess. Every lesson has a four-scene visual reasoning walkthrough; step through it manually, play it, or read its text transcript. Try the bedside case before revealing its worked reasoning. Mark the lesson studied after teach-back.
- **Practice:** Each skill has four distinct case questions (interpret, prioritize, transfer and reassess). A session presents the options in shuffled order; the editable source stores the keyed answer first. Answers have individual rationales. “Not sure” counts as an unresolved gap, not a correct guess.
- **Relearn:** Misses go into the immediate review queue. Read the contrasting explanation and answer a different or least-recently-seen case. Correct responses schedule a review after a day, then 7 or 14 days for retained skills. These are transparent app rules, not validated clinical thresholds or an age-specific prescription.
- **Track:** Three distinct correct cases including one transfer/reassessment item and successes separated by at least 24 hours (without an intervening miss) produce the “Retained” label. A later miss resets that evidence. Completing the readings and proving recall are separate measures.
- **Finish:** Study and attempt all clinical skills, then answer all 12 cases in one cumulative round correctly to mark the clinical checkpoint. For guided course completion, also check every guided step. Rounds can be repeated; neither marker certifies practice competence. Retention remains visible independently. `LEARNING-PATH.md` lists the complete suggested sequence.
- **Adjust:** Larger reading text, reduced motion, untimed cases, bookmarks and personal notes are available. Use small sessions or resume unfinished quizzes. No leaderboard or streak penalties.

## Progress, privacy and backups

This app writes the personal learning profile to an origin- and path-scoped browser Cache Storage entry on supported HTTPS hosts. The service worker uses a different cache; app updates do not deliberately erase the profile. A restrictive embedded preview can be session-only. Settings displays the active storage status; do not assume the embedded preview is a permanent record. User-cleared or evicted browser data cannot be recovered without a backup. No remote analytics, synchronization or patient data storage is provided. Do not enter patient information in notes. Exported JSON is unencrypted; store it privately.

Settings → Export JSON backup saves a portable file. On another device, Settings → Import backup previews counts before merge. Duplicated answer records are deduplicated; studied lessons and bookmarks are unioned. Matching note keys, preferences and the active session use the imported values. Other app backups, including Level Up backups, are intentionally rejected. Back up before a move or import.

## Content, references and clinical limits

The [AACN adult topic outline](https://www.aacn.org/education/online-courses/adult-ccrn-certification-review/adult-ccrn-certification-review-course-syllabus) informs breadth only. The curriculum is original, AI-authored study material. It is not the AACN course, official exam preparation, or an AACN-endorsed product. It is not a complete clinical reference and has not been signed off by a clinical educator. Completion of an app does not qualify a nurse to independently perform ICU procedures. Use local policies, credentialed supervision and simulation-based validation for practice.

Every lesson carries direct reading links. Readings include the free [Medical-Surgical Nursing textbook by Bowen, Carey, Palozie and Reinholdt](https://openstax.org/books/medical-surgical-nursing/pages/1-introduction), the Merck/MSD Manual Professional Edition, society publications and other clinical literature; see `CURRICULUM.md` for the full mapping. OpenStax: access for free at https://openstax.org/books/medical-surgical-nursing/pages/1-introduction. External materials retain their owners’ rights; no publisher’s manual, question bank, or third-party video is redistributed. The OpenStax-referenced educational adaptations are offered under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/). Decorative organ plates are AI-generated, not image-interpretation training. The five interactive models use original vector diagrams and link their educational references.

The design uses retrieval and distributed practice, informed by [Trumble et al., systematic review in health professions education](https://pmc.ncbi.nlm.nih.gov/articles/PMC11078833/). The chosen intervals, scores and cutoff are the app’s study rules, not validated competency measures.

## Maintain or extend it

Each `content/sNNN.json` holds one stable skill ID, source URLs, lesson sections, a worked case and four questions. Keep IDs and item order stable when making editorial changes so historical attempts remain meaningful. Maintain question-order mappings if making a new schema version. Edit clinical content only after checking the original reference and current guidance; have a critical-care educator validate material before institutional use. `CURRICULUM.md` is the generated contents and source index.

`content/maps.json` contains the walkthrough frames for each stable lesson ID. Run `node tools/test.mjs` after rebuilding to check the learning-record invariants and validate the compiled curriculum.

`content/atlas/` holds 81 foundational articles, `content/bridges/` links a companion article to each clinical lesson, and `content/route.json` orders the guided curriculum. The build checks complete route coverage, references, neighbors, and question shape. `docs/plates.js` contains the visual sequence scripts; `docs/illustrations.js` is the original vector drawing renderer. Bundled content and animations do not require a network connection after the standalone service worker finishes caching; linked readings do.

To rebuild after editing source or assets: run `node tools/build.mjs` (Node 18+). It validates content and creates `docs/curriculum.js`, `docs/sw.js` and `CURRICULUM.md`. Do not edit those generated files directly. Commit the changes including the generated files. For local development, serve the project root with any static HTTP server, then open `/docs/`. `file://` is not a supported install method. On a development machine, localhost is treated as a secure context; a phone requires HTTPS.
