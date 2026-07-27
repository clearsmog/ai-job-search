# Research guide — per-source instructions

Read this at the start of Stage 2. Each source section says how to reach the
content, how to confirm you're signed in, what to capture, and what its
failure mode looks like. The output contract for all of them is the same:
**findings land in markdown in the company folder before the HTML stage
starts.** `Interview-Intel.md` is the destination unless a track produces
enough material to justify its own file (then name it `Interview-Intel-<Track>.md`
and link it from the main file).

## Orchestration

One real Chrome exists, so gated tracks are serial and you drive them
yourself; headless tracks go to subagents first so they run in parallel while
you drive the browser.

```
launch subagents:   Reddit  ·  Indeed (MCP)  ·  News/trade press
then drive Chrome:  Glassdoor  →  LinkedIn  →  Blind (optional)
then merge:         subagent results + your browser notes → Interview-Intel.md
```

For Claude: load the `claude-in-chrome` skill before any
`mcp__claude-in-chrome__*` call, batch the tool loads into one `ToolSearch`,
start with `tabs_context_mcp`, and open a new tab rather than hijacking one
the user is working in.

---

## Glassdoor (browser, signed in)

The highest-value source: real candidates reporting real questions.

- **Where:** `glassdoor.co.uk` → search the company → **Interviews** tab. URL
  shape: `/Interview/<Company>-Interview-Questions-E<employer-id>.htm`. Filter
  or search within reviews by the role family ("risk analyst", "trader",
  "graduate analyst") — exact-title matches are rare, so widen to the desk or
  function and say you did.
- **Signed-in check:** account avatar in the top-right nav. Glassdoor
  hard-gates review content behind an account; a signed-out session shows a
  blurred overlay or sign-up wall. If you hit that, tell the user and skip.
- **Capture per review:** the question(s) verbatim · role title as reported ·
  location · month/year · interview outcome (offer / no offer / declined) ·
  difficulty rating · the candidate's process description (rounds, duration,
  who they met). Recent reviews (≤ 2 years) outrank old ones; same-desk
  outranks same-company.
- **Also grab while there:** overall interview difficulty stat, "how did you
  get the interview" split, and typical process length — these feed the
  process map on the Game plan tab.
- **Failure mode:** no reviews for the role. Widen to the parent company or
  the function ("market risk" reviews at any trading shop overlap heavily),
  and label the widened provenance honestly.

## LinkedIn (browser, signed in)

Two jobs here, in priority order:

1. **Named interviewers.** For each name from the invitation: profile
   deep-dive — headline, current scope, career path in, tenure, and above all
   their **own posts and how they describe their work**. A hiring manager who
   posted about the role has literally published the question list (Ashok's
   "supporting daily P&L and risk reporting… working closely with the Front
   Office" post is the canonical example). Check whether the existing
   `*People-LinkedIn.md` already covers them — re-scrape only what's missing
   or stale.
2. **Incumbents in the seat** (if not already in `*People-LinkedIn.md`):
   people currently holding the target title — their bullet phrasing is the
   vocabulary the panel expects to hear.

- **Signed-in check:** the feed loads with the user's avatar; profile pages
  show full sections. HTTP 999 / auth-wall means not signed in — stop, tell
  the user, skip.
- **Capture:** URL, headline, scope, path in, verbatim self-descriptions,
  post excerpts with dates. Attribute everything; flag inference as inference.

## Blind (browser, best-effort)

Candid but heavily gated; treat as a bonus track, not a dependency.

- **Where:** `teamblind.com` → search `<company> interview` and the role
  keywords.
- **Signed-in check:** posts render in full rather than truncating to a
  sign-up prompt. Blind requires a verified work email, so the user may
  simply not have an account — if content is gated, skip without ceremony and
  note it in the report.
- **Capture:** reported questions, comp data points, process complaints
  (slow feedback, ghosting patterns) — useful for expectation-setting.

## Reddit (headless-safe → subagent)

- **How:** WebSearch with `site:reddit.com <company> interview <role words>`,
  plus the function subreddits (r/FinancialCareers, r/quant, r/AskEngineers —
  whatever fits the field). WebFetch the promising threads; Reddit's public
  JSON (`<thread-url>.json`) is reliable when the HTML is cranky.
- **Capture:** reported questions and experiences with thread URL and date.
  Reddit skews negative and anonymous — weight it below Glassdoor, and keep
  the colourful-but-unverifiable stories out of the pack.

## Indeed (MCP → subagent)

- **How:** the `mcp__claude_ai_Indeed__*` tools (load via ToolSearch inside
  the subagent). `get_company_data` for company reviews and interview info;
  `search_jobs`/`get_job_details` if the posting itself is on Indeed.
- **Capture:** interview-related review excerpts, company rating context,
  anything on process/timeline. Indeed's interview content is thinner than
  Glassdoor's — it corroborates rather than leads.

## News / trade press (headless-safe → subagent)

- **How:** WebSearch, company newsroom, the trade press for the sector
  (for energy trading: Argus, Montel, Energy Intelligence, Reuters
  commodities). Window: last ~6 months, plus anything strategic already
  flagged in `Research-<Role>.md` (a pending JV, an acquisition).
- **Capture per item:** date · one-line fact · one-line "so what for this
  interview" (a talking point, a question to ask them, or a risk to be ready
  to discuss). An undated news item is unusable in an interview — always
  carry the date.

---

## Interview-Intel.md shape

```markdown
# Interview Intel — <Role>, <Company>

## <YYYY-MM-DD> — <Stage> round

### Process (Glassdoor, N reviews read)
…rounds, duration, difficulty, how sourced…

### Reported questions
| Question | Role as reported | Source | Date | Outcome |
|---|---|---|---|---|

### Interviewer notes
…per person: scope, self-descriptions, post excerpts, likely angles…

### Community signal (Reddit / Blind / Indeed)
…attributed items, weighted honestly…

### News hooks
| Date | Fact | So what |
|---|---|---|

### Gaps
…which tracks were empty/gated and why…

## <later date> — Debrief / next round
…appended, never rewritten…
```
