# /interview - Build a prep pack for one interview round

You are preparing the user for a real, scheduled interview. The output is one
self-contained, interactive HTML page per round, saved in the company folder
next to the CV that earned the interview.

`$ARGUMENTS` may name a company, optionally with a round.

```
[0] locate   company folder + which round + invitation details
[1] read     existing folder intel — no new research yet
[2] research → Interview-Intel.md    reported questions, process, panel, news
[3] build    question bank + model answers, drafted against doctrine
[4] render  → Interview-Prep-<Stage>.html   from assets/prep-template.html
[5] verify   in the browser: tabs, cards, dark mode actually work
[6] diary    the round + a prep block, via ical; event ids recorded
[7] report   top questions to practise, weak spots
```

Everything lands in `~/Documents/Jobs/<Company>/`.

`/apply` optimises what the company reads. `/interview` optimises what they
hear. The bridge is consistency: the interviewer has read the submitted CV, so
everything prepared here must match what that document claims.

---

## Doctrine

Continuous with `/apply`'s — the interview defends the document that got it.

### 1. The prep continues the CV's argument

The tailored CV sold **one capability**. The interview deepens that same
argument; it does not reopen the generalist portfolio. Read the CV's
`// VARIANT:` banner and the `CV-JD-AUDIT.md` verdict to recover what the
argument was, and make every model answer pull toward it. An answer that drifts
into unrelated strengths dilutes the candidacy the CV constructed.

### 2. Facts are frozen, and so is anything already submitted

The numbers in `~/Documents/Jobs/CV/FROZEN-FACTS.md` are fixed, with their
mandatory qualifiers attached. So is anything already committed on paper:
compensation forms, application answers, stated availability and notice.

**A verbal answer that contradicts a submitted form is worse than a weak
answer.** Salary, visa, notice and availability get scripted word-for-word from
`STAR-BANK.md`'s locked-answers table and the folder's existing documents, and
are marked LOCKED in the pack. If no prior commitment exists, draft one and flag
it as new for the user to confirm before it is spoken.

### 3. Coach honest framing, never invented experience

`CV-JD-AUDIT.md` carries an "Integrity risks — do not claim" table. Those rows
become the pack's **Danger zone**: for each risk, the question that would expose
it and the honest defensive answer. The five-minute test applies to spoken
answers exactly as it does to bullets.

### 4. Reported is not inferred

A question a real candidate reported is evidence. A question predicted from the
JD is a guess. Both belong in the pack, labelled differently: reported questions
carry source and date on the card, predicted ones are marked as predicted. If a
research track comes back empty, say so in the report. **A padded question bank
reads as coverage the user does not actually have.**

---

## Stage 0 — Locate inputs

Establish four things: the **company folder**, the **round**, **when and how**
(date, time, video or in person, duration), and the **interviewer names** if
known.

Most of this is usually already in the folder: invitation screenshots, forwarded
emails, prior prep files. Read those before asking. Ask only for what is
genuinely absent, and state what you assumed.

If `~/Documents/Jobs/job_search_tracker.csv` has a row for this application,
read it: it records the stage reached and any feedback from earlier rounds.
**Feedback from round N is the highest-value input for round N+1.** If the
application is not tracked, suggest `/outcome <company>` afterwards, and carry
on.

Derive the stage slug for filenames: `HR-Screen`, `Technical`, `Case-Study`,
`Final`, `Assessment-Centre`.

## Stage 1 — Read the folder intel

These were produced by `/apply`. Read what exists; none are guaranteed.

| File | What to take from it |
|---|---|
| `<Role>-<Company>.md` | Responsibilities and essentials become predicted technical questions; the employer's vocabulary for answers |
| `Research-<Role>.md` | Entity, desk, methodology hooks, strategy facts → intel digest and "questions to ask them" |
| `*People-LinkedIn.md` | Hiring team map, incumbents' self-descriptions, likely panel |
| `CV-JD-AUDIT.md` | Integrity risks → Danger zone; PARTIAL and GAP verdicts → the follow-ups to expect |
| `qiankun-resume.typ` | The variant banner (the argument) and every bullet — **each bullet is a question** |
| Prior prep packs | Locked answers verbatim; the process map so far |
| `~/Documents/Jobs/CV/STAR-BANK.md` | Existing stories, growth areas, locked answers, past debriefs |
| Comp form, application answers | Anything already committed on paper |

