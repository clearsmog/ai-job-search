# ai-job-search

A job application pipeline that runs on Claude Code. Hard fork of
[MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search),
rebuilt around a Typst one-page CV and the UK energy-trading and risk market.

[![CI](https://github.com/clearsmog/ai-job-search/actions/workflows/ci.yml/badge.svg)](https://github.com/clearsmog/ai-job-search/actions/workflows/ci.yml)

> Independent project, not affiliated with or endorsed by Anthropic. Anthropic
> and Claude Code are named only to describe the toolchain.

---

## What it does

```
/scrape ──▶ /rank ──▶ /apply <url> ──▶ /outcome ──▶ /interview ──▶ /outcome
 find       triage      the main event      log        prep pack      result
                             │
        ┌────────────────────┴────────────────────┐
        │ 1 extract   <Role>-<Company>.md         │  JD, employer's headings verbatim
        │ 2 gate      work authorisation, location│  cheap; kills bad roles early
        │ 3 research  Research-<Role>.md          │  entity, desk, strategy
        │             *People-LinkedIn.md         │  hiring team, logged-in browser
        │             Sector-<Sector>.md          │  market landscape, data root, reused
        │ 4 audit     CV-JD-AUDIT.md              │  match matrix + integrity risks
        │ 5 tailor    qiankun-resume.typ          │  reframed, never re-facted
        │ 6 review    adversarial + grounding     │  ungrounded claims deleted
        │ 7 compile   Qiankun_Zhu_CV_<Role>.pdf   │  exactly 1 page, verified
        │ 8 report    + tracker row               │
        └─────────────────────────────────────────┘
```

The gate runs **before** the research, because research is the expensive stage
and a role that fails work authorisation is not worth a subagent. The audit
runs **before** the CV is touched, because that converts "make it more
relevant" into a named list of fixes.

## Doctrine

Four rules decide most of what the pipeline does.

1. **One document sells one capability.** UK employers hire specialists. The majority of the page argues for this one role; everything else compresses to a line. Two roles at one company means two CVs.
2. **Facts are frozen; framing is free.** Every number comes from one file and is identical across variants. The label around it is free to change; the number is not.
3. **Gaps get honest language, never invented experience.** Every audit carries an "Integrity risks — do not claim" table. A bullet that could not survive five minutes of hostile follow-up is a fabrication, however well it matches the ad.
4. **Echo the employer's own vocabulary.** An ATS matches keywords and a human recognises their own words. Both reward lifting phrases verbatim from the ad — which is why JD extraction preserves the employer's headings unchanged.

## No personal data in this repo

It is public. Facts, drafts and application artifacts live outside it:

```
~/Documents/Jobs/CV/FROZEN-FACTS.md      every number, with its qualifiers
~/Documents/Jobs/CV/STAR-BANK.md         stories, locked answers, debriefs
~/Documents/Jobs/<Company>/              one folder per application
~/Documents/Jobs/job_search_tracker.csv  the funnel
```

This is not only a privacy measure. Duplication is the enemy of frozen facts:
one authority, read at draft time, is what stops a number drifting between
variants.

`tools/security_guards.py` fails CI on any change that widens the pre-approved
permission set or weakens the personal-data ignore rules.

## Commands

| Command | Does |
|---|---|
| `/facts` | Sweep every source, find drift and unrecorded facts, reconcile the record |
| `/scrape` | Search the installed portals |
| `/rank` | Batch-score scraped postings into a shortlist |
| `/apply <url>` | The eight-stage pipeline for one posting |
| `/outcome` | Record what happened; maintain the tracker |
| `/mail-sync` | Read Apple Mail for status signals; propose tracker updates |
| `/interview <company>` | Build an interactive HTML prep pack for one round |
| `/upskill` | Cross-application skill-gap analysis from real audit verdicts |
| `/html-report` | Dashboard over the tracker |
| `/expand` | Competency expansion from documents and online presence |
| `/add-portal` | Scaffold a new portal search CLI |
| `/add-template` | Register an alternative CV or letter template |

## Portals

| Source | Kind | Best for |
|---|---|---|
| `efinancialcareers-search` | CLI | The sector board: trading, commodities, risk, quant |
| `reed-search` | CLI | Largest UK general board; salary on most listings |
| `linkedin-search` | CLI | Reach and recency. Personal use only, per its own ToS note |
| `freehire-search` | CLI | Aggregator across ~50 ATS platforms, tech-first |
| Indeed | MCP | Official API integration — **deliberately not scraped** |

Both new CLIs parse structured data rather than CSS classes: `data-qa` hooks and
schema.org `JobPosting` JSON-LD on Reed, the embedded JSON payload on
eFinancialCareers. Each was built against the live sites, which is how several
traps got caught — Reed only honours its slug URL form, and eFinancialCareers
embeds a second array that looks richer but holds promoted listings unrelated to
the query.

When a results page yields nothing but is not an explicit "no results" page,
the CLIs **raise an error rather than returning empty**. A silent zero reads as
"nothing new today" and would hide a broken parser for weeks.

## Setup

See [SETUP.md](SETUP.md). Short version: Typst, Bun, Python, poppler. No LaTeX.

## Credit

The original framework, the drafter-reviewer pipeline, the portal-skill
contract and the security guards are [Mads Lorentzen's](https://github.com/MadsLorentzen/ai-job-search).
This fork keeps that architecture, replaces the Danish market and LaTeX stack,
and merges in a personal research-and-doctrine workflow. Licensed under the
same terms — see [LICENSE](LICENSE).
