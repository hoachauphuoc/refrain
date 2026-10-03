---
doc: prd
status: approved
---

# Refrain — Product Requirements

Refrain is an AI coach that trains focus and memory in one study loop, for adults (18 and over) — university students and working adults — who want to retrain how they study.
Demo persona (learner decision): a working adult like the learner — a junior manager who studies after work and whose focus keeps getting cut by meetings, chat pings, and urgent tasks.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > Who It's For`, `scope.md > Why This Matters to the Learner`.

## The Core Journey
Develops `scope.md > The Core Loop` and `scope.md > What "Working" Looks Like`.

1. **Arrive.** A first-time visitor sees a short welcome: what the coach does, that progress stays in this browser, and that their answers and notes are sent to an AI service to write the coaching. They press **Start**.
2. **Survey.** They answer four questions: age, training goal, minutes available per day, and maximum minutes per session. They press **Build my roadmap**.
3. **Roadmap.** The coach shows a roadmap of 4–6 stages, from a starting session length up to their maximum, with how many sessions fit in their day and a one- or two-sentence reason for the starting point that refers to their own answers.
4. **Start a session.** On the home screen they type what they will study (for example "Project management course — managing risks") and press **Start session**. For the video, they can switch on **Demo length (1 minute)**.
5. **Warm-up** (only when questions are waiting from a previous session). They answer two questions from memory, press **Check**, and see which they got, partly got, or missed, each with a one-line answer. Then they press **Start focusing**.
6. **Focus.** The screen turns dark and quiet: a countdown, their current if-then rule, and one large **Distracted** button. Each time attention slips they tap it and may type a few words ("team chat", "email ping"), or skip the note. The timer keeps running.
7. **Session ends.** A soft chime plays when time is up. Or they press **End early** and say why:
   - **I was pulled away** (a meeting, a call, an urgent task) — they jot where they stopped and their next step, then leave. The roadmap holds.
   - **I lost focus** — the session ends and the roadmap eases back one stage.
   - **Keep going** — back to the countdown.
8. **Teach-back.** They explain the core idea of what they studied in two or three sentences and press **Get feedback**, or **Skip**.
9. **Debrief.** The coach shows: what the explanation got right, what is missing, two questions saved for the next warm-up, the pattern in their distraction notes, one if-then rule, and the roadmap change with its reason.
10. **Come back.** The home screen shows the updated stage, the new rule, the session history, and — if they were pulled away — a **Pick up where you left off** card with where they stopped and their next step. Their next session starts at step 5 with the saved questions.

Success: someone who has never seen the app completes steps 1–10 twice in a row; the second session opens with questions about exactly what they explained and a rule that quotes their own note; and after being pulled away, the next session shows where they stopped.

## Screens and Layout
Laptop-first web app in the browser; it must also be usable on a phone screen. One column, centered, no sidebars. Develops `scope.md > The POC Boundary`.

