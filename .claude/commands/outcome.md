# /outcome - Record the Result of an Application

You are recording what happened to a job application: progress updates (interview invitations, stages completed, offers) and final resolutions (hired, rejected, no response). The data lands in two places the framework already reads but nothing systematically writes:

- `~/Documents/Jobs/job_search_tracker.csv` - the status column that `/scrape` and `/rank` use for dedup and exclusion
- `~/Documents/Jobs/<Company>/` - the per-application archive (posting, submitted drafts, `outcome.md`) that `/facts` sweeps for unrecorded facts and employer commitments, and that `/upskill` reads for recurring gaps

`/outcome` writes the data; `/facts` and `/upskill` interpret it. This command never edits the evaluation framework or the frozen-facts record itself.

The command also owns the stretch *before* there is an outcome to record: the **follow-up branch** (Step 2b) surfaces open applications that have gone quiet, drafts a brief follow-up note in the user's voice, and logs it - so the chase and the resolution it eventually leads to live in one flow.

Follow these steps **in order**.

---

## Step 0: Parse Input

`$ARGUMENTS` may contain:

- Nothing → list open applications and ask which one to update
- A company name (optionally with a role), e.g. `/outcome acme` or `/outcome acme ml engineer` → target that application
- `followup` → enter the follow-up branch (Step 2b) over every quiet open application, using the default threshold of **10 days**
- `followup <N>`, e.g. `/outcome followup 14` → follow-up branch with an N-day threshold
- `followup <company>`, e.g. `/outcome followup acme` → draft a follow-up for that application now, regardless of threshold

---

## Step 1: Load State and Identify the Application

1. Read `~/Documents/Jobs/job_search_tracker.csv`. If it does not exist, create it with the standard header:
   ```
   date,company,sector,role,role_type,channel,status,contact_person,fit_rating,notes,cv_file,cover_letter_file,source
   ```
2. **With an argument:** match rows case-insensitively on company (and role, if given). One match → proceed. Several → list them and ask. None → the application was made outside the workflow; collect company, role, date applied, channel, and posting URL from the user and add a tracker row.
3. **Without an argument:** list all rows whose status is not final (not hired / rejected / no response / withdrawn / offer declined) as a numbered table (company, role, date applied, current status, days quiet, follow-ups sent) and ask which to update. The two derived columns come straight from existing data: **days quiet** counts from the row's `date` or the latest dated entry in `notes`, whichever is more recent; **follow-ups sent** counts the `followed up YYYY-MM-DD` markers in `notes`. If any open row is 10+ days quiet with fewer than two follow-ups sent, add one line under the table: "Some of these have gone quiet - want a follow-up draft? (Step 2b)". If every row is resolved, say so and stop.
4. Derive the archive folder name: `~/Documents/Jobs/<Company>/` - lowercase, underscores for spaces (the convention documented in `documents/README.md`). Check whether the folder and an `outcome.md` already exist - if so, you are updating, not creating.

---

## Step 2: Collect What Happened

Ask the user what happened, then classify:

**Progress updates** (application still open):
- Interview invitation / stage scheduled or completed (phone screen, technical, case, final round)
- Offer received (not yet accepted or declined)

**Resolutions** (application closed) - the status enum:
- `hired` - accepted an offer
- `offer_declined` - received an offer, turned it down
- `rejected` - explicit rejection at any stage
- `no_response` - no reply; if the user is unsure whether to call it, note how long it has been since the last contact and let them decide - do not impose a cutoff
- `interview_only` - reached interviews but the process stalled or was abandoned without an explicit rejection

Also collect, without interrogating - one or two open questions are enough:
- Dates for the stages reached
- Any feedback received, verbatim where the user remembers it
- What they'd do differently, and any signal about what the company valued. Concrete beats polished: this is the raw material for the debrief table in `STAR-BANK.md`, and a story that failed under follow-up is the most useful thing a round produces

---

## Step 2b: Follow-Up Branch (chase a quiet application)

Enter this branch from the `followup` argument (Step 0) or from the offer under the open-pipeline table (Step 1.3). Standard practice is a brief, polite follow-up one to two weeks after applying, at most twice; this branch operationalizes that.

**Candidates.** An application qualifies when its status is not final, the threshold has passed since its `date` (or since the last `followed up` marker in `notes`, if any), and it has fewer than **two** logged follow-ups. Parse dates defensively - skip rows whose dates do not parse and say so rather than guessing. Present qualifying applications as a table (company, role, days quiet, follow-ups sent, channel, contact person) and draft only for the ones the user picks.

