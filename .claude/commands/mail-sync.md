# /mail-sync - Sync application status from Apple Mail

You are scanning Apple Mail for status signals on tracked applications —
interview invitations, assessment links, offers, rejections — and, once
approved, writing the detected changes into
`~/Documents/Jobs/job_search_tracker.csv` and
`~/Documents/Jobs/<Company>/outcome.md`, the same two places `/outcome` writes.

Unlike `/outcome`, which asks the user what happened, `/mail-sync` classifies
real emails on its own. **It never writes on its own.** Every classified change
is presented as a batch *before* anything is written, and proceeds only once the
user approves. Approving the whole batch at once is fine; writing first and
flagging afterwards is not.

A wrong write silently corrupts application history that later runs read as
fact. Every proposed change cites its source email, and every uncertain case is
surfaced rather than guessed. The job is not "notice something in an inbox" — it
is "propose a correct, sourced line for a permanent record, and write it only
once the user says yes."

---

## Step 0 — Prerequisites

Confirm the Apple Mail MCP tools (`mcp__plugin_apple-mail_apple-mail__*`) are
available. If not, say so and stop. Do not fall back to Bash, IMAP, AppleScript,
or any other channel.

**Read-only.** This command never sends, replies, moves, deletes, flags, or
marks anything read. It only searches and reads.

## Step 1 — Parse input

`$ARGUMENTS` may contain:

- Nothing → default lookback (Step 3)
- A company name → scope to that one tracked application
- `since <YYYY-MM-DD>` → override the lookback start for this run only, without changing persisted state

## Step 2 — Load state

1. Read `~/Documents/Jobs/job_search_tracker.csv`. If absent, there is nothing to sync against: suggest `/apply` or `/outcome` first and stop. **`/mail-sync` never originates an application**, it only updates existing ones.
2. Read `~/Documents/Jobs/.mail_sync_state.json`, creating it if missing as `{"last_sync": null, "processed_message_ids": []}`.
3. Build the set of **open applications**: rows whose `status` is not final (`hired`, `rejected`, `no response`, `offer declined`, `withdrawn`). For each, note its company folder `~/Documents/Jobs/<Company>/` and whether `outcome.md` exists there.
4. If a company was named, filter to matching rows case-insensitively. No match → say so and stop; do not guess.

## Step 3 — Establish search scope

**Apple Mail has no Gmail query language.** There is no `label:`, no
`newer_than:`, no `{a OR b}` grouping. `search_emails` takes structured
arguments, `sender` accepts a single value, and `body_text` search is explicitly
slow because it reads every message body. So the strategy is **several narrow
searches unioned client-side**, not one clever query.

Call `list_mailboxes` first to discover the real account and mailbox names —
they change, and some are non-ASCII.

**Prefer a dedicated job-mail location over the general inbox.** A dedicated
account or folder turns a fuzzy company-name match across a noisy inbox into a
near-complete, high-precision scan. In descending order of preference:

1. An account whose name indicates job applications (e.g. an account named `Application`)
2. A mailbox path indicating job or careers mail (e.g. `收件箱/Job`, `收件箱/CareerHub`)
3. The general `INBOX` of each account, filtered by company name and ATS sender

Confirm the chosen scope with the user on the first run of a session if more
than one candidate exists. Record what was scanned in the summary — a sync that
silently skipped an account reads as "no news" when it means "did not look".

Lookback window: the `since` argument if given, else `state.last_sync`, else 30
days back. Pass it as `date_from` in `YYYY-MM-DD`.

## Step 4 — Search

Run these and union the results, deduplicating on message id:

- **Dedicated scope sweep.** For each dedicated account or job folder found in Step 3, call `search_emails` with `account`, `mailbox`, `date_from`, `output_format: "json"`, `sort: "date_desc"`, and a generous `limit`. No keyword filter — the folder *is* the filter.
- **Company-name sweep.** `search_emails` with `subject_keywords` set to the list of open applications' company names. `subject_keywords` matches **any** keyword in the list, which is the only OR mechanism available; use it rather than looping one company at a time.
- **ATS sender sweep.** `sender` takes one value, so this is **one call per domain**, not a group: `greenhouse.io`, `lever.co`, `myworkday.com`, `ashbyhq.com`, `smartrecruiters.com`, `icims.com`, `workable.com`, `teamtailor.com`, `eightfold.ai`.

Always request `output_format: "json"` — it returns stable message metadata, and
the ids are what Step 5's deduplication depends on. Text output is for humans.

Paginate with `offset` and `limit` when a sweep hits its cap. **A sweep that
returns exactly `limit` results has almost certainly been truncated** — page it
until it returns fewer, or report the cap in the summary.

