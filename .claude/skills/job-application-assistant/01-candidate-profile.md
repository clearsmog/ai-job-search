---
framework_version: 1.1.0
---

# Fact sourcing

**This repository is a public GitHub fork and holds no personal data.** The
candidate profile is not stored here. This file says where the facts live and
how to handle them; the facts themselves live outside the repo, untracked.

Every number, date, employer detail and contact field used in a CV, cover
letter, application form or interview answer is read from the sources below at
the time it is needed. Never from memory, never from an earlier conversation,
never inferred from the job ad.

---

## The data root

```
~/Documents/Jobs/
├── CV/
│   ├── FROZEN-FACTS.md              ← the single authority
│   ├── personal/resume/
│   │   ├── resume-data.yaml           identity, skills inventory
│   │   ├── qiankun-resume.typ         working CV
│   │   └── qiankun-resume-{trading,quant,fintech,buyside}.typ
│   ├── qiankun-resume.typ           working CV (root copy)
│   ├── Project Bank.md              projects not on the one-pager
│   └── lib/resume.typ               the Typst template
├── <Company>/                       per-application artifacts
└── job_search_tracker.csv           the application funnel
```

`FROZEN-FACTS.md` carries its own source-precedence table and its own list of
unresolved discrepancies. Read it first; it resolves conflicts between the
other files, and it is the file that gets updated when a fact changes.

---

## Frozen facts

Facts are frozen; framing is free.

A number that appears in `FROZEN-FACTS.md` must appear identically in every
document. If tailoring would change one, that is an error — go back to the
source rather than adjusting the number to fit the ad.

What *is* free is the label around the fact. One role can be truthfully
presented as *Derivatives Trading*, *Front Office Partnership*, *LNG Trading &
Financial Analysis*, or *Client Trading Support & Execution*, each leading with
what a different desk cares about. That is reframing, not re-facting.

`FROZEN-FACTS.md` also records qualifiers that must travel with specific
numbers (for example, a backtest figure that must always be labelled
in-sample). Those qualifiers are part of the fact, not optional decoration.

## Never invent

An achievement that is not in the sources does not exist for drafting purposes.
This is deliberately strict, and it has a cost: a real achievement mentioned
only in conversation will be treated as unsupported and stripped. That cost is
accepted because the audit cannot tell an invention from an unrecorded truth.

The five-minute test: if a bullet could not be defended under five minutes of
hostile follow-up, it is a fabrication regardless of how well it matches the ad.

## Write new facts back

When the user confirms, corrects or supplies a fact that is not in the sources,
write it to `~/Documents/Jobs/CV/FROZEN-FACTS.md` **in the same turn**.

Not bookkeeping. A fact left in the chat log is invisible to the next session's
grounding audit and disappears silently from every subsequent draft. If the new
fact contradicts something in a `.typ` variant or `resume-data.yaml`, fix it
there too rather than leaving the sources disagreeing.

If a fact is uncertain, add it to the "Unresolved discrepancies" table in
`FROZEN-FACTS.md` instead of to the main tables. Unresolved facts never reach a
CV.

## In-progress qualifications

State qualifications in progress as in progress. A degree with an end date in
the future is "expected <date>" or "in progress", never presented as held.
Check any tenure or completion claim against the dates in `FROZEN-FACTS.md`
before it goes in a document.
