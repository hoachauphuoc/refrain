---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast — switched from learn after slice 2 at the learner's instruction: "từ đây về sau hãy dùng talivy khảo sát rồi tự làm đừng hỏi lại tôi" (from here on, research with Tavily and decide; don't ask me again). Started in learn mode ("leam mode"); build order approved: "ok".

Google Cloud: project `refrain-coach-fanr1s` — billing linked to "My Billing Account", services on, budget alert, and the service account `refrain-run` with `roles/aiplatform.user` — was created on Oct 3, 2026, before this plan was approved, at the learner's go-ahead ("bạn cứ thực hiện hiện tại tôi còn credit 200 đô" — "go ahead, I have $200 of credit left").

## Slices

- [x] **1. Your survey becomes a real AI roadmap**
  Becomes usable: Open Refrain locally, read the Welcome screen and its data notice, answer the four survey questions, and get a roadmap of 4–6 stages (minutes and sessions per day) with a reason Gemini wrote from your answers. It is still there after a reload, and **Reset everything** brings Welcome back.
  Why now: It proves the riskiest piece first — the app's own Gemini 3.8 Flash calls through Vertex AI with no API key (a direct REST call on the new project already worked) — and bootstraps the server, page shell, palette, and saved progress inside the first behavior you can use. Every later slice lands on this Home screen.
  PRD ref: `prd.md > The Core Journey` (steps 1–3), `prd.md > Survey and Roadmap`, `prd.md > Screens and Layout` (Welcome, Survey, Home), `prd.md > Progress on This Device`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Components` (Page shell and screen switching, Saved progress, Server calls, Welcome screen, Survey screen, Home screen, App setup and security headers, API routes and input checks, Fixed rules, Coach: roadmap builder, Gemini client and simulated coach), `spec.md > Look and Feel`, `spec.md > File Structure`, `spec.md > External Services and Dependencies`, `spec.md > Decisions and Open Issues` (Verify early in the build)
  Build: Scaffold per the file structure — pinned `requirements.txt` and `requirements-dev.txt`, `.python-version`, `.env.example`, `.gitignore` additions, and a `.venv`. One-time Google sign-in for local AI calls (`gcloud auth application-default login`, which opens the browser). Write `scripts/smoke_gemini.py` first and run it to settle the SDK details (verify-early items 1–4 and 7) before building on them. Then the server: `refrain/gemini.py` (client, one `gemini_call` log line per call, `FakeGemini`), the roadmap half of `rules.py` (`check_roadmap`, `default_roadmap`, `default_reason`, `sessions_per_day`, `mentions_survey`, `has_claim`), the roadmap builder in `coach.py` (one retry, then the default plan), `schemas.py`, `POST /api/roadmap` in `routes.py`, and `create_app()` with the security headers. Then the browser: `index.html`, `styles.css` with the palette tokens, `dom.js`, `store.js`, `api.js`, and the Welcome, Survey, and Home screens (goal, stage cards, the first-rule placeholder, "Your first session is ready", and **Reset everything** with its confirmation). Tests for the roadmap rules and the endpoint.
  Verify (mechanical): `python scripts/smoke_gemini.py` prints a valid JSON answer with token counts and an estimated cost; `pytest` passes, including `default_roadmap` passing `check_roadmap` with distinct stages for every maximum from 5 to 120; `flask --app main run` serves `/` with the three security headers; real `POST /api/roadmap` calls for the two contrasting surveys (a 16-year-old revising for an exam, a 35-year-old certification learner) return stages that pass `check_roadmap` and reasons that name their different goals; in the browser, Welcome → Survey → Home renders, invalid fields show their messages, and a reload keeps the roadmap.
  Learner check: Start the app, open http://localhost:8080, and fill in the survey as yourself or as the junior-manager persona. Read your roadmap: do the starting length and the reason feel right for you? Then reload the page and check that the roadmap is still there.
  Commit: `Add survey and AI roadmap via Gemini on Vertex AI`

- [x] **2. Your distraction notes become your rule, and the coach checks your explanation**
  Becomes usable: From Home, type a topic, switch on **Demo length**, and start the dark focus screen with the countdown and your rule. Tap **Distracted** with notes such as "Slack" and "email ping", hear the chime at zero, explain the core idea in two or three sentences (or **Skip**), and read the debrief: what you got, what's missing, two questions for next time, your pattern quoting your notes, an if-then rule, and the roadmap moving up or holding. Home then shows the new stage, the rule, and a history row, and the next focus screen shows the rule.
  Why now: This is the unique kernel — your own notes turned into a personal rule, your own explanation checked — so it comes straight after the roadmap it needs, while there is the most time left to tune the coach's words.
  PRD ref: `prd.md > The Core Journey` (steps 4, 6–9), `prd.md > Focus Session and Distraction Logging`, `prd.md > Teach-back`, `prd.md > AI Debrief`, `prd.md > Roadmap Progression`, `prd.md > States and Boundaries`, `prd.md > Screens and Layout` (Home, Focus Session, Teach-back and Debrief)
  Spec ref: `spec.md > The Core Journey Through the System` (steps 4, 6–9), `spec.md > Components` (Home screen, Focus screen and timer, Teach-back and Debrief screen, Fixed rules, Coach: debrief writer), `spec.md > Data Model`, `spec.md > External Services and Dependencies` (Refrain's own API), `spec.md > Important Failure Modes`
  Build: The progression half of `rules.py` (`tap_allowance`, `progress` with every row of the table, `roadmap_sentence`, `outside_interruption`); `POST /api/debrief` (validate → progression → coach, with the progression returned even when the coach fails); the debrief writer in `coach.py` with the code-enforced edge cases (explanation given or skipped, no taps, taps without notes, the pattern quoting a note, the rule's if-then form, one retry) and its `FakeGemini` answer. In the browser: Home's topic field, **Demo length** switch, **Start session**, rule card, and history rows; `timer.js` (countdown from the end time, chime on the Web Audio clock) and `focus.js` (**Distracted** with the note field and tally, completion at zero); `pending` in `store.js`; `debrief.js` (teach-back, debrief cards, **Try again**, **Back to roadmap**); and `main.js` reopening Teach-back or the debrief retry after a reload. Tests for every progression case and the debrief edge cases.
  Verify (mechanical): `pytest` passes, covering every row of the progression table, the allowance examples (25 → 5, demo → 2), 0 taps keeping the previous rule, a skipped teach-back returning only pattern, rule, and roadmap, a pattern that forgets the notes getting them put in front, and a Gemini failure still returning the progression; a real `POST /api/debrief` with the notes "Slack" and "email ping" returns a rule in "If …, then I'll …" form, a pattern quoting a note, and exactly two questions; a one-minute demo session runs end to end in the browser, and a reload during the teach-back reopens Teach-back; the `gemini_call` log lines show tokens and `est_usd`.
  Learner check: With **Demo length** on, run one session on something you studied today: tap **Distracted** twice with your own notes, let the minute end, write two sentences, and read the debrief. Does the rule sound like it was written for you, and is *What's missing* fair? Once, leave the tab in the background for the whole minute and check that the chime still plays on time.
  Commit: `Add focus session, teach-back, and AI debrief`

- [x] **3. The next session opens by asking what you remember**
  Becomes usable: After a debrief with an explanation, Home offers **Start with warm-up**. You answer the two saved questions from memory and press **Check**; each shows got it, partly, or missed with its one-line answer, and **Start focusing** clears them and opens the focus screen. After a skipped teach-back, the next session starts directly.
  Why now: It closes the memory half of the kernel — the recall that makes the teach-back worth doing — using the questions slice 2 already saves.
  PRD ref: `prd.md > The Core Journey` (steps 5 and 10), `prd.md > Warm-up Recall`, `prd.md > Screens and Layout` (Warm-up)
  Spec ref: `spec.md > Components` (Warm-up screen, Coach: warm-up checker), `spec.md > External Services and Dependencies` (Refrain's own API), `spec.md > Data Model` (`warmup`)
  Build: `POST /api/check`; the warm-up checker in `coach.py` (empty answers marked missed by code, and no Gemini call when every answer is empty) and its `FakeGemini` answer; `warmup.js` with the verdicts, the one-line answers, and a **Start focusing** that works even when the check fails; Home's **Start with warm-up**. Tests for the empty-answer cases and the verdict values.
  Verify (mechanical): `pytest` passes, including empty answers marked missed without a Gemini call; a real `POST /api/check` returns one valid verdict per answered question; in the browser, a debrief with an explanation leads to **Start with warm-up** → **Check** → verdicts → **Start focusing** → the focus screen, and the questions are gone afterwards.
  Learner check: Start your next session with the warm-up. Answer one question from memory and leave the other empty, then press **Check**. Do the marks and one-line answers feel fair?
  Commit: `Add warm-up recall checked by the coach`

- [x] **4. A meeting can cut a session short without costing you progress**
  Becomes usable: **End early** opens the panel while the countdown keeps running. **I was pulled away**, with "Where I stopped" and "My next step", holds your stage; the debrief says plainly that being pulled away is not a focus lapse and gives a ready-to-resume rule; and Home shows **Pick up where you left off** (the next step also appears on the next focus screen) until the next session ends. **I lost focus** eases back one stage, never below the first, and **Keep going** returns to the countdown.
  Why now: It is the learner's own story — meetings and urgent tasks cutting focus — and the demo's closing beat. It reuses the session, debrief, and progression paths from slices 2 and 3 without changing them.
  PRD ref: `prd.md > The Core Journey` (steps 7 and 10), `prd.md > Ending Early and Pulled Away`, `prd.md > AI Debrief` (outside interruption, not a lapse), `prd.md > Roadmap Progression`, `prd.md > States and Boundaries` (pulled away with both fields blank)
  Spec ref: `spec.md > Components` (Focus screen and timer, Home screen, Coach: debrief writer), `spec.md > Data Model` (`resume`), `spec.md > Decisions and Open Issues` (agent-proposed details: pulled away with no taps, zero while the End-early panel is open)
  Build: The End-early panel in `focus.js` (**Keep going**, **I lost focus**, **I was pulled away** with two optional fields and **Save and end**; zero while the panel is open counts as completed; the chime is cancelled on an early end); `endSession` with the outcome and the resume note; `resume` replaced or cleared at every session end; Home's **Pick up where you left off** card and the next-step line on the focus screen; in the debrief writer, the ready-to-resume rule for outside interruptions, a rule for pulled away with no taps, and the "before you were pulled away" pattern line. Tests for pulled away (hold plus the not-a-lapse sentence), lost focus on stage 1 and above, and 0 taps plus pulled away.
  Verify (mechanical): `pytest` passes for the new cases; a real `POST /api/debrief` for a pulled-away session with the note "meeting" returns a ready-to-resume rule in if-then form; in the browser, both End-early paths move the roadmap correctly, and the pick-up card appears with a note and clears after the next session; cost check — after the first five real sessions, total the `gemini_call` lines per session, compare them with the ≈ $0.02 estimate at `medium`, and record the cost and latency here.
  Learner check: Start a session, press **End early** → **I was pulled away**, write where you stopped and your next step, and check that the debrief says your stage holds and Home shows **Pick up where you left off**. Then try **I lost focus** once and watch the roadmap ease back one stage.
  Commit: `Add end early: pulled away holds, lost focus eases back`

- [x] **5. You can see what Refrain is doing for you**
  Becomes usable: Welcome names the problem Refrain solves and the three steps of its loop. Home shows one line of totals — sessions, minutes focused, and warm-up answers recalled — each history row shows its warm-up result, and the rule card says which of your notes the rule came from. While the coach works, the status line says how long it usually takes.
  Why now: The learner said they couldn't see clearly how the app helps its users ("Tôi chưa thấy rõ app giúp ít cho người dùng như thế nào" — "I don't clearly see how the app helps users"). With the loop complete (slices 1–4), its results can be shown before the public link goes up. Monitoring progress helps people reach goals, more so when it is recorded (Harkin et al. 2016), and past about 10 seconds people should be told how long a wait will be (Nielsen, NN/g).
  PRD ref: `prd.md > Screens and Layout` (Welcome, Home (Roadmap)), `prd.md > Roadmap Progression` (no streaks), `prd.md > Warm-up Recall`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components` (Server calls, Welcome screen, Home screen, Warm-up screen, Teach-back and Debrief screen), `spec.md > Data Model` (`recall`, `rule.fromNotes`, `rule.pulledAway`)
  Build: Welcome copy in `index.html`; the totals line and per-row warm-up text in `home.js`; `fromNotes` and `pulledAway` saved with the rule in `debrief.js` and shown on Home's rule card; wait lines in `api.js`, used by the survey, the warm-up, the teach-back, and the debrief's Try again. No server change and no new AI calls.
  Verify (mechanical): `pytest` passes; in the browser, sessions with and without a warm-up give the right totals and row text, the rule card quotes the notes the rule came from, a reload keeps everything, and Reset clears it; each AI wait shows its line; nothing under `static/` mentions a streak.
  Learner check: After a few demo sessions, read Home's totals line and the rule card: can you tell at a glance what changed and where your rule came from?
  Commit: `Show what Refrain is doing for you`

