# /facts - Reconcile the frozen-facts record

You are auditing every source that states a fact about the candidate, finding
where they disagree, and proposing corrections to
`~/Documents/Jobs/CV/FROZEN-FACTS.md` — the single authority every document is
drafted from.

`$ARGUMENTS` may name a scope: a company folder (`/facts eni`), `sources` (CV
variants only), or nothing (everything).

**Nothing is written until the user confirms.** This command proposes; it does
not decide.

---

## Why this exists

Facts leak. A number gets refined in one tailored CV and never propagates back.
A role is declared on an application form but appears on no CV. A grade is
submitted to an employer and recorded nowhere. A skill is claimed aloud on a
recruiter call.

Each of those is a real fact that the next drafting session cannot see. The
grounding audit in `/apply` is deliberately strict — anything unsupported is
stripped — and it cannot tell an invention from a truth that was never written
down. So an unrecorded achievement disappears silently from every future
document, and an unrecorded commitment becomes a contradiction waiting to
happen.

This command is the sweep that catches both.

## Step 1 — Enumerate the sources

Read what exists; none are guaranteed.

| Source | Authority | What to take |
|---|---|---|
| `~/Documents/Jobs/CV/FROZEN-FACTS.md` | The record being audited | Current state |
| `CV/personal/resume/resume-data.yaml` | High | Identity, skills inventory |
| `CV/personal/resume/*.typ` (sector variants) | High | Bullet content, numbers |
| `CV/qiankun-resume.typ` | High for content, **not** for framing | Its banner and Profile reflect the last job tailored |
| `~/Documents/Jobs/<Company>/*.typ` | High | Tailored variants often carry facts the base files never got |
| `CV/Project Bank.md` | Low | **OCR-damaged.** Never trust a number here over a `.typ` |
| `<Company>/**/Form-*.md`, `Application-Form-QA.md` | **Highest for commitments** | Anything declared to an employer |
| `<Company>/**/Compensation-Form-*.xlsx` | **Highest for commitments** | Salary, availability, right to work |
| `<Company>/**/CV-JD-AUDIT.md` | High | Integrity risks; what was deliberately not claimed |
| `<Company>/**/*transcript*.md`, `*-emails/*.md` | **Highest for commitments** | Anything said aloud or in writing to an employer |

Read spreadsheets with a Python one-liner and `openpyxl` rather than guessing at
their contents.

**A fact stated to an employer outranks a fact on an internal draft.** The
employer holds their version; the record must match what they hold, or be
explicitly corrected with them.

## Step 2 — Extract and compare

Build a claim table: each distinct fact, every source that states it, and the
value each gives.

Classify each row:

| Class | Meaning | Action |
|---|---|---|
| **AGREED** | Every source that mentions it says the same thing | Nothing |
| **DRIFT** | Sources disagree on the value | Propose the majority or highest-authority value, and say which sources dissent |
| **UNRECORDED** | A real fact appears in a source but not in `FROZEN-FACTS.md` | Propose adding it |
| **STALE** | The record contradicts something that has since changed | Propose the correction, and flag anyone already holding the old version |
| **UNSUPPORTED** | `FROZEN-FACTS.md` states something no source backs | Ask; do not silently delete |

Watch specifically for:

- **A role or project on one tailored CV but on no base variant.** This is the most common leak and the most costly: a real job that later drafts cannot see.
- **Numbers that moved.** A count, a percentage, a notional. Doctrine 2 says these are frozen; a difference is an error somewhere, not a rounding choice.
- **Qualifiers that got dropped.** A backtest figure without its in-sample label is a different claim from the same figure with it.
- **Anything committed on a form** — salary, notice, availability, right to work, grades — that is not in the locked-answers table of `STAR-BANK.md`.
- **Skills claimed verbally** in a call transcript that are absent from the inventory.
- **Dates that have since passed.** A degree rendered "Present" after its end date, or an availability date now behind us.

## Step 3 — Present

```
## Fact reconciliation — YYYY-MM-DD

Scanned: <N sources across M company folders>

### Drift — sources disagree
| Fact | Value in record | Dissenting source(s) | Proposed |

### Unrecorded — real, but missing from the record
| Fact | Found in | Proposed entry |

### Stale — the record has been overtaken
| Fact | Recorded | Actual | Who holds the old version |

### Unsupported — in the record, backed by nothing
| Fact | Asking, not deleting |

### Nothing to do
<count> facts agreed across all sources.
```

Quote the source for every row. A proposed change with no citation is a guess
wearing a table's clothes.

## Step 4 — Confirm, then write

Wait for approval. Approving everything at once is fine; writing first is not.

On approval:

1. Update `~/Documents/Jobs/CV/FROZEN-FACTS.md`. Add to the main tables what is confirmed; add to **Unresolved discrepancies** what is not.
2. Record any employer commitment in `~/Documents/Jobs/CV/STAR-BANK.md` under **Locked answers**, with what was submitted, to whom, and when.
3. Where a `.typ` variant carries the wrong value, fix it there too rather than leaving the sources disagreeing. Recompile and re-verify the page count for any CV touched.
4. Where a change affects a document an employer already holds, say so explicitly in the summary. A silently changed date reads as unreliability; an acknowledged correction reads as diligence.

## Rules

- **Never invent.** An absent fact is absent. If a source is ambiguous, put it in Unresolved rather than resolving it by preference.
- **Never resolve drift by averaging.** One of the values is right.
- **Never delete an unsupported claim without asking.** It may be a real fact whose source was moved or renamed.
- **Never treat OCR-damaged text as authoritative.** `Project Bank.md` loses spaces and digits; verify against a `.typ` before believing any number from it.
- **Report what was not scanned**, including any file that could not be read.