**Do not re-research what these already answer.** The fresh research stage
exists for what the folder cannot know: what interviews at this company are
actually like.

## Stage 2 — Fresh research

Full per-source instructions are in
`.claude/skills/job-application-assistant/references/research-guide.md`. Read it
before starting.

**Browser tracks are serial; headless tracks are parallel.** Glassdoor, Blind
and LinkedIn need the user's real logged-in Chrome, and there is exactly one of
it. Launch the headless-safe tracks (Reddit via WebSearch/WebFetch, Indeed via
MCP, news) as parallel subagents **first**, then drive the browser work yourself
while they run.

**Check the session before scraping each gated track.** Confirm the page shows a
signed-in state (profile avatar, account menu). If it does not, tell the user so
they can sign in, and move to the next track meanwhile. Never push through a
logged-out or captcha'd page: a gated site fetched without a session produces a
confident-looking empty result, which is worse than a stated gap.

**Markdown is the source of truth.** Every finding persists to
`Interview-Intel.md` before anything is built — one dated section per round,
**appended, never overwritten**, so round 2 reuses round 1's scraping. The HTML
pack is rendered *from* the markdown, never from memory: if a finding is not in
the markdown, it does not go in the pack. Every reported question carries
source, role and date.

## Stage 3 — Question bank and model answers

Assemble from five streams, in descending order of evidence:

1. **Reported** — questions real candidates reported for this company and role. Source and date on every card.
2. **Interviewer-derived** — what this specific panel cares about, from their profiles and posts. An interviewer's own description of their work *is* the question list.
3. **JD-derived technical** — every essential is a potential question; every named system is a "walk me through how you have used…" question.
4. **CV defence** — every bullet on the tailored CV, plus every PARTIAL, GAP and RISK from the audit. **This is where interviews are lost.**
5. **Locked logistics** — salary, visa, availability, notice. Scripted verbatim per doctrine 2.

Model answers: STAR-shaped where behavioural, structure-first where technical
(state the framework, then the example). 60–120 seconds spoken. Every number
from `FROZEN-FACTS.md` with its qualifiers, nothing invented. First person
singular — "we" describes a team the candidate happened to be near, and
interviewers discount it.

Each answer ends with a one-line **cue**: the 5–8 word memory hook to practise
from, so the pack teaches recall rather than recitation.

Weight by round. HR screens are motivation, logistics and no-hard-stops.
Technical rounds are streams 3 and 4. Finals are strategy, fit, and questions to
ask them.

Anything newly written here that belongs to the candidate permanently — a story
that did not exist before — gets appended to `STAR-BANK.md` in the same turn.

## Stage 4 — Build the HTML

Start from `.claude/skills/job-application-assistant/assets/prep-template.html`.
It is a complete interactive shell on the user's design system: tabs, reveal
cards, confidence tracking, progress bar, dark mode, print. **Fill it; do not
rebuild it.** Comments mark every `{{PLACEHOLDER}}` and show one exemplar of
each repeatable component to duplicate.

Tabs, in order: **Game plan** (process map, top-5 priorities, locked answers up
front) · **Interviewers** (one card each: background, what they care about,
likely questions from them) · **Question bank** (practice cards, filterable) ·
**Technical revision** (concepts to re-derive the night before) · **Company
intel** (entity, strategy hooks, dated news) · **Your questions** (tiered: safe,
sharp, strategic) · **Danger zone and logistics** (integrity table as Q&A, day-of
checklist, locked answers restated).

Build steps:

1. Copy the template to the scratchpad and fill every placeholder.
2. Set `data-prep-key` to `<Company>-<Stage>` so saved progress is namespaced per round.
3. Sanity check: `grep -c '{{' <file>` must return 0.
4. Inline the design-system CSS so the file is self-contained and survives being opened on a phone:

```bash
"$CLAUDE_DESIGN/scripts/inline-css.sh" \
  <scratch.html> "~/Documents/Jobs/<Company>/Interview-Prep-<Stage>.html"
```

`$CLAUDE_DESIGN` is the local design-system checkout. It is not hardcoded here
because this repo is public and a filesystem path is machine-specific; resolve
it from the `claude-design` skill, which knows where the system lives.