- [x] **6. A public link anyone can try**
  Becomes usable: Refrain runs at a public `https://refrain-….run.app` address from the new project, with per-visitor and daily limits on AI use, and a README that explains how to run it, deploy it, and switch it off.
  Why now: Everything it serves is already built. Deploying adds only the limits and Cloud Build's first-deploy permissions, so it goes last; if it slips, the demo can still be recorded locally.
  PRD ref: `prd.md > The Core Journey` (success), `prd.md > States and Boundaries` (AI request fails, data boundary)
  Spec ref: `spec.md > Where It Runs and How Someone Tries It` (public link), `spec.md > Components` (Rate limits, Cloud Run service), `spec.md > Important Failure Modes` (someone hammers the public link), `spec.md > Verification` (public link)
  Build: `ratelimit.py` (30 AI requests per IP per hour, 360 Gemini calls per UTC day), wired into the three routes in the spec's order; `Procfile`, `.gcloudignore`, and `README.md` (what Refrain is, run locally, deploy, demo path, how to stop spending); deploy with the spec's `gcloud run deploy` command; and log `X-Forwarded-For` once on the deployed service to confirm which entry is the real client. Tests for the limits: 429 on roadmap and check, and a debrief that still returns its progression with `coachError: "rate_limited"`.
  Verify (mechanical): `pytest` passes; the deploy succeeds; the `run.app` URL returns the three security headers; the demo path is walked once on the public URL with real Gemini; 31 warm-up checks with empty answers (no Gemini cost) return 429 on the 31st; the real `X-Forwarded-For` entry is confirmed and the code uses it.
  Learner check: Open the public link in another browser or on your phone, walk the demo path once, and say whether it behaves the same as on your laptop.
  Commit: `Deploy Refrain to Cloud Run with rate limits`