### Welcome
The name **Refrain**; a short promise that names the problem ("Meetings and pings break up your study time, and much of what you study fades by the next week. Refrain coaches both, from your own words."); a three-step "how it works" (focus and note what pulled you → teach back, get what's missing and one rule → recall next time); one line on the plan (it starts at a length you can finish, a meeting never counts against you, nothing resets to zero); the data notice, which ends "Refrain is for adults 18 and over."; and **Start**. Shown only when nothing is saved.

### Survey
One screen, four fields stacked in this order: age; training goal (a few example goals the user can tap to fill in — for example "Study for a certification after work", "Revise for exams", "Remember more of what I read" — or type their own); minutes available per day; maximum minutes per session. **Build my roadmap** at the bottom.

### Home (Roadmap)
The main screen after the survey, top to bottom:
1. The goal as a heading.
2. The roadmap as a horizontal row of stage cards (session length, sessions per day); the current stage is highlighted, finished stages are marked, later stages are dimmed.
3. The active if-then rule on its own card (or "Your first rule will come from your first session"), with where it came from: "From your notes: “team chat”, “email ping”." (or, for a rule written after being pulled away with no notes, "Written after a session you were pulled away from.").
4. **Pick up where you left off** card — only when the last session ended with "I was pulled away" and a note was written: where they stopped and their next step.
5. "What will you study?" field, the **Demo length (1 minute)** switch, and **Start session**. If questions are waiting, the button reads **Start with warm-up**.
6. Session history: one line of running totals — sessions, minutes focused, and warm-up answers recalled ("6 sessions · 4 minutes focused · 1 of 4 warm-up answers recalled") — then one row per session: date, length, outcome (completed / pulled away / ended early), distraction taps, the warm-up result when the session opened with one ("warm-up 1 of 2"), and the roadmap change (up / hold / ease back). Totals only ever grow; there is no streak.
7. A small **Reset everything** link at the bottom.

### Warm-up
The two saved questions, each with an answer field; **Check**; then each question shows got it / partly / missed and a one-line answer; **Start focusing**.

### Focus Session
Full-screen, dark, nearly empty: large countdown, the topic in small text, the next step from **Pick up where you left off** (when there is one) in small text, the active rule, one large **Distracted** button, a small tally ("2 noted"), and a small **End early** link. After a tap, a one-line note field appears under the button with "What pulled you away?"; Enter saves the note, and Esc or **Skip** closes it without one.

**End early** opens a small panel over the dark screen: "Ending early?" with **I was pulled away**, **I lost focus**, and **Keep going**. Choosing **I was pulled away** shows two short fields — "Where I stopped" and "My next step" — and **Save and end**.

### Teach-back and Debrief
One screen in two states. **Teach-back:** the topic, the prompt "In two or three sentences, what's the core idea?", a text box, **Get feedback** and **Skip**. **Debrief:** the coach's response as stacked cards — *What you got*, *What's missing*, *Next warm-up* (the two questions), *Your pattern*, *Your rule* (highlighted), *Your roadmap* (the change and why) — then **Back to roadmap**.

## Look and Feel
Agreed direction (the learner asked the agent to research it and approved the proposal). Develops `scope.md > Inspiration & Identity`.

- **Overall:** calm and warm, like a quiet study desk — clarity over cleverness, forgiveness over fear (UXmatters, "Designing Calm", 2025).
- **Colors:** warm off-white paper background; one deep teal accent for actions and progress; warm amber only for "aha" moments (the new rule, recall answers you got). No red or alarm colors anywhere — misses and ease-backs use neutral tones.
- **Typography:** a serif for headings for a bookish feel; a clean, highly legible sans-serif for body text and inputs; large numerals for the countdown.
- **Shapes and space:** rounded cards, soft shadows, generous whitespace, minimal motion.
- **Focus screen:** dark and nearly empty, low stimulation.
- **Coach voice:** short, kind, specific sentences that use the user's own words. "Ease back", never "failed". Being pulled away is never treated as a lapse. No emojis.
- **Avoid:** generic AI-app styling — purple gradients, sparkles, chat-bubble layouts, gamified badges, confetti.

## Features and Behavior

### Survey and Roadmap
Develops `scope.md > The Core Loop` step 1.

- As a busy learner who wants to focus longer, I want a plan that starts where I actually am so that my first sessions are wins.
  - [ ] On first visit the Welcome screen appears; after **Start**, the Survey shows the four questions in order.
  - [ ] **Build my roadmap** stays disabled until all four answers are filled in; age is a whole number from 18 to 120 (Refrain is for adults); minutes accept positive whole numbers only; maximum minutes per session is between 5 and 120 and cannot exceed minutes per day. Each invalid field says what it needs in plain words.
  - [ ] The roadmap has 4–6 stages; the first stage is shorter than the maximum, the last stage equals the maximum, and lengths never decrease from one stage to the next.
  - [ ] Each stage shows a session length and a number of sessions per day whose total stays within the daily minutes.
  - [ ] The reason mentions at least one of the user's own survey answers and contains no statistics or medical claims.
  - [ ] Two different surveys — for example a 20-year-old university student revising for exams and a 35-year-old studying for a certification after work — produce reasons that refer to their different goals.

### Warm-up Recall
Develops `scope.md > The Core Loop` step 2.

- As someone who forgets what I studied, I want to be asked about my last session before I start so that I practise remembering instead of re-reading.
  - [ ] When questions are saved, **Start with warm-up** opens the Warm-up before the timer; when none are saved (first session, or teach-back skipped), the Focus Session starts directly.
  - [ ] Each answer is marked got it / partly / missed, with a one-line answer.
  - [ ] An empty answer counts as missed and still shows the one-line answer.
  - [ ] After **Start focusing**, those two questions are cleared; the next teach-back creates new ones.

### Focus Session and Distraction Logging
Develops `scope.md > The Core Loop` step 3 and `scope.md > The Unique Kernel`.

- As someone whose attention keeps slipping to chat and email, I want one tap to admit a distraction and get back to work so that I notice my pattern without breaking the session.
  - [ ] The countdown starts at the current stage's length, or at 1:00 with **Demo length** on.
  - [ ] The active rule is visible during the whole session (or nothing, before the first rule exists).
  - [ ] Each **Distracted** tap adds one to the tally immediately and records the time into the session, even if no note is typed.
  - [ ] An optional note of a few words can be saved; saving or skipping it never pauses the countdown.
  - [ ] At zero, a soft chime plays and Teach-back appears.

### Ending Early and Pulled Away
Develops `scope.md > The Core Loop` steps 3 and 6, and `scope.md > Why This Matters to the Learner`.

- As a manager who gets pulled into meetings and urgent tasks, I want to leave a session without being marked down, and find my place again later, so that interruptions I don't control don't erase my progress or my train of thought.
  - [ ] **End early** opens the "Ending early?" panel with **I was pulled away**, **I lost focus**, and **Keep going**; the countdown keeps running while the panel is open.
  - [ ] **Keep going** closes the panel and the session continues.
  - [ ] **I was pulled away** shows "Where I stopped" and "My next step"; both are optional; **Save and end** records the minutes completed and opens Teach-back.
  - [ ] **I lost focus** records the minutes completed and opens Teach-back.
  - [ ] When at least one of the two fields was written, Home shows **Pick up where you left off** with them, and the next Focus Session shows the next step under the topic.
  - [ ] The **Pick up where you left off** card clears when the next session ends, whatever its outcome.

### Teach-back
Develops `scope.md > The Core Loop` step 4.

- As a learner, I want to put the core idea in my own words so that I practise picking out what matters.
  - [ ] The prompt shows the topic the user typed before the session.
  - [ ] **Get feedback** is disabled while the box is empty; **Skip** goes straight to the debrief without the explanation parts.
  - [ ] The coach never writes a summary of the material in place of the user's explanation.

### AI Debrief
Develops `scope.md > The Core Loop` step 5 and `scope.md > What "Working" Looks Like`.

- As a learner, I want feedback built from my own explanation and my own distraction notes so that the advice is about me, not generic tips.
  - [ ] *What you got* names at least one point from the user's explanation.
  - [ ] *What's missing* names at least one specific idea from the topic that the explanation left out, or says plainly that nothing important is missing.
  - [ ] *Next warm-up* shows exactly two questions that can be answered from the studied topic without the material in front of you.
  - [ ] *Your pattern* quotes at least one of the user's own notes when notes exist.
  - [ ] *Your rule* is one sentence in the form "If …, then I'll …" and refers to something the user noted.
  - [ ] When the notes or the end reason point to an outside interruption (a meeting, a call, a manager, an urgent task), *Your rule* is a ready-to-resume plan — for example "If a meeting pulls me away, then I'll write where I stopped and my next step before I go."
  - [ ] After **I was pulled away**, the debrief says plainly that being pulled away is not a focus lapse.
  - [ ] *Your roadmap* states the change (up / hold / ease back), the next session length, and the reason in one sentence.
  - [ ] Skipped teach-back: the debrief shows only *Your pattern*, *Your rule*, and *Your roadmap*.

### Roadmap Progression
Develops `scope.md > The Core Loop` step 6 and `scope.md > Explicitly Cut` (streaks that reset).

- As someone who has bad days, I want the plan to shrink instead of resetting so that one bad session never wipes out my progress.
  - [ ] Each stage allows one distraction tap per 5 minutes of session length, and at least 2 (a 25-minute session allows 5; the 1-minute demo allows 2).
  - [ ] Completed within the allowed taps → move up one stage (or stay on the last stage).
  - [ ] Completed with more taps than allowed → hold the current stage.
  - [ ] Ended early with **I was pulled away** → hold the current stage.
  - [ ] Ended early with **I lost focus** → ease back one stage, never below the first stage.
  - [ ] Taps never ease the roadmap back, and the coach describes each tap as noticing and returning — a rep, not a failure.
  - [ ] The history row for the session shows the outcome and the change, and the home screen highlights the new current stage.
  - [ ] Nothing in the app ever shows a streak or resets progress to zero.

### Progress on This Device
Develops `scope.md > The POC Boundary`.

- [ ] Closing and reopening the browser keeps the survey answers, roadmap, current stage, active rule, saved questions, the **Pick up where you left off** note, and session history.
- [ ] **Reset everything** asks for confirmation, clears all of it, and shows the Welcome screen.

## States and Boundaries
- **First use** — nothing saved: Welcome → Survey. Home shows "Your first session is ready" and an empty history.
- **Returning** — Home with the current stage, active rule, and history; warm-up waiting if questions are saved; **Pick up where you left off** if the last session was interrupted with a note.
- **No distractions tapped** — the debrief says no distractions were noted; no new rule is invented; the previous rule (if any) stays active.
- **Taps without notes** — the debrief says it can't see what pulled them away and asks for a word or two next time; the rule is general but honest, not a guess dressed up as a pattern.
- **Pulled away with both fields blank** — the roadmap still holds; no **Pick up where you left off** card appears.
- **Very short or off-topic explanation** — the coach responds kindly, says what a fuller explanation would include, and still writes two questions about the topic.
- **Waiting for the coach** — while the AI works, the screen says what it is doing and how long it usually takes ("The coach is reading your session. This usually takes 5 to 20 seconds."), so a long wait doesn't look like a frozen app. Added in `5-build`.
- **AI request fails** — a calm message ("The coach couldn't respond. Your work is saved.") with **Try again**; the user's typed text and the session record are kept.
- **Page closed during a session** — that session is not saved and the roadmap is unchanged.
- **Data boundary** — progress lives only in this browser on this device; a different browser or cleared browser data starts fresh. Survey answers, topic, notes, and explanations are sent to the AI service only to produce the coaching. The app uses a paid Google Cloud AI service (Gemini on Vertex AI), under which Google does not use this content to train its models (learner decision: paid, not free); the Welcome notice says so in one plain sentence.

## Product Decisions
Learner decisions:
- Project name: **Refrain** — "to refrain" from a distraction, and "a refrain" you repeat until you know it by heart. Chosen from a shortlist the agent researched and collision-checked at the learner's request.
- English interface — matches the English demo video and judges.
- Audience is adults who want to retrain focus — university students and working adults; the survey adapts the plan to each. (Originally also school students; narrowed to 18 and over during `5-build`, because Google Cloud's generative AI terms don't allow a site directed to, or likely used by, people under 18 — see `scope.md > How This Scope Was Shaped`.)
- Demo persona is a working adult like the learner — a junior manager whose focus is cut by meetings and urgent tasks — instead of a student.
- The four survey questions: age, training goal, minutes per day, maximum minutes per session.
- Memory training is a core goal alongside focus, to go deeper than Focusito.
- Paid AI service (Gemini on Google Cloud), so users' study text and notes are not used to train Google's models.

Agent proposals the learner approved after asking the agent to research them:
- Daily loop and kernel: distraction notes → if-then rule; no streak resets (scope approval, "look goods").
- Teach-back and next-session recall in the PoC; memory drills (faces, numbers, memory palace) later; speed reading cut (approved "ok").
- **End early** separates **I was pulled away** (hold, plus a ready-to-resume note — Leroy & Glomb 2018) from **I lost focus** (ease back) — approved with the working-adult persona.
- Progression thresholds: up when completed within one tap per 5 minutes (at least 2); more → hold. Students' minds wander on roughly a third to half of thought probes during lectures (Wammes et al. 2016; review: https://pmc.ncbi.nlm.nih.gov/articles/PMC3730052), and no study sets a standard threshold, so the allowance is generous and scales with session length — otherwise users could learn to stop tapping to move up, which would undermine the self-monitoring the kernel depends on.
- Laptop-first web app that also works on a phone — the phone is the main distraction, so the app shouldn't require holding one.
- Calm visual direction in **Look and Feel**.

Assumptions the learner approved with this PRD ("looks good"):
- A "What will you study?" field before each session, so the coach can check the explanation and write fair questions.
- The survey is one screen; the goal field offers tap-to-fill examples.
- Maximum minutes per session limited to 5–120, so a roadmap with a shorter first stage always exists.
- A soft chime at the end of a session.
- A page closed mid-session is discarded.
- The data notice on the Welcome screen.

## What We're Building
- Welcome with data notice; four-question survey; AI-generated roadmap with reason.
- Home with roadmap stages, active rule, **Pick up where you left off** card, topic field, demo-length switch, start button, and session history.
- Warm-up with two recall questions and AI checking.
- Dark focus session with countdown, active rule, one-tap distraction logging with optional note, end chime.
- End early with **I was pulled away** (where I stopped + next step) or **I lost focus**.
- Teach-back with skip.
- AI debrief: what you got, what's missing, two questions, pattern, if-then rule (a ready-to-resume plan after outside interruptions), roadmap change.
- Roadmap progression rules with no resets.
- Progress saved in this browser; reset everything.
- Friendly AI-failure state with retry.

## Deferred From the POC
- **Accounts and sync** — progress on one device is enough to prove the loop; accounts add sign-in, storage, and privacy work.
- **Memory drills** (names and faces, phone numbers, memory palace) — a second training mode with its own loop; it would dilute the two-minute demo.
- **Prioritizing work tasks** — part of the learner's story, but a separate problem with its own loop (see AI sorting of parked thoughts below).
- **Spaced review beyond the next session** — the PoC proves recall at the next session; scheduling older questions needs a review calendar.
- **Requiring several good sessions before moving up a stage** — slower progression is more realistic but would hide the roadmap change in the demo.
- **Tuning the tap allowance from real usage** — needs data from many sessions.
- **Keeping a phone's screen awake during a session** — the laptop is the primary device for the PoC.
- **Vietnamese and other languages** — English first for the hackathon.

## Possible Later Enhancements
- A weekly check-in comparing measured focus span with the survey estimate.
- Charts of focus span and recall across the 66-day journey.
- Gentle reminders at the user's chosen study time.
- AI sorting of parked thoughts and interrupting tasks into do now / later / drop.
- Study tips looked up for the user's goal, for example with Tavily web search.

## Non-Goals
- **Speed reading** — evidence shows a speed–comprehension trade-off (`scope.md > Explicitly Cut`).
- **AI summaries of the material** — the user explains; the coach checks.
- **Website or app blocking, automatic distraction detection** — out of scope by design.
- **Calendar or chat integrations** (detecting meetings or pings automatically) — the user says when they were pulled away.
- **Streaks, badges, leaderboards, or social features** — the coach is kind and private, not competitive.
- **Medical, ADHD, or "brain improvement" claims** — this is a study-habit coach.
- **Uploading notes or PDFs** — the user brings their own material; the app trains how they use it.

## Open Questions
- None blocking `4-spec`.
