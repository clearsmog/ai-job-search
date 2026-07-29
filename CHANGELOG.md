# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**This is a hard fork and no longer tracks upstream.** Entries below the fork
point are upstream's history, kept for provenance. `framework_version` markers
on methodology files still record which revision of each file is in use, but
there is no merge path back to
[MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search).

## [Fork] - 2026-07-28

Hard fork, personalised for a UK energy-trading and risk job search.

### Changed
- CV and cover letter are **Typst, one page**, living outside the repo at `~/Documents/Jobs/CV/`. The moderncv/`cover.cls` LaTeX stack was removed entirely.
- Profile split: this repo holds doctrine and workflow only. Every fact lives in `~/Documents/Jobs/CV/FROZEN-FACTS.md`, outside a public repo, and is the single authority all documents are drafted from.
- `/apply` rebuilt into eight stages, merging the drafter-reviewer loop with a research-and-audit pipeline. Work-authorisation and location gates now run **before** the research stage.
- `/interview` rebuilt to produce an interactive HTML prep pack per round.
- `/upskill` now ranks gaps by audit evidence rather than re-deriving requirements from job titles.
- Tracker and per-application archives moved to `~/Documents/Jobs/`.

### Added
- `/facts` — reconciles every fact source, finding drift, unrecorded facts and stale commitments.
- `/mail-sync` — replaces `/gmail-sync`, backed by the Apple Mail MCP.
- `reed-search` and `efinancialcareers-search` portal CLIs, both parsing structured data and both verified against the live sites.
- Indeed routed through its official MCP rather than a scraper.

### Removed
- The four Danish portal skills, `/setup`, `/reset`, `documents/`, and the LaTeX toolchain.
- `/notion-sync`. The Notion MCP server was never connected, so the command only ever
  reached its preflight exit. `/html-report` keeps the deep-review lane; the glanceable
  lane is a published Artifact, which needs no third-party server.

## [Unreleased]

- **Custom templates: any compile-to-PDF toolchain (Typst, ...)** - `/add-template` no longer
  hardcodes a `lualatex`/`xelatex`/`pdflatex` engine enum. Custom templates now declare a
  source extension and a full compile command, so Typst (`typst compile`) registers the same
  way a custom LaTeX template does. Stock CV/cover letter templates stay LaTeX, unchanged.

## [1.0.0] - 2026-07-22

First tagged release. This marks the framework as stable and gives forks a described
checkpoint to update against instead of a moving `master`. It is a baseline of what
already exists rather than a set of new changes; subsequent releases will document
what changed since the previous tag.

At this baseline the framework provides:

- **Application workflow** - a drafter/reviewer `/apply` pipeline (CV + cover letter),
  plus `/setup`, `/scrape`, `/rank`, `/interview`, `/outcome`, `/upskill`,
  `/expand`, `/html-report`, `/gmail-sync`, `/notion-sync`, `/add-portal`,
  `/add-template`, and `/reset`.
- **Portal search skills** - country-agnostic job-board CLIs (LinkedIn, freehire, and
  the Danish boards) in the portable Agent Skills format under `.agents/skills/`,
  discovered and orchestrated by `/scrape`, with an `enabled:` toggle for skipping
  portals.
- **Framework versioning** - `framework_version` markers on methodology files plus
  `tools/check_framework_version.py` (CI guard) and `tools/check_upstream_updates.py`
  (fork-side update preview).
- **Privacy and safety guards** - `.gitignore` protection for personal data, the
  `tools/security_guards.py` allowlist for `.gitignore` negations, and a CI policy of
  making no live portal requests.
- **Cross-runtime support** - a root `AGENTS.md` pointer so Codex and Antigravity can
  discover the portable portal skills, with Claude Code as the reference runtime.

[Unreleased]: https://github.com/MadsLorentzen/ai-job-search/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/MadsLorentzen/ai-job-search/releases/tag/v1.0.0