- [x] **7. Refrain looks like a product: the Night study design**
  Becomes usable: Every screen moves to the Night study look, and everything works as before:
  - a night sky with a faint aurora, glass cards, and long text on a lamp-lit page;
  - Fraunces headings and Inter text;
  - a top bar with the ring-and-star logo, icons, glowing buttons, and the stage path;
  - "What the coach is doing" while the AI works;
  - smooth changes between screens.
  Why now: The learner found the interface too plain: "Khảo sát thêm về giao diện hiện tại giao diện quá đơn điệu tôi muốn 1 giao diện chuyên nghiệp và lung linh khiến người dùng thích thú và ban giám khảo phải wow" ("survey the current interface further — it's too monotonous; I want a professional, sparkling interface that delights users and wows the judges"). Building the design system first lets slices 8–12 be built straight into it instead of being restyled later. People judge better-looking interfaces as easier to use (Kurosu & Kashimura 1995), and a judge's first impression is formed in the opening seconds of the video.
  PRD ref: `prd.md > Look and Feel`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Components` (Page shell and screen switching, Server calls), `spec.md > File Structure`, `spec.md > External Services and Dependencies` (Bundled fonts and icons), `spec.md > Decisions and Open Issues`
  Build:
  - `styles.css` rewritten around the spec's tokens, glass and page surfaces, and components, with the accessibility media queries.
  - `static/fonts/`: Fraunces and Inter, Latin and Vietnamese subsets. `static/licenses/`: the OFL and Lucide ISC texts. `font/woff2` registered in `refrain/__init__.py`.
  - In `index.html`: the sky layer, the top bar with the logo, and the new markup for the six screens. Icons as SVG files in `static/icons/`, drawn as CSS masks. A new `favicon.svg`.
  - View Transitions in `show()`; "What the coach is doing" in `api.js`; Home's grid of cards around the existing content.
  - `tests/js/contrast.test.mjs`, which reads the tokens from `styles.css` and checks every text/background pair from the spec.
  Verify (mechanical):
  - `pytest` passes, including the fonts' `font/woff2` type and no `style=` attribute in `index.html`.
  - `node --test "tests/js/*.test.mjs"` passes the contrast pairs.
  - Screenshots of all six screens at 100% and 200% zoom.
  - A keyboard-only walk works.
  - No request leaves the app's origin, and the first load is 350 KB or less.
  Learner check: Open Refrain and walk Welcome → Home → a demo session. Does it look professional and "lung linh" to you, and which screen still feels plain?
  Commit: `Redesign Refrain as Night study`

- [x] **8. Each time you come back, a star lights up**
  Becomes usable: The focus screen is the quiet night:
  - a glowing ring fills with the countdown;
  - each **Distracted** tap places an amber star on the ring at that moment;
  - while you type the note, your plan from the rule shows above the field ("Your plan: close the chat and write my next step");
  - after saving, "Noted. Back to {topic}." shows for two seconds.
  Why now: It is the first of the visible-help slices, because the session is where the app most needs to show that noticing and returning counts. Support works best at the moment it is needed (Nahum-Shani et al. 2018). Motion onset captures attention (Abrams & Christ 2003), so nothing moves on its own.
  PRD ref: `prd.md > Focus Session and Distraction Logging`, `prd.md > Screens and Layout` (Focus Session), `prd.md > Look and Feel`
  Spec ref: `spec.md > Components` (Focus screen and timer), `spec.md > Look and Feel` (Focus screen, Motion)
  Build:
  - The ring in `index.html`.
  - `focus.js` draws progress from the timer's tick and adds a star per tap.
  - `progress.js`: `starPoint` (where a tap sits on the ring) and `planFrom` (the then-part of the rule).
  - The "Noted" line, and the reduced-motion rules.
  - Node tests for `starPoint` and `planFrom`.
  Verify (mechanical):
  - `node --test "tests/js/*.test.mjs"` passes.
  - In the browser, a demo session shows:
    - the ring filling in step with the countdown, also after the tab sat in the background;
    - a star at each tap's position;
    - the plan cue when a rule exists, and none without one;
    - "Noted…" after saving.
  Learner check: Run a demo session and tap **Distracted** twice. Do the stars and your plan make a tap feel like a rep rather than a failure?
  Commit: `Light a star for each return on the focus ring`

- [x] **9. The debrief marks up your own words**
  Becomes usable: The debrief opens with the session's small ring and three numbers: minutes focused, returns, and the longest stretch. Below them:
  - *Your words* shows your explanation on the lamp-lit page, with a teal marker over what you got and an amber "What's missing:" line;
  - *Your session* is a line of focus stretches with a star and its note at each return, and the longest stretch glows;
  - *Your rule* highlights the words that came from your notes;
  - moving up a stage lights the next stage once.
  Why now: Feedback works better the more specific information it carries (Wisniewski, Zierer & Hattie 2020). Marking the user's own sentences is the most specific feedback there is, and it is the moment the video shows the AI at work.
  PRD ref: `prd.md > AI Debrief`, `prd.md > Screens and Layout` (Teach-back and Debrief)
  Spec ref: `spec.md > Components` (Teach-back and Debrief screen, Coach: debrief writer), `spec.md > External Services and Dependencies` (Refrain's own API), `spec.md > Data Model`
  Build:
  - Server:
    - `got_quotes` in the debrief schema, asked only when there is an explanation;
    - only quotes that appear in the explanation are kept (verbatim, ignoring case), with one retry through the existing soft-problem path;
    - `coach.gotQuotes` in the response, and quotes from the simulated coach.
  - Browser:
    - `progress.js`: `highlightRanges` and `stretches`;
    - the cards in `debrief.js`, built with `createElement` and `textContent`;
    - the ring gliding into the debrief header with a view transition.
  - Tests in `pytest` and Node.
  Verify (mechanical):
  - `pytest` and `node --test "tests/js/*.test.mjs"` pass.
  - Five scripted real-Gemini sessions with explanations: record how many have at least one verbatim quote, plus cost and latency compared with $0.0046 and 8.2 s.
  - In the browser, a demo session shows the marks, the timeline, and the highlights, and a skipped teach-back shows no *Your words* card.
  Learner check: Write a two-sentence explanation that leaves something out on purpose. Does the marked-up text show exactly what you got and what to add?
  Commit: `Mark up your explanation and draw the session in the debrief`

- [x] **10. Ideas you missed come back until you remember them**
  Becomes usable:
  - A warm-up question you missed, or got partly, comes back at your next warm-up, labelled "Back again — you missed this on Oct 3".
  - A question you got returns once more after three sessions.
  - Getting it a second time counts as an idea kept, shown with a star.
  Why now: The scope promises that warm-ups show you remember more. Today the warm-up drops each question after one try — the condition in which people recalled 33–36% a week later, against about 80% when items kept being tested (Karpicke & Roediger 2008).
  PRD ref: `prd.md > Warm-up Recall`, `prd.md > Deferred From the POC` (spaced review, now done by session count)
  Spec ref: `spec.md > Components` (Warm-up screen, Coach: warm-up checker), `spec.md > Data Model` (`reviews`), `spec.md > External Services and Dependencies` (Refrain's own API: `/api/check` with up to three items)
  Build:
  - `reviews` in `store.js`, merged over `emptyState()`.
  - `afterCheck` and `dueReviews` in `progress.js`.
  - The warm-up asks two new questions plus at most one review, and opens even when only a review is due.
  - The "Back again" label, the Kept star, and "ideas kept" on Home.
  - `Check.items` raised to a maximum of 3.
  - Tests.
  Verify (mechanical):
  - `pytest` passes: three items accepted, four refused.
  - `node --test "tests/js/*.test.mjs"` passes: the schedule, a failed check keeping its items, and old saved data.
  - In the browser:
    - a missed question returns at the next warm-up;
    - two gots make "1 idea kept";
    - a reload keeps it, and Reset clears it.
  Learner check: Miss one warm-up question on purpose, then run two more demo sessions. Does it come back, and does "kept" feel earned?
  Commit: `Bring missed warm-up ideas back until they're kept`