**Threshold.** The 10-day default is deliberately earlier than `/mail-sync`'s 30-day staleness flag (its Step 9): that check is a read-only alarm that a row has been forgotten entirely; this branch is the proactive nudge while a reply is still plausible. The two numbers serve different moments, which is why they differ.

**Drafting.** For each selected application:

1. Read the archive folder: the `job_posting.md`, `cv_draft.tex`, and `cover_letter.tex` that Step 3 maintains are the source of **every claim** the note may make - this is Rule 3 (never fabricate) widened to "no new claims": a follow-up that introduces skills or experience the submitted materials don't contain is a fabrication vector.
2. Apply the writing style rules from `03-writing-style.md` (no cliches, no em-dashes, warm but direct), and match the application's language - draw the register from the archived cover letter.
3. Write roughly **60 to 120 words**: address the `contact_person` from the tracker if present (otherwise the team, in the application's language); one sentence restating interest in the specific role; one concrete value-reminder drawn from the submitted materials; one polite question about the timeline. No pressure, no "just checking in" filler.
4. Shape it for the `channel` column: email (with a subject line reusing the application's headline), LinkedIn message (shorter, no subject), or portal message (plain text).
5. Present the draft and iterate until the user is happy.

**Logging.** Once the user confirms they will send it (or have sent it), log it in the same turn - an unlogged follow-up breaks the next run's quiet-days math:

- Append `followed up YYYY-MM-DD` to the row's `notes` column (Step 4's rule applies: append a dated note, never restructure the CSV).
- Save the final note as `followup_YYYY-MM-DD.md` in the company folder, alongside everything else for that application.
- Put the next nudge in the calendar, when `ical` is installed and this was the **first** follow-up. Until now the 10-day threshold only existed as arithmetic recomputed on the next run of this command, which requires the user to think of running it; an all-day event 10 days out makes the same number act on its own. Calendar name comes from `~/Documents/Jobs/.ical_calendar`, the same file `/interview` uses — read it, and ask once if it is absent.

  ```
  ical add "Follow up: <Company> — <Role>" -s "<date + 10 days>" --all-day \
    -c "<calendar>" -n "<absolute path to followup_YYYY-MM-DD.md>" -o json
  ```

  Record the returned full `id` in that note. Skip this on the second follow-up: the termination rule below means there is no third, so a reminder to send one is worse than no reminder at all.

If the user decides not to send, log nothing — including no calendar event.

**Termination.** When an application hits two follow-ups and stays silent, do not offer a third. This is the moment to continue in this same command's Step 2: note how long it has been since last contact and let the user decide whether to record `no_response` - as ever, no imposed cutoff. And if the user mentions an actual response while in this branch (an interview invitation, a rejection), drop out of the branch and record it through the normal Step 2 flow.

---

## Step 3: Archive the Application Materials

Create or update `~/Documents/Jobs/<Company>/`. All content here is personal data. The folder lives outside this repo, so nothing needs redacting - but nothing from it may be copied into the repo either.

1. **The submitted CV and cover letter** - these already live in the company folder, written there by `/apply`. Locate them via the tracker row's `cv_file`/`cover_letter_file` columns; if those are empty, look for `qiankun-resume.pdf` and the `Qiankun_Zhu_CV_<Role>.pdf` submission copy alongside it. Never overwrite one: the file on disk is what was actually submitted. If none exist (application made outside `/apply`), note that and move on.
2. **`job_posting.md`** - if it already exists, leave it. Otherwise try WebFetch on the tracker row's `source` URL and save the posting text. If the URL is dead (postings expire fast - this is exactly why the archive matters), ask the user to paste the posting, or write a stub noting the posting is unavailable. **Never reconstruct a posting from memory.**
3. **`outcome.md`** - write or update it in the format below, kept stable so later commands can parse it without special cases:

```markdown
# Outcome: <Company> — <Role>

**Status:** in_progress | hired | offer_declined | rejected | no_response | interview_only

**Date resolved:** YYYY-MM-DD   <- only when resolved; omit while in_progress

## Interview stages reached
- [x] Phone screen (YYYY-MM-DD)
- [ ] Technical interview
- [ ] Case interview
- [ ] Final round
- [ ] Offer received

## Notes
<feedback received, what to do differently, signals about what they valued -
appended per update with a date, never overwritten>
```

Update rules: tick stage checkboxes as they are reached (add the date in parentheses), append dated entries to Notes, and only change `Status` from `in_progress` to a final value on resolution. Re-running `/outcome` on the same application is idempotent - it appends new information, never duplicates or rewrites history.

**Thank-you note trigger:** when this step ticks a newly completed interview stage, offer in the same turn: "Want a short thank-you note for the interviewer? A prompt one is standard practice." If accepted, draft it under Step 2b's drafting and logging rules (same voice, same no-new-claims boundary, same `followup_YYYY-MM-DD.md` archive convention). Recording the stage is the trigger - no scanning for recent stages is ever needed.

---

## Step 4: Update the Tracker

Update the matched row's `status` column (e.g. `applied` → `interview` → `offer` → `hired` / `rejected` / `no response` / `offer declined` / `withdrawn`) and append a short dated note to the `notes` column. Never restructure the CSV, reorder rows, or touch other rows.

**Clear the outstanding reminders when the status becomes final.** Follow-up nudges from Step 2b and interview events from `/interview`'s Stage 6 recorded their event ids in the company folder — the `followup_*.md` notes and `Interview-Intel.md` respectively. A rejection recorded today should not leave the user being reminded next week to chase it. Collect those ids, list what will go, and let the user confirm before removing any of them: this is the one thing in this command that destroys data outside the folder.

Use the full `UUID:UUID` id and `--id` only, and run `ical show --id "<id>"` first to confirm the target. A shortened macOS event id resolves to an arbitrary event, so a positional argument here would delete somebody's dentist appointment. An id that no longer resolves means the user already removed the event by hand — say so and move on rather than searching for something to delete.

---

## Step 5: Calibration Handoff

Count the `outcome.md` files under `~/Documents/Jobs/` with a **final** status (not `in_progress`).

- If 3 or more are resolved (or 2+ share a pattern - same role type rejected twice, same sector going silent), suggest:
  > "You now have <N> resolved applications on record. Run `/upskill` to see which requirements keep coming up that the profile does not support, and `/facts` to sweep the folders for facts and commitments that never made it into the record."
- Do **not** write anything into `04-job-evaluation.md` or other skill files yourself. Recording an outcome is not the same as re-weighting the framework, and conflating them would let one rejection quietly move the scoring.

---

## Step 6: Confirm

Summarize what was recorded:

> **Outcome recorded for <Role> at <Company>.**
>
> - `~/Documents/Jobs/<Company>/outcome.md` - status: <status>, <what changed>
> - Archived: <which of cv_draft.tex / cover_letter.tex / job_posting.md were copied or fetched, and which were skipped and why>
> - Tracker: status → <new status>
>
> [Calibration suggestion from Step 5, if triggered]

If the update recorded an upcoming or newly scheduled interview stage, also suggest:

> "Interview coming up? `/interview <company>` builds a prep pack for that stage from this application's archive - the posting, the documents you submitted, and any feedback recorded from earlier rounds."

If the recorded status is `hired`, congratulate the user warmly first - this is the moment the whole framework exists for. Then add this single line (once; never on re-runs for the same application, and never for any other status):

> "If this framework helped you get there, consider [buying it a coffee](https://ko-fi.com/madslorentzen) - it keeps this free for the next job-seeker out there. ☕"

---

## Important Rules

1. **Write data, don't interpret it.** The archive and tracker are the outputs; interpretation belongs to `/facts` and `/upskill`. This command never edits the frozen-facts record or framework files.
2. **The archived version is the submitted version.** Existing files in the application folder are never overwritten by fresher drafts.
3. **Never fabricate.** A dead posting URL gets a user-pasted copy or an explicit "unavailable" stub, not a reconstruction. Feedback is recorded as the user reports it.
4. **Stay schema-compatible.** `outcome.md` follows the format in `documents/README.md` exactly (`in_progress` is the one addition, for open applications); the tracker keeps its columns.
5. **Idempotent updates.** Re-running on the same application appends new stages and notes; it never duplicates folders, rows, or history.
6. **Follow-ups: draft only, never send.** The follow-up branch produces text for the user to send themselves. It never emails, messages, or submits anything, and it must not be wired to tools that do.
7. **Follow-ups: no new claims.** Every substantive statement in a follow-up or thank-you note comes from the archived submitted materials. Rule 3 applies with no exceptions.
8. **Maximum two follow-ups per application.** After the second silent follow-up, the honest move is recording the resolution, not persistence.