The template ships with `href="CLAUDE_DESIGN_CSS_PATH"` as a placeholder for the
same reason. Point it at the local design-system CSS before inlining, or let the
inline script resolve it.

If the design system is unavailable, do not silently emit an unstyled page:
say so, and either inline a minimal self-contained stylesheet or stop. A prep
pack that renders as unstyled HTML on a phone the morning of an interview is
worse than no pack.

No hardcoded colours anywhere — design tokens and component classes only.

## Stage 5 — Verify in the browser

On-disk correctness is not rendered correctness. Open the finished file in
Chrome via Claude in Chrome and actually exercise it: click at least two tabs,
reveal a question card, mark one "confident" and confirm the progress bar moves,
toggle dark mode, screenshot light and dark.

If anything is broken, fix and re-verify. **Do not report done on a pack you
have not seen working.**

## Stage 6 — Diary the round

A pack the user meets for the first time an hour before the call has failed.
Put the round in the calendar with `ical`, and record the event ids so a
reschedule can find them again.

If `ical` is not installed (`command -v ical`), skip the stage and say so once
in Stage 7. Do not improvise with another tool.

**Never invent a time.** If Stage 0 could not establish the date and start time
from the folder, ask. An event at a guessed hour is worse than no event,
because the user will act on it.

1. **Which calendar.** Read `~/Documents/Jobs/.ical_calendar`. If it is absent,
   run `ical calendars`, ask which one, and write the answer there — it is
   personal configuration and belongs in the data root, never in this repo.

2. **The round.** Duration from Stage 0; default 60 minutes and say which you
   used. Carry the joining detail in the field that matches the format: `--url`
   for a video call, `--location` plus `--travel` for an in-person round, so
   the travel block lands in the diary too. Pass `--timezone` whenever the
   invitation names one that is not the user's — a mis-zoned final round is
   unrecoverable.

   ```
   ical add "<Round> — <Company>" -s "<date> <time>" -e "<date> <end>" \
     -c "<calendar>" --alert 1d --alert 1h -o json
   ```

3. **A prep block**, 60 minutes, the evening before or the morning of —
   ask which. `--notes` carries the absolute path to the pack HTML so the
   reminder is one click from the thing it is reminding about.

4. **Record the ids.** Append the full `id` of both events to
   `Interview-Intel.md` under an `## Events` heading, with the round and what
   each event is. Without them a reschedule means hunting the event by hand.

**Only `--id` with the full `UUID:UUID` string is safe.** A macOS event
identifier opens with a run of characters shared by every event in the store,
so a shortened id resolves to an arbitrary event — on unpatched `ical`
(≤ v0.12.2) `delete` acts on whichever one that was, silently. Confirm with
`ical show --id "<full id>"` before any `update` or `delete`, and never pass a
positional id to either.

If `ical add -o json` returns something other than JSON, the installed build
predates the fix for that; recover the id with
`ical search "<title>" -o json` rather than reading it off the summary line,
which prints a truncated and therefore useless id.

## Stage 7 — Report

A short summary in chat, not another file.

- **The five questions to practise aloud first** — highest probability × highest stakes
- **Weak spots** — where the audit's gaps meet likely questions, and the honest line for each
- **Research gaps** — which tracks came back thin, and what that means for confidence
- **Logistics** — the locked answers, restated once

The weak spots matter most. The user can read the pack; what they cannot see is
which question is most likely to hurt.

---

## Notes

- **Later rounds reuse earlier work.** `Interview-Intel.md` accumulates. A technical-round pack following an HR-screen pack re-scrapes nothing except newly named interviewers and fresh news. Locked answers carry forward verbatim.
- **Thin folders are fine.** If the company folder lacks research or audit files — an interview somewhere `/apply` never ran — say so, do a compressed version of the missing research inline, and note in the report that the CV-defence stream had no audit to work from.
- **Debriefs feed forward.** When the user comes back with what was actually asked, append it to `Interview-Intel.md` under a Debrief heading and to `STAR-BANK.md`'s debrief table. It is the highest-quality evidence for the next round, and `/outcome` records the stage result alongside it.
- **Mock interviews.** If the user wants to rehearse, run the roleplay from the built pack rather than from memory, and afterwards append what they struggled with to the debrief table.