- [x] **11. Home shows your rule at work and your sky**
  Becomes usable: Home becomes a dashboard:
  - counters for sessions, minutes focused, returns, and ideas kept;
  - *Your rule*, with "Rule at work": how often the notes behind the rule came up in your last few sessions, oldest first;
  - *What pulls you away most*: your three most frequent notes;
  - *Your sky*: one row of stars per session.
  Why now: Monitoring progress helps people reach goals, more so when it is recorded (Harkin et al. 2016). Slices 8–10 now save what is needed to show it.
  PRD ref: `prd.md > Screens and Layout` (Home (Roadmap)), `prd.md > Possible Later Enhancements` (charts: only these in-app views now)
  Spec ref: `spec.md > Components` (Home screen, Progress helpers), `spec.md > Data Model` (`tapSecs`, `notes`)
  Build:
  - History rows save `tapSecs` and `notes`.
  - `totals`, `notesMatching`, `ruleAtWork`, and `topNotes` in `progress.js`.
  - The dashboard in `home.js`, with numbers that count up.
  - Old rows without tap times show only their count.
  - Tests.
  Verify (mechanical):
  - `node --test "tests/js/*.test.mjs"` passes for `ruleAtWork`, `topNotes`, and old data.
  - In the browser, after four demo sessions: the counters, rule at work, top notes, and sky rows are right; a reload keeps them, and Reset clears them.
  Learner check: After a few sessions, can you tell at a glance whether your rule is working and what pulls you away most?
  Commit: `Show your rule at work and your sky on Home`

- [x] **12. A first screen that shows the loop, and a polished public link**
  Becomes usable:
  - Welcome plays a short animation of the loop once: the ring draws itself, three stars light up, a marker sweeps a line, and a question comes back. The three steps sit on glass cards.
  - Every control has its hover, keyboard-focus, pressed, and disabled look.
  - The public link runs the new version.
  - The README has screenshots and credits.
  Why now: It goes last because it shows the pieces built in slices 7–11, and the demo path must be rewritten around them.
  PRD ref: `prd.md > Screens and Layout` (Welcome), `prd.md > Look and Feel`
  Spec ref: `spec.md > Components` (Welcome screen, Cloud Run service), `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It` (Demo recording path)
  Build:
  - The Welcome animation in SVG and CSS, played once, showing its last frame when reduced motion is on.
  - A state-by-state pass: empty, waiting, and error.
  - The spec's demo recording path rewritten around the new moments, under three minutes.
  - README screenshots and a Credits section.
  - Redeploy with the quoted environment list.
  Verify (mechanical):
  - `pytest` and `node --test "tests/js/*.test.mjs"` pass.
  - Screenshots of every screen.
  - On the public link: a four-session demo walk with real Gemini, the security headers, and a 429 on the 31st request.
  Learner check: Watch the Welcome animation and walk the new demo path on the public link. Is this what you want the judges to see first?
  Commit: `Add the Welcome loop animation and polish the public link`

