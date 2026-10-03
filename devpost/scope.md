---
doc: scope
status: approved
---

# Refrain

Refrain is an AI coach for focus and memory: a short survey builds your training roadmap; during each study session your own distractions become personal rules, and after it you teach back the core idea so the coach can quiz you from memory next time.

## The Unique Kernel
One loop trains both focus and memory, and it runs on your own words.
- **During a session**, you tap once each time you're pulled away and jot what pulled you. The AI coach turns those notes into one personal if-then rule ("If I want to open Messenger, then I'll park the thought and check it at the break").
- **After the session**, you explain the core idea you just studied in two or three sentences. The coach points out what's missing and writes two questions; the next session opens by asking you to answer them from memory.
- **The roadmap** resizes the next session to what you actually managed. No streak ever resets to zero.

The AI never summarizes the material for you: you do the remembering and the filtering, and the coach checks and guides.

## Who It's For
The learner's audience is everyone who wants to retrain how they focus and how much they remember of what they study — school students, university students, and working adults — and the survey adapts the plan to each.
For the proof of concept, picture one person — a working adult like the learner: a junior manager who studies after work (for example a project management course), gets pulled into meetings and urgent tasks, drifts to Slack and email in between, and forgets much of what they studied by the next week. (The demo's survey answers are illustrative, not the learner's.)
Today they block time on the calendar, set a Pomodoro timer, or install a blocker such as Forest, Opal, or Freedom, then re-read their notes. Blockers never learn why this person got distracted, streak apps turn one missed day into a reason to quit, a meeting that cuts a session short counts as a failure, and re-reading is one of the least effective ways to remember (Dunlosky et al. 2013).

## The Core Loop
1. **First visit:** a four-question survey — age, training goal, time available per day, maximum minutes per session. The AI builds a roadmap of stages, from a starting session length the user can reach up to that maximum, and says why it starts there.
2. **Warm-up (from the second session):** answer the coach's two questions from last time, from memory; the coach checks them.
3. **Focus session:** start the timer for the current stage, with the active rule on screen. Each time attention slips, tap "Distracted" and optionally type a few words, then keep going. If a meeting or urgent task pulls them away, they end early with a one-line note of where they stopped and what's next.
4. **Teach-back:** when the session ends, explain the core idea in two or three sentences.
5. **AI debrief:** what the explanation got right and what's missing, two questions for next time, the pattern in the distraction notes, and one if-then rule.
6. **Roadmap update:** up a stage, hold, or ease back — never back to zero. Being pulled away holds the stage; it is not a lapse.

Why they come back: the plan becomes more personal after every session, the warm-up shows them remembering more, session length grows from a level they can actually reach, and a bad day shrinks the next step instead of erasing progress.

## Inspiration & Identity
- Couch to 5K — a beginner program that starts small and builds up step by step; the roadmap should feel like that for focus. https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k
- Tone: a kind coach, never guilt. Contrast: Forest users describe guilt when the virtual tree dies and stress over broken streaks. https://unstar.app/blog/opal-forest-freedom-one-sec-jomo-screen-time-apps-ranked-2026
- Calm design: clarity over cleverness, forgiveness over fear. https://www.uxmatters.com/mt/archives/2025/05/designing-calm-ux-principles-for-reducing-users-anxiety.php
- Visual direction is captured in `prd.md > Look and Feel`.

## Why This Matters to the Learner
The learner's goal, in their words (translated from Vietnamese): to help users "besides increasing focus, also train memory" — for example reading a book in a short time, remembering faces and phone numbers, or the brain automatically thinking to filter out the core knowledge to apply.

Their personal story (translated from Vietnamese): "I am a junior manager at a company. I often lose focus because I have to juggle many things at once; my thinking gets interrupted by meetings and by urgent priority tasks; and I lack prioritization in my work, so my effectiveness at work and in studying goes down."

Research that matches the story, for the pitch:
- Employees are interrupted every two minutes during core work hours — 275 times a day — by meetings, emails, or chat pings (Microsoft Work Trend Index 2025). https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday
- 68% of employees say they don't have enough uninterrupted focus time during the workday (Microsoft Work Trend Index 2023). https://news.microsoft.com/annual-wti-2023
- Interrupted work resumed the same day took on average 23 minutes 15 seconds to get back to (Gloria Mark, Gallup interview). https://news.gallup.com/businessjournal/23146/too-many-interruptions-work.aspx
- A one-minute "ready-to-resume" plan — where you stopped and what comes next — reduced attention residue and protected performance on the interrupting task (Leroy & Glomb 2018). https://www.washington.edu/news/2018/01/16/task-interrupted-a-plan-for-returning-helps-you-move-on

