# Setup

What this system needs to run, and how the pieces connect.

This is a hard fork of [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search),
rebuilt around a Typst one-page CV and the UK market. It does not track
upstream, and the original onboarding flow is gone — there is no `/setup`
interview, because the profile is not stored in this repo.

---

## The split

```
~/Documents/Jobs/                    ← private. Facts and artifacts.
├── CV/
│   ├── FROZEN-FACTS.md                every number, with its qualifiers
│   ├── STAR-BANK.md                   stories, locked answers, debriefs
│   ├── lib/resume.typ                 the Typst CV template
│   ├── lib/cover-letter.typ           the Typst letter template
│   ├── qiankun-resume.typ             working CV
│   └── personal/resume/               resume-data.yaml + sector variants
├── <Company>/                         one folder per application
├── job_search_tracker.csv             the funnel
└── ai-job-search/                   ← this repo. Public. Doctrine only.
```

**Run Claude from inside `ai-job-search/`.** Slash commands and skills are
project-scoped to the directory Claude is launched in. Artifacts still land in
`~/Documents/Jobs/<Company>/` because the commands write there by absolute
path.

Nothing personal belongs in this repo. It is a public GitHub fork.

## Prerequisites

| Tool | Why | Install |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) | Runs everything | — |
| [Typst](https://typst.app) 0.15+ | Compiles the CV and cover letter | `brew install typst` |
| [Bun](https://bun.sh) | The portal search CLIs | `curl -fsSL https://bun.sh/install \| bash` |
| Python 3.10+ | Repo tooling and tests | `brew install python` |
| [poppler](https://poppler.freedesktop.org/) | `pdftotext`, `pdfinfo` — the ATS text-layer check and page counts | `brew install poppler` |

There is **no LaTeX dependency**. The CV was moderncv upstream; it is Typst
here, and the whole TeX toolchain was removed.

`poppler` is optional in the sense that `/apply` degrades gracefully without
it, but the ATS check is one of the more valuable steps — install it.

## Install

```bash
git clone git@github.com:clearsmog/ai-job-search.git ~/Documents/Jobs/ai-job-search
cd ~/Documents/Jobs/ai-job-search

# Portal CLIs
for tool in efinancialcareers-search freehire-search linkedin-search reed-search; do
  (cd .agents/skills/$tool/cli && bun install)
done

# Python tooling. ~/Documents is iCloud, so the venv must not sync.
uv venv .venv.nosync && ln -s .venv.nosync .venv
uv pip install pyyaml openpyxl
```

Verify:

```bash
.venv/bin/python tools/lint_skills.py
.venv/bin/python tools/security_guards.py
.venv/bin/python -m unittest discover -s tests -t .
```

## Connected services

Some steps need integrations rather than installs.

| Service | Used by | Notes |
|---|---|---|
| **Claude in Chrome** | `/apply` Track B, `/interview` research | LinkedIn, Glassdoor and Blind return nothing useful without the real logged-in session — LinkedIn answers HTTP 999. Load the `claude-in-chrome` skill before calling its tools. |
| **Apple Mail MCP** | `/mail-sync` | Reads only. Prefers a dedicated job-mail account or folder over the general inbox. |
| **Indeed MCP** | `/scrape` | Official API integration. There is deliberately no Indeed scraper. |

If an integration is missing, the command that needs it says so and skips that
track. It never falls back to a headless fetch on a gated site: that returns an
error page which looks like a result and produces a confidently empty research
file.

## Salary benchmarking (optional)

`salary_lookup.py` reads a `salary_data.json` you supply. Without it, the
salary step in `/apply` is skipped rather than guessed. Format and conversion
notes in `tools/README_SALARY_TOOL.md`.

## Compiling a document by hand

```bash
cd "~/Documents/Jobs/<Company>"
typst compile --root .. qiankun-resume.typ
```

`--root ..` is **mandatory**. Without it the import escapes the project root
and the compile fails.

`warning: unknown font family: source sans pro` appears on every run and is
expected: neither Source Sans Pro nor Calibri is installed, so the stack falls
back to Helvetica. Do not chase it.

## First run

1. `/facts` — sweep every source and reconcile `FROZEN-FACTS.md`. Do this before drafting anything; it catches facts that exist in one tailored CV and nowhere else.
2. `/scrape` then `/rank` — find and triage postings.
3. `/apply <url>` — the full pipeline for one job.
4. `/outcome` — record what happened.
5. `/interview <company>` — build a prep pack when a round is scheduled.

## Troubleshooting

**`path "../CV/lib/resume.typ" would escape the project root`**
Missing `--root ..` on the typst command.

**A portal CLI errors about missing job cards or a missing payload**
The site changed its markup. That error is deliberate — the alternative is
reporting zero results, which reads as "nothing new today" and hides the
breakage. Refresh the fixture under that CLI's `tests/fixtures/` and fix the
parser.

**`tsc: command not found` on `bun run typecheck`**
Run `bun install` in that CLI's directory.

**LinkedIn or Glassdoor research comes back empty**
The browser session is not logged in. Sign in, then re-run that track.

**`/facts` reports drift you did not expect**
That is the point. A tailored CV probably gained a fact the base variants never
got. Confirm the value and let it write back.