## Hands-on Checkpoints

- [x] Final kick-the-tires exploration and feedback completed — run by the agent on the public link at the learner's request, in place of the learner's own try; it also takes the place of the early checkpoint planned after slice 2 (see Revisions)

## Final Review

- [x] Final review complete — the learner confirmed with "ready" on Oct 4, 2026, after reading the agent's report of the final walk (no changes requested); they did not try the app themselves (see Revisions)
- [x] The marks in *Your words* no longer open gaps in the sentence before they draw in (found in the final walk; deployed as `refrain-00009-kd7`; see Revisions)

## Code Tour and App Map

- [x] Learning activity complete — a brief recap with a reference route, presented in the chat on Oct 4, 2026; not hands-on (see Activity mode)
- [x] Optional edit and transfer reflection addressed — one safe edit and one reflection question were offered; neither has been taken up (see Edit outcome and Reflection)
- [x] `devpost/app-map.html` generated from the finished code (commit `15f1b27`), checked, and shown, including a project-grounded practice to reuse

Activity and evidence: One action followed through the finished code: pressing *Get feedback* on the teach-back screen, the server's check that every phrase the coach "found" is really in the user's text, and the marked words in *Your words*. It is built from the real files and tests, and the map lists them. The learner did not run or open anything for it.
Route and stops: Reference route, read from the code and not toured. (1) `static/js/screens/debrief.js` → `fetchDebrief()`. (2) `refrain/routes.py` → `debrief()`, `refrain/coach.py` → `write_debrief()`, `refrain/rules.py` → `verbatim_quotes()`. (3) `static/js/progress.js` → `markSegments()`, `static/js/screens/debrief.js` → `marked()`, `static/css/styles.css` → `.got-mark`.
Edit outcome: Offered, not taken up: change the title *Your words* in `wordsCard()` (`static/js/screens/debrief.js`), then reload and finish one demo session to see it. No test mentions the title. Nothing changed.
Reflection: Offered (one question about what to do differently when starting with an agent next time); no answer recorded here.
Activity mode: Recap with a reference route and the map; the live app and editor route was offered and can still be followed from `devpost/app-map.html`.

## Revisions

- Budget alert set to 260,000 VND a month (about $10) and counted before credits; `spec.md` and `spec.html` updated — "My Billing Account" bills in VND and carries a $200 credit, and a budget counts spend after credits by default, so the planned 10 USD alert could not be created as written and would never fire while the credit lasts.
- Slice 1 learner check answered by research — asked to try the roadmap, the learner replied "Tự dùng tavily khảo sát và quyết định" ("research it with Tavily yourself and decide"); Tavily (Edutopia focus reps 5–7 → 25–30 minutes; Freedom 10 → 25 minutes) supported starting near a third of the maximum, so the roadmap stayed as built.
- Early hands-on checkpoint after slice 2 folded into the final review, and build mode switched to fast — at that checkpoint the learner chose not to try the app ("từ đây về sau hãy dùng talivy khảo sát rồi tự làm đừng hỏi lại tôi" — "from here on, research with Tavily and then do it; don't ask me again"); the agent ran three real demo sessions instead (with notes, skipped teach-back, server down then Try again) and checked the rule wording against research.
- Debrief prompt now asks for a replacement action in the then-part — Tavily found that "if …, then not …" plans can strengthen the habit they target while replacement plans break it (Adriaanse et al. 2011); `spec.md > Coach: debrief writer` updated.
- `progress()` takes the stage list instead of the stage count — the next session's minutes come from the list; `spec.md > Fixed rules` updated.
- Debrief API tests live in `tests/test_api.py` as the file structure says; no new test file.
- Warm-up results are kept: **Start focusing** carries the got / partly / missed counts into the session, and its history row stores them as `recall` (`spec.md > Data Model`, `spec.md > Warm-up screen`), so a later slice can show recall on Home. Measured with real Gemini on Oct 3, 2026: the first check after the server starts took 12.4 s (10.4 s inside Gemini, 168 thinking tokens), later checks 3.0–3.5 s, about $0.0009 each.
- Audience narrowed to adults 18 and over — asked whether the project follows the judges' rules, the agent found that the hackathon requires following each third-party tool's terms, and Google Cloud's Service Specific Terms (Generative AI Services, "Age Restrictions", last modified Sep 30, 2026) don't allow its generative AI in a site directed to, or likely used by, people under 18. The survey and the server accept ages 18–120, Welcome says Refrain is for adults, and `scope.md`, `prd.md`, `spec.md` and their HTML pages are updated; the learner approved it in the plan they asked to be carried out. Slice 1's verification above records what was actually run then (a 16-year-old survey); the contrasting adult example is now a 20-year-old university student, and a real roadmap for that survey named their goal ("revise for your university exams").
- The debrief no longer sends "Where I stopped" and "My next step" to Gemini — a real pulled-away rule copied them ("… I stopped at Risk register, step 3 …"), and a rule must fit every later session while the **Pick up where you left off** card already shows the note; the prompt now asks for a ready-to-resume plan "that works for any future session". `spec.md > Coach` updated. After the fix, the same session gave "If a meeting pulls me away, then I'll write down where I stopped and my next step before stepping away."
- Cost and latency check (slice 4, Oct 3, 2026) — five scripted real sessions, each one debrief plus one warm-up check, sent to two local servers with the same prompts (completed with notes; pulled away by a "meeting" with a resume note; skipped teach-back; lost focus with a very short explanation; taps without notes):
  - `medium` (kept): $0.0046 per session ($0.0034 a debrief, $0.0012 a check), about a quarter of the ≈ $0.02 estimate; debrief median 8.2 s end to end (4.6–17.1 s inside Gemini, 300–940 thinking tokens); check 2.5–3.9 s; every code check passed (if-then rule, two questions, a specific *What's missing*, no rule copying the resume note).
  - `low`: $0.0015 per session; debrief median 4.4 s; every check passed too, with no thinking tokens.
  - Decision: keep `medium`, as the learner chose — the plan's rule was to switch the debrief to `low` only if the `medium` median passed 10 s. The occasional 14–17 s debrief is what the wait line in the next slice is for.
  - Two requests in the log that the script didn't send (a roadmap and a debrief from another browser on localhost) are left out of these numbers.
- New slice 5, "You can see what Refrain is doing for you", added before the deploy, which becomes slice 6 — the learner said "Tôi chưa thấy rõ app giúp ít cho người dùng như thế nào. và đã bám sát rule của ban giám khảo chưa" ("I don't clearly see how the app helps users, and does it follow the judges' rules?"). The agent's audit found that Home never showed what had changed for the user (warm-up results weren't even saved before slice 3), and that the judges score Design and Potential Impact "based on what's demonstrated". The learner approved the plan and asked for it to be carried out.
- Slice 6 deployed Oct 3, 2026 to https://refrain-476222056020.us-central1.run.app (revision `refrain-00004-rsr`). Three things changed on the way:
  - **Environment variables:** unquoted in PowerShell, the spec's `--set-env-vars a=1,b=2,c=3` reached `gcloud` as one variable, so the first two revisions had no `GOOGLE_CLOUD_PROJECT`. The empty warm-up checks used to probe the service don't call Gemini, so it only showed when the revision's settings were read back. Fixed with `gcloud run services update` and a quoted list; `spec.md` and `README.md` now quote it.
  - **Finding the real client address:** instead of logging `X-Forwarded-For` permanently (an IP address in the logs), a diagnostic line logs it only when `REFRAIN_LOG_FORWARDED=1`. With it on for one revision, a request carrying a forged `203.0.113.77` arrived as `203.0.113.77, <client>`, and `<client>` matched the address in Cloud Run's own request log, so the code keys on the last entry. The variable was removed right after. Tavily agreed: on Cloud Run only the last entry can be trusted.
  - **Build permissions:** no grant was needed — the build runs as the Compute Engine default service account, which already holds `roles/editor` in this project.
  - Verified on the public URL with real Gemini: the three security headers; the whole demo path (survey → roadmap; a demo session with "team chat" and "email ping" → a debrief with every card and a rule from those notes; the warm-up, 1 got it and 1 missed; **I was pulled away** with both fields → the stage held with "not a focus lapse", and Home showed the pick-up card, the totals, and both rows). After the walk's 4 AI requests, 26 empty checks were allowed and the next was refused with `429 {"error":"rate_limited"}`, even though each carried a different forged `X-Forwarded-For` entry.