## What "Working" Looks Like
In about two minutes on screen: answer the four survey questions → see a personal roadmap with a starting session length and the reason → run a demo-length session, tapping "Distracted" twice with notes like "Slack" and "email ping" → explain the core idea in two sentences → the debrief shows a gap in the explanation, two questions for next time, a personal if-then rule, and the roadmap moving → the next session opens with those two questions to answer from memory, and the rule on screen → a meeting cuts that session short: "I was pulled away", a one-line note of where they stopped, and the roadmap holds instead of easing back.

The "oh, that's cool" beats: two-word notes come back as a rule written for this person, the next session asks them to recall exactly what they explained, and a meeting that cuts a session short doesn't count against them.

## The POC Boundary
- Four-question survey and an AI-generated starting roadmap.
- Warm-up: recall of the previous session's two questions, checked by the AI.
- Session timer with one-tap distraction logging and an optional short note.
- End early that tells "pulled away" (the roadmap holds, and a where-I-stopped note is kept for next time) from "lost focus".
- Teach-back after each session.
- AI debrief: feedback on the explanation, two recall questions, the distraction pattern, and one if-then rule.
- Roadmap view showing the current stage, the active rule, and how past sessions changed it.
- Progress kept between visits on the same device, without accounts.
- A demo-length session option so the whole loop fits in the video.

## Later
- Memory drills: names and faces (face-name mnemonic), phone numbers (chunking, the major system), and the memory palace (method of loci).
- Spaced review that brings back older questions on a schedule, beyond the next session.
- A weekly check-in comparing measured focus span with the survey estimate.
- Charts of focus span across the 66-day journey.
- Reminders and notifications.
- Accounts and sync across devices.
- AI sorting of "parked" thoughts into do now / later / drop.
- Study tips looked up for the user's specific goal (for example with Tavily web search).

## Explicitly Cut
- **Speed reading** ("read a book in a short time") — reading speed trades off against comprehension, and doubling or tripling speed without losing understanding is unlikely (Rayner et al. 2016); one-word-at-a-time speed-reading apps impair comprehension. The evidence-based version of the goal stays: lose less reading time to distraction and remember more of what you read.
- **AI summaries of the material** — reading a summary is re-study, and retrieval practice beats re-study (Roediger & Karpicke 2006). The user explains; the coach checks.
- **Streaks that reset to zero** — one missed day does not materially affect habit formation (Lally et al.), and streak guilt is a known complaint about apps such as Forest. The coach eases the next step instead.
- **Automatic distraction detection** (screen or app monitoring) — needs device-level permissions; tapping it yourself proves the kernel and is itself the awareness practice.
- **Website and app blocking** — plenty of blockers exist; this project trains focus rather than building walls.
- **Brain-training games** — training happens during the user's real study or work.
- **Medical or ADHD claims** — this is a study-habit coach, not a clinical tool.

## Research Map
Gathered with Tavily on Oct 3, 2026, and checked against the source pages. Blog-only statistics without traceable citations were left out.

Focus and habits
- Habit formation: median 66 days to automaticity (range 18–254); missing one opportunity "did not materially affect the habit formation process." Lally et al. 2010 — https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674 ; 2024 systematic review — https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623
- If-then plans (implementation intentions): medium-to-large effect on goal attainment, d = 0.65 across 94 tests. Gollwitzer & Sheeran 2006 — summary: https://goalsandprogress.com/implementation-intentions-gollwitzer-how-to
- Average attention on one screen ≈ 47 seconds (Gloria Mark). https://www.steelcase.com/research/articles/our-47-second-attention-span-with-gloria-mark-s5-ep3-transcript
- Gradually lengthened "focus reps", 5–7 → 25–30 minutes (Edutopia) — https://www.edutopia.org/video/how-to-build-a-better-attention-span ; evidence for attention training is still mixed (Harvard Health) — https://www.health.harvard.edu/mind-and-mood/tips-to-improve-concentration
- Fixed breaks gave better mood than self-regulated breaks with the same task completion (Maastricht University) — https://cris.maastrichtuniversity.nl/en/publications/understanding-effort-regulation-comparing-pomodoro-breaks-and-sel ; a 2025 study found no overall difference — https://pmc.ncbi.nlm.nih.gov/articles/PMC12292963
- A self-monitoring log was part of an RCT that reduced smartphone distraction among UK students ("Mind over Matter", 2020) — https://www.mdpi.com/1660-4601/17/13/4842