Skip sent mail and drafts. Status signals come from what employers send.

Do not use `body_text` for the sweep; it is slow and unnecessary when subject
and sender already narrow the field. Full bodies come in Step 5, only for
candidates.

Normalise company names for matching: lowercase, strip `inc`, `inc.`, `llc`,
`ltd`, `limited`, `plc`, `corp`, `corporation`, `group`, `a/s`; strip
punctuation; collapse whitespace.

## Step 5 — Filter to new messages

Drop any message whose id is already in `state.processed_message_ids`.

For the remainder, fetch full content before classifying — `include_content:
true` with `max_content_length: 0`, or `get_email_thread` for the surrounding
conversation. **Never classify from a subject line or a truncated preview.** The
snippet is exactly where "we would like to schedule a call" and "thank you for
applying" become indistinguishable.

`get_email_thread` keys on `account` plus `subject_keyword` rather than a thread
id, so strip `Re:`/`Fwd:` prefixes before passing a subject through.

## Step 6 — Classify

Match each message to one open application by comparing normalised sender
domain, display name, subject and body against the normalised company names. No
confident match, or ambiguity between two tracked companies → do not propose a
write; record it as "unmatched" and move on.

Require the signal phrase in the subject or the first few lines. A company name
appearing only in a forwarded thread or a newsletter footer is not a signal.

| Signal | Example phrasing | Tracker `status` | `outcome.md` action |
|---|---|---|---|
| Application acknowledgement | "we have received your application" | *no change* | *no change — noise, not a signal* |
| Assessment | "online assessment", "coding challenge", HackerRank / Codility / SHL links | `interview` | Tick the nearest stage, or add a Notes line if no stage fits |
| Interview invitation | "schedule a call", "phone screen", "technical interview", "next round", "assessment centre", "final round" | `interview` | Tick the matching stage with the email's date |
| Offer | "pleased to offer", "extend an offer", "offer letter" | `offer` | Tick "Offer received". **Never propose `hired` or `offer declined` from an email** — accepting or declining is the user's decision, never inferred. Flag separately from the plain approve/skip table. |
| Rejection | "moving forward with other candidates", "not selected", "unable to proceed", "on this occasion" | `rejected` | Set status and the resolution date |

**Conflict rule.** If a classification contradicts the row's current state — a
rejection arriving after an offer was already proposed this run, or a signal
that would overwrite a final status — do not propose the overwrite. Record it as
a conflict for manual `/outcome` resolution.

**Automated-sender rule.** A careers-portal digest, a job alert, or a "jobs like
this one" marketing mail is not a status signal even when it names a tracked
company. Require the message to be *about this application*.

## Step 7 — Present, then wait

```
## Mail sync — proposed updates — YYYY-MM-DD

Scanned: <accounts and mailboxes>, <N> messages since <date>

### Proposed changes (reply "approve all", or name which to skip)
| # | Company | Role | Current | Proposed | Source email (sender, subject, date) |

### Needs your decision
Offers. Not proposed automatically.

### Conflicts — not proposed, resolve with /outcome
### Unmatched — no change proposed
### Stale — open 30+ days with no activity
```

**Wait for approval. Write nothing before it.** If the user approves a subset,
write only that subset.

## Step 8 — Write, then record

For each approved change:

1. Update the tracker row's `status`, and append a dated note citing the source email.
2. Update `~/Documents/Jobs/<Company>/outcome.md`, creating it from the `/outcome` template if absent.
3. Where the signal is an interview invitation, the company folder is where a prep pack would go — mention `/interview <company>` in the closing summary rather than building one unasked.

Then append every message id **that was examined this run** to
`state.processed_message_ids`, including unmatched and skipped ones, and set
`last_sync`. An id left out will be reprocessed and re-proposed on the next run.

Keep the id list bounded: drop entries older than roughly a year, or cap it at a
few thousand and trim oldest-first. It is a dedup set, not an archive.

## Step 9 — Closing summary

Report what was written, what was skipped, offers awaiting a decision, stale
applications, and **what was not scanned**. Then point at the natural next step:
`/interview <company>` for a new invitation, `/outcome` for anything that needs
a human decision.

---

## Rules

- **Never write before approval.** Not even "obvious" rejections.
- **Never infer acceptance or decline.** Only the user decides those.
- **Never classify from a subject line alone.**
- **Never originate a tracker row.** Unmatched mail is reported, not added.
- **Never modify the mailbox.** Read-only, always.
- **Report the scope you actually covered**, including anything skipped or truncated.