- New slices 7–12 (the Night study design and visible help) were added after the deploy, following two messages from the learner:
  - "Tôi muốn ban giám khảo phải wow với app nhưng app hiện tại tôi thấy rất đơn điệu và chưa thấy giúp ít gì rõ rệt cho người dùng" ("I want the judges to be wowed by the app, but right now I find it very monotonous, and I don't see it clearly helping users").
  - "Khảo sát thêm về giao diện hiện tại giao diện quá đơn điệu tôi muốn 1 giao diện chuyên nghiệp và lung linh khiến người dùng thích thú và ban giám khảo phải wow" ("survey the current interface further — it's too monotonous; I want a professional, sparkling interface that delights users and wows the judges").
  - **The agent's survey of the deployed app:**
    - a flat paper background;
    - system fonts only;
    - no logo, icons, or images;
    - equal-weight cards in one 680 px column;
    - a 150 ms fade as the only motion;
    - and each session's help hidden in text, with nothing showing what happened in a session, whether the rule works, or whether recall improves over time.
  - **The decision:** the learner approved the plan and asked for it to be carried out.
  - **Doc changes:**
    - It replaces the approved calm-paper look with Night study. `prd.md > Look and Feel` and `spec.md > Look and Feel` were rewritten, with new tokens whose contrast was computed with the WCAG formula.
    - The Avoid list keeps its purpose but is narrowed: purple-to-pink gradients and four-point "AI" sparkle icons, instead of all sparkle.
    - Spaced review by session count moves forward from Deferred.
    - In-app progress views stand in for the Later charts.
    - `scope.md` records the revision.
    - The final review and the hands-on checkpoint above now come after slice 12.