Memory and learning
- Practice testing and distributed practice rated "high utility"; summarization, highlighting, rereading, and keyword mnemonics rated "low utility"; self-explanation "moderate" (Dunlosky et al. 2013) — https://journals.sagepub.com/doi/abs/10.1177/1529100612453266
- Testing effect: after one week, 61% of a passage recalled with repeated testing vs 40% with repeated study (Roediger & Karpicke 2006) — http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf
- Speed reading: speed–comprehension trade-off (Rayner et al. 2016) — https://journals.sagepub.com/doi/10.1177/1529100615623267 ; one-word-at-a-time (RSVP) apps do not foster comprehension — https://pubmed.ncbi.nlm.nih.gov/29461715 ; https://today.ucsd.edu/story/dont_believe_what_you_read_only_once_speed_reading_apps_may_impair_reading
- For the Later memory drills: six weeks of method-of-loci training substantially improved word-list recall in mnemonic-naive people, still present months later (Dresler et al. 2017) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7929507 ; face-name mnemonic (Yesavage 1984) — https://pubmed.ncbi.nlm.nih.gov/6734688 ; the major system for numbers (evidence mostly from practitioners) — https://en.wikipedia.org/wiki/Mnemonic_major_system

Problem size
- 73% of UK students aged 18–22 spend 4+ hours a day on their phone, and over 3 in 4 believe it hurts their academic performance — https://www.insidehighered.com/news/student-success/health-wellness/2025/12/18/how-excessive-phone-use-can-hinder-student-success ; OECD 2024, distraction from devices in maths lessons — https://www.oecd.org/content/dam/oecd/en/publications/reports/2024/05/students-digital-devices-and-success_621829ff/9e4c0624-en.pdf
- Pitfall for the pitch: the "mere presence of your smartphone drains your brain" finding (Ward et al. 2017) failed replication (https://forrt.org/flora-replication-atlas/doi/10.1086/691462), and a meta-analysis found limited support — avoid citing it.

Closest existing products
- Focusito (distraction tap + AI pattern coaching) — https://play.google.com/store/apps/details?id=com.mghg.focusito
- Thawly (AI if-then chains for starting tasks) — https://thawly.ai/blog/implementation-intentions-adhd
- FocusFlow (focus timer + a 5-question AI quiz from your PDF or notes after a session) — https://achievewithfocus.com/features ; WorkspaceLM (AI quizzes from uploaded content) — https://apps.apple.com/us/app/workspacelm-ai-study-quiz/id6755428160
- AI habit coaches such as Sortyd and MyOrbit — https://discyhabit.com/blog/best-habit-tracker-apps-with-ai-coaching ; an indie "train your focus like a muscle" app — https://www.reddit.com/r/ProductivityApps/comments/1qcum3p/made_an_app_that_trains_your_focus_like_a_muscle

## How This Scope Was Shaped
- **Original (approved Oct 3, 2026):** the learner set the theme, the audience, and the survey → AI roadmap flow with its four survey questions. At the learner's request, the agent researched existing apps and evidence with Tavily and proposed the daily loop and kernel for the learner's review.
- **Revision (approved Oct 3, 2026, during `3-prd`):** the learner added memory training as a core goal and asked for the plan to go deeper than Focusito. The agent researched each of the learner's examples; the learner approved ("ok") keeping teach-back and next-session recall in the PoC, moving memory drills to Later, and cutting speed reading.
- **Decisions made during `3-prd` (Oct 3, 2026):** the learner shared their story as a junior manager, chose a working-adult demo persona like themselves instead of a student, approved an End-early choice that separates being pulled away from losing focus, and chose the name **Refrain** from a shortlist the agent researched and collision-checked at the learner's request.