- **Slice 7 built (Oct 4, 2026).** Six things differ from the plan, all now in `spec.md`:
  - **Icons:** SVG files in `static/icons/`, drawn as CSS masks, instead of an inline sprite. The scripts replace button text with `textContent`, which would wipe out an icon written inside the button.
  - **Aurora and borders:** the contrast test assumes the teal and blue glows can overlap at full strength. At the planned 16% that overlap pushed muted text to 4.07:1, teal to 4.14:1, the amber tint to 4.25:1, and text-box borders to 2.78:1. The aurora is now teal 12%, blue 9%, and amber 8%, and borders are 55% white. Worst cases now: ink 7.8:1, muted 4.7:1, teal 4.8:1, star 5.3:1, borders 3.7:1.
  - **Home order:** the start card comes right after the roadmap, before the pick-up and rule cards, so the main action follows the plan.
  - **Welcome headline:** "Train your focus and your memory, from your own words." The name moves to the top bar.
  - **Font fallbacks:** fallback sizes computed from the font files (fontTools, installed only in a temporary folder), so text doesn't jump when the fonts load. The Inter values match the ones Next.js publishes.
  - **Test command:** Node 24 needs `node --test "tests/js/*.test.mjs"`; a bare folder fails with "Cannot find module".
  - **Verified:**
    - `pytest`: 273 passed, 4 of them new (font type, no inline styles, every stylesheet file exists, licenses shipped).
    - `node --test`: 46 contrast checks passed.
    - Walked with the simulated coach at 100%, 70%, and 200% zoom: Welcome → Survey → Home → demo session with a note → teach-back → debrief → Home → warm-up (partly, missed) → **I was pulled away** → skipped teach-back → Home with the pick-up card and two history rows.
    - No horizontal overflow at 200% (only the stage path scrolls sideways, as designed).
    - Every request stays on the app's origin, and only the two Latin fonts load.
    - First visit: 234 KB uncompressed in 32 files.
    - The browser tool's synthetic Tab doesn't trigger `:focus-visible`, so the focus ring was checked where focus is moved by script (the warm-up's **Start focusing**) and on the text fields.
- **Slice 8 built (Oct 4, 2026).**
  - "Noted. Back to {topic}." shows whenever the note field closes, on Skip and Esc as well as Enter, because the tap counts as noticed with or without a note.
  - Verified:
    - `node --test`: 51 passed (46 contrast, 5 for `starPoint` and `planFrom`). `pytest`: 273 passed.
    - In a demo session, two taps made two stars at their moments on the ring.
    - With the rule "If something pulls me away, then I'll write where I stopped and my next step before I go.", the plan line read "Your plan: write where I stopped and my next step before I go".
    - Saving the note showed "Noted. Back to Project management course — managing risks.".
    - At 0:00 the ring was full (`stroke-dashoffset` 0), and Teach-back opened.
  - The background-tab case wasn't run separately: the ring is drawn by the same tick as the countdown, and that tick also runs when the tab becomes visible again (slice 2 already checked the countdown).
- **Slice 9 built (Oct 4, 2026).**
  - Four changes from the plan:
    - The missing idea reads "What's missing: …" rather than "Add: …", because the coach may say that nothing important is missing.
    - The rule card keeps the name *Your rule*, which says more than *Your North Star*.
    - The summary sits above the teach-back too, so the focus ring glides straight into it when the session ends.
    - *Your session* also shows when the coaching fails, since it needs no AI.
  - Verified:
    - `pytest`: 281 passed (8 new: `verbatim_quotes`, quotes kept and returned as written, invented ones retried once then dropped, the simulated coach quoting the explanation). `node --test`: 57 passed.
    - In the browser, a demo session with "team chat" at 0:07 and "email ping" at 0:19:
      - the summary read 1:00 focused, 2 returns, longest stretch 0:41;
      - *Your words* marked "A risk register lists" and "You score them to";
      - the rule marked "team chat";
      - the stage path lit the new 30-minute stage.
  - Real Gemini (five scripted debriefs with explanations, `medium`, on a local server):
    - All five came back with two or three quotes, and every quote was the user's own text: none needed a retry, and none was dropped.
    - Example from the Spanish case: "identity and origin", "states and locations", "estoy cansado".
    - Debrief median 7.1 s (4.8–9.2 s; the first took 24.4 s, including the server's start-up).
    - Cost: about $0.0043 per debrief, from the token counts at $0.75 / $3.75 per million (vs. $0.0034 in slice 4), so about $0.0055 per session with the warm-up check.
- **Slice 10 built (Oct 4, 2026).**
  - The plan's "Back again" line has three versions:
    - "you missed this on Oct 4" or "you partly had this", for the first box;
    - "you had this on Oct 4. Get it once more to keep it.", for the second box, so the second recall reads as a goal.
  - "Ideas kept" joins Home's totals line now; slice 11 gives it a counter.
  - Verified:
    - `pytest`: 282 passed (three check items accepted, four refused, and a mixed set of new and review questions checked together). `node --test`: 63 passed (the schedule, a kept idea never coming back, box 2 → box 1 on a miss, the saved list never changed in place, old saved data without `reviews`, the three labels).
    - In the browser with the simulated coach, after five finished sessions:
      - one got and one missed set the questions due at sessions 8 and 6;
      - after one more session (teach-back skipped, so no new questions), Home offered **Start with warm-up**, and the warm-up held only the missed question, labelled "Back again: you missed this on Oct 4.";
      - getting it moved it to box 2 (due at 9).
    - The due dates were then moved up in saved progress, to avoid three more demo minutes; the timing itself is covered by the Node tests. With that:
      - the box-2 question showed "…Get it once more to keep it." and, got again, **Idea kept**;
      - two new questions plus one review were checked in one three-item request;
      - Home's totals ended "· 2 ideas kept".
- **Slice 11 built (Oct 4, 2026).**
  - **Rule at work, redefined while building.** The plan was "how often the rule's notes came up since it started", against a `baseline` saved with the rule. A real run showed why that fails: the coach writes a fresh rule after almost every session with taps, so "since" is nearly always zero sessions and the line would never show anything. It now follows the rule's notes through the last five sessions saved with notes, oldest first ("“email ping” or “team chat” came up 2 → 2 times in your last 2 sessions.", **About the same**). That answers the same question — is this pull shrinking? — and needs no `baseline`, so none is saved.
  - The cards sit in two column containers instead of fixed grid rows, so a hidden card (no pick-up note yet) leaves no gap.
  - The old totals line keeps only warm-up recall ("Warm-ups: 5 of 14 answers recalled, 3 partly."), because the counters now show sessions, minutes, returns, and ideas kept.
  - Verified:
    - `node --test`: 68 passed (totals, `notesMatching`, `ruleAtWork` with old rows and rules without notes, `topNotes`). `pytest`: 282 passed.
    - In the browser, with ten earlier sessions plus two new demo sessions ("team chat" twice; then "email ping" and "team chat"):
      - the counters read 10 sessions, 7 minutes, 11 returns, 2 ideas kept;
      - the rule card showed the line above;
      - *What pulls you away most* listed team chat 3× and email ping 1×;
      - *Your sky* drew star lines for the two new rows and text only for the older ones.
    - The wide layout (1280 px) and 200% zoom showed no overflow; the counters wrap to 2 × 2.
    - A reload kept everything, and **Reset everything** left no saved progress and showed Welcome.
- **Slice 12 built and deployed (Oct 4, 2026).**
  - **Built:**
    - the Welcome loop (SVG and CSS, about 3.5 s, once; the last frame with reduced motion, whose rule now also drops animation delays);
    - a hover look for text boxes;
    - the spec's demo recording path rewritten in ten steps;
    - README screenshots from the public link with the real coach (`docs/screenshots/`, kept out of the deploy by `.gcloudignore`) and a Credits section.
  - **State pass:** an empty Home (counters, pulls, and the recall line hidden) and the waiting state ("What the coach is doing") were checked. For the error state, the local server was stopped mid-survey: the answers stayed, the message read "The coach couldn't respond. Your work is saved.", and **Try again** stayed.
  - **Deployed:** three revisions, each with the quoted environment list and checked afterwards (four variables, the three security headers, `font/woff2`, only the app's files uploaded). The walk on the public link found three bugs, fixed in `refrain-00007-fxt` and `refrain-00008-pb6`:
    - After **Reset everything** and a new survey, Home still showed the erased warm-up recall line: the counters returned early, before updating it.
    - The warm-up verdict lines and **Rule at work** printed the word "null": `replaceChildren` writes a `null` argument as text, unlike `el()`, which skips it.
    - A rule written from a brand-new distraction showed **More often** (0 → 0 → 1); it now shows **New**, since there is nothing earlier to compare with.
  - **Verified on the public link, real Gemini:**
    - Saved progress from the slice 6 walk, which predates `reviews` and tap times, loaded cleanly before **Reset everything**.
    - The survey showed "What the coach is doing" and gave a roadmap in 5.9 s, with a reason naming the goal and the 60 minutes.
    - In a demo session, two notes gave two stars and "Noted. Back to …".
    - The debrief (11.4 s) marked three phrases copied exactly from the explanation, named risk responses as missing, and wrote a rule with "team chat" highlighted.
    - The warm-up gave 1 got it and 1 missed. The plan line read "Your plan: write the person's name on a sticky note and reply during my break".
    - One session ran out before the script's **End early**, so it completed: correctly counted, up a stage.
    - The next warm-up brought the missed question back ("Back again: you missed this on Oct 4."), and it was got.
    - **I was pulled away** with "manager call" held the stage ("Holding at 20 minutes, because being pulled away is not a focus lapse.") and gave a ready-to-resume rule.
    - Home showed the counters, the pick-up card, **Rule at work** (**New**), three pulls, and the sky.
    - About 8 AI requests in all.
  - **Not repeated:** the 31-request rate-limit check. It would block this IP from the coach for an hour, and the learner shares it for their own try. The limiter is unchanged since slice 6 and still covered by `pytest`.
- **Final walk run by the agent at the learner's request (Oct 4, 2026).** Asked to try the app themselves, the learner first chose to ("Tôi tự thử" — "I'll try it myself"), then asked the agent to do it: "bạn tự thực hiện giúp tôi" ("do it for me"). The curriculum asks for the learner's own hands-on try, and the learner has not tried the app themselves; the hands-on checkpoint above is reworded to say who ran it. The walk used the IDE browser on the public link with the real coach, after **Reset everything** erased the slice 12 demo data.
  - **Checked and as planned:**
    - The survey refused age 16 ("Refrain is for adults. Enter your age as a whole number from 18 to 120."). 34, "Study for a certification after work", 60, 30 gave 10 → 15 → 20 → 25 → 30 minutes in 5.9 s, with a reason naming the goal.
    - Session 1 (demo length): "team chat" and "email ping" lit two stars, at 0:10 and 0:31. The debrief (6.9 s) marked three phrases copied from the explanation, named risk responses as missing, wrote a rule with "team chat" highlighted, and moved up to 15 minutes.
    - Session 2: the plan line read "Your plan: mute notifications and check it during my scheduled break" at the tap. A one-word teach-back ("risks") got an honest debrief ("You focused in on risks as the core of your study topic." and "What's missing: A fuller explanation would describe the steps to identify, evaluate, and respond to project risks.") and a rule from "manager call".
    - Session 3: the warm-up brought a missed question back ("Back again: you missed this on Oct 4."), and the coach marked 2 got it, 1 missed. **I was pulled away** after 49 s, with both fields, held the stage at 20 minutes ("because being pulled away is not a focus lapse") and gave a ready-to-resume rule.
    - Home then showed 3 sessions, 2 minutes, 3 returns, the pick-up card, the rule, three pulls, and the sky.
    - A reload on Home kept everything. A reload mid-session discarded only that session (still 3 sessions, nothing pending) and kept the warm-up answer already checked (box 2).
    - At about 446 px wide (320% zoom), only the stage path scrolls sideways, as designed.
    - Six AI calls, about $0.016: roadmap 5.9 s, debriefs 6.9, 8.1 and 4.0 s, checks 2.7 and 1.8 s. The only warning in the Cloud Run log was a 404 for a font URL the agent mistyped.
  - **Found and fixed:** in *Your words*, the marker's 2 px side padding opened gaps in the sentence ("can  rank", "first .") until each mark had drawn in, for about a second. A matching negative margin (`.got-mark`) keeps the text in place; the marks were checked with the simulated coach, frozen at the start of the animation and at its end. Deployed as `refrain-00009-kd7` with the quoted list of four variables; read back afterwards were the four variables, the three security headers, `font/woff2`, and the new line in the live stylesheet. `pytest` 282 and `node --test` 68 passed.
  - **By design, not changed:**
    - A session whose countdown reaches zero while the End-early panel is open counts as completed (`spec.md > The Core Journey Through the System`, step 7). The 41 seconds left after the tap ran out while the agent typed the note and opened the panel, so session 2 completed, and the pulled-away path was walked again in session 3.
    - Each warm-up brings back at most one earlier question, the longest-waiting first (`spec.md > Warm-up screen`).
    - "Minutes focused" counts whole minutes (`spec.md > Home screen`).
  - **Mistakes in the walk itself, not the app:** two browser steps were sent together. **Check** ran before an answer was typed, so session 2's warm-up was checked empty (2 missed, no AI call), and the typed text appeared later only because the browser tool writes into read-only boxes, which a person can't. A 30-second wait also ran before its click.
- **Final review confirmed (Oct 4, 2026).** After the agent's report of the walk, the fix, and the three behaviors kept by design, the learner replied "ready" and asked for no further changes. The one issue found was fixed and deployed before that reply (`refrain-00009-kd7`).
- **Learning wrap-up and app map (Oct 4, 2026).** `devpost/app-map.html` is a standalone page (no scripts, no CDN, no network requests) that follows one action, *Get feedback* to the marked words, through three stops with real excerpts. Checked before it was committed: the build stopped if any excerpt's first line had moved; all 58 code names and paths in it exist in the project; it was viewed at desktop width, in the dark palette, and at a 480 px phone width, where a long test name had made the page scroll sideways until it was allowed to wrap. The wrap-up was presented as a recap, not hands-on; the route stays in the map for anyone to follow.
- **History rewritten once before the first push (Oct 4, 2026).** At the learner's request the commit email was changed, a stray mention of an unrelated private project was removed from seven early commits, and an invisible byte-order mark was removed from one commit message. Every commit hash changed (the map now cites `15f1b27`); the code at the tip is identical, with the same tree hash before and after. A backup of the old history was kept outside the project folder.
- **Scope wording (Oct 4, 2026).** At the learner's request, the "(translated from Vietnamese)" notes were removed from the goal and the story in `scope.md` and `scope.html`.
