---
framework_version: 2.0.0
---

# CV template — Typst

The CV is Typst, one page, and lives outside this repo. The template is a local
fork of `basic-resume`, self-contained and importing nothing external, at
`~/Documents/Jobs/CV/lib/resume.typ`. Full component API in
`~/Documents/Jobs/CV/README.md`.

Examples below are structural. Real content comes from `FROZEN-FACTS.md`.

## The import path — do not touch

```typst
#import "../CV/lib/resume.typ": *
```

It resolves correctly from **both** locations by design:

| Editing from | Resolves to |
|---|---|
| `Jobs/<Company>/` | `Jobs/CV/lib/resume.typ` |
| `Jobs/CV/` | `Jobs/CV/../CV/lib/resume.typ`, the same file |

That is why a tailored CV can be copied between folders untouched. Do not
"fix" it to `./lib/`. Files under `CV/personal/resume/` use
`"../../lib/resume.typ"` instead.

## Skeleton

```typst
#import "../CV/lib/resume.typ": *

// =============================================================================
// VARIANT: <COMPANY> — <ROLE> (<location>, <desk>)
// <job ref> | <one-line targeting thesis>
// =============================================================================

#show: resume.with(
  author: "<name>",
  email: "<email>",
  linkedin: "<linkedin.com/in/handle>",
  phone: "<phone>",
  accent-color: "#26428b",
  font: ("Source Sans Pro", "Calibri", "Helvetica"),
  paper: "a4",
  author-position: center,
  personal-info-position: center,
  keywords: (
    "<the ad's vocabulary>", "<company name>", "<product/market terms>",
  ),
)

// Local spacing overrides — the one-page fitting knobs
#set par(leading: 0.72em)
#show list: set list(spacing: 0.75em, indent: 0em)
// ATS: no auto-hyphenation, so words are not broken by soft hyphens (U+00AD)
#set text(hyphenate: false)

== Profile
== Professional Experience
== Projects          // optional — only when it argues for this role
== Education
== Skills
```

Never write a level-1 `=` heading; the template emits the author name itself.
Section headings are literal `== Section Name`. The library has 16 `section-*()`
helpers that no real CV uses — do not start.

**Section order is a lever.** A variant whose degree is the stronger card puts
`== Education` before `== Professional Experience`.

**Omit `location:` entirely.** Drop the argument from the `resume.with(...)`
call; the template filters the empty field cleanly, with no dangling separator.
No city, no postcode, no relocation or hybrid suffix. Openness to the role's
location belongs in the cover letter, not the CV header.

## Components

### Work

Bullets are **not a parameter**. They are plain `- ` lines placed *after* the
call.

```typst
#work(
  title: "<Job Title>",
  location: "<Country>",
  company: "<Company Name>",
  dates: dates-helper(start-date: "May 2024", end-date: "Aug 2025"),
)
- *Category Label*: Sentence carrying the frozen numbers, escaped as \$1B+ where needed.
- *Another Label*: Second bullet.
```

Every bullet opens with a bolded `*Category*:` label. **That label is the main
tailoring surface** — re-labelling it in the ad's language wins more match than
rewriting the sentence behind it.

### Project

```typst
#project(
  name: "<Project> (<stack>)",
  dates: dates-helper(start-date: "2026", end-date: "Present"),
)
- One or two lines. Source: <repo url, if public>
```

### Education

The current dialect uses `#generic-one-by-two` plus a following plain
paragraph. One line rather than `#edu()`'s two-line block, which saves vertical
space:

```typst
#generic-one-by-two(
  left: strong("<Degree>") + " — <Institution>",
  right: emph("<Country> · " + dates-helper(start-date: "Sep 2025", end-date: "Present")),
)

Relevant Modules: <reordered per application, irrelevant ones pruned>
```

State an unfinished degree as unfinished, and check the claim against the dates
in `FROZEN-FACTS.md` before writing it.

### Skills

```typst
== Skills

- *<Most role-relevant bucket first>*: ...
- *Platforms*: ...
- *Qualifications & Languages*: ...
```

Restructure the buckets per role so the most relevant category leads. Match the
ad's exact words where truthful. Drop irrelevant entries rather than carrying
them.

### Other components

`certification` (alias `certificates`), `extracurriculars`, `summary`,
`language-entry`, `award`, `publication`, plus the layout primitives
`generic-two-by-two(top-left:, top-right:, bottom-left:, bottom-right:)` and
`generic-one-by-two(left:, right:)`. Signatures in `CV/README.md`.

## Escaping and gotchas

| Issue | Rule |
|---|---|
| Dollar signs | `\$1B+` — a bare `$` opens Typst math mode |
| Em-dash in prose | Literal `—` or `--` |
| Em-dash in dates | `dates-helper()` handles it (emits math `$dash.em$`, ligatures being off) |
| Ampersand | Bare `&` is fine in body text |
| Bold | `*text*`, not `**text**` |
| Italic | `_text_` or `emph()` |
| Missing required field | Template panics: `work: 'title' is required but was empty` |
| `paper:` | Only `"a4"` or `"us-letter"`; anything else panics |

## The nine tailoring edits

Roughly in order of leverage.

1. **Variant banner** — rewrite the `// VARIANT:` comment: company, role, location, job ref, and a one-line targeting thesis. This is the file's memory of *why* it looks the way it does.
2. **`keywords:` array** — swap wholesale for the ad's vocabulary. Invisible PDF metadata that ATS reads. Include the company name, product and market terms, and the ad's soft-skill phrases.
3. **`location:`** — omit entirely, per above.
4. **`== Profile`** — rewrite end to end, closing with an explicit target sentence: *"Seeking a `<Role>` role in `<domain>`."* Never leave the previous application's profile in place.
5. **Bullet labels** — re-label the bolded `*Category*:` lead-ins in the JD's language. Most of the match is won here.
6. **Bullet content** — re-angle toward the target, echoing the ad's phrases. Numbers unchanged.
7. **Promote, demote, drop** — expand what is relevant, compress the irrelevant role to a single unlabelled line, drop dead weight. Pull in a project from `Project Bank.md` when it argues for this role.
8. **Skills** — reorder buckets so the most relevant leads; match the ad's exact wording; prune.
9. **Education modules** — reorder so relevant modules come first; prune the rest.

**Start by copying**, never by typing from memory. Copy the closest existing
variant into the company folder as `qiankun-resume.typ`. The working CV's banner
and Profile reflect the *last* job tailored, so discard that framing every time.

**Check the starting point's page count before editing it.** A source file that
already spills to two pages hands you a content-cutting problem on top of a
tailoring problem, and the two get confused: squeezing typography to rescue a
page then reads as a layout fix when it is really an un-made editorial decision.
Compile the candidate starting point first, and prefer one that is already one
page — a sector variant usually is, where the working CV may not be.

## Compiling

```bash
cd "~/Documents/Jobs/<Company>" && typst compile --root .. qiankun-resume.typ
```

`--root ..` is **mandatory**. Without it:

```
error: path "../CV/lib/resume.typ" would escape the project root
```

Expected on every run and harmless — neither font is installed, so the stack
falls back to Helvetica:

```
warning: unknown font family: source sans pro
```

Do not chase it.

Visual check, because layout breaks do not appear in source:

```bash
typst compile --root .. --format png --ppi 120 qiankun-resume.typ /tmp/cv-{p}.png
```

## One page, exactly

Content cuts come first, mechanical squeeze second. Observed ladder from real
applications:

| Step | `par(leading)` | `list(spacing)` | `font-size` |
|---|---|---|---|
| Comfortable (default) | 0.72em | 0.75em | 10pt |
| Moderate | 0.54em | 0.50em | 10pt |
| Tight | 0.52em | 0.46em | 10pt |
| Floor | 0.50em | 0.40em | 9.5pt + `author-font-size: 18pt` |

Do not go below the floor. Past it the page reads as cramped and the ATS gains
nothing. **If it still overflows at the floor, the CV is carrying content that
doctrine 1 says should have been cut** — go back and cut it.

## Two dialects

Both compile; know which is being edited.

- **Dialect A — YAML hybrid** (`CV/personal/resume/`, older): loads `resume-data.yaml` for identity and settings, uses `#edu(...)`, generates Skills with a `#for` loop.
- **Dialect B — standalone** (`CV/qiankun-resume.typ` and every company folder, current): everything inline, no YAML, adds `keywords:` and `== Profile`, uses `#generic-one-by-two` for education, carries local spacing overrides.

**Write dialect B.** Dialect A files are useful as a source of alternative
framings, but output matches the current convention.

`CV/personal/resume/StephenXu.typ` is someone else's CV using the external
`@preview/basic-resume` package. Not part of this pipeline; ignore it.

## Submission filename

`qiankun-resume.pdf` is the working artifact: fine on disk, wrong to submit. It
carries no surname, so it cannot be matched to an ATS record or sorted in a
recruiter's downloads; it is identical for every application, so two collide;
and "resume" is American where this market says CV.

Always also produce:

```
Qiankun_Zhu_CV_<Role>.pdf
Qiankun_Zhu_Cover_Letter_<Role>.pdf
```

**Role, never company.** A recruiter running several openings can route the file
without opening it, whereas the company name is redundant to them and is the one
field where a copy-paste slip is fatal: a CV named for the wrong employer ends
the application.

Deriving `<Role>` from the posted title:

- Strip parentheticals and legal boilerplate — `Credit Risk Analyst (m/f/d)` becomes `Credit_Risk_Analyst`
- Strip req numbers, location suffixes, seniority codes
- Otherwise keep the employer's own wording; do not paraphrase their title
- Spaces to underscores; drop `&`, `/`, `,`
- Past roughly 60 characters, abbreviate the least load-bearing words (`Quantitative` to `Quant`) rather than dropping the role

| Posted title | Submission filename |
|---|---|
| Credit Risk Analyst (m/f/d) | `Qiankun_Zhu_CV_Credit_Risk_Analyst.pdf` |
| LNG Trading Analyst | `Qiankun_Zhu_CV_LNG_Trading_Analyst.pdf` |
| Quantitative Risk and Data Analyst | `Qiankun_Zhu_CV_Quant_Risk_and_Data_Analyst.pdf` |

Keep `qiankun-resume.typ` / `.pdf` as the working pair; the folder already says
which company it belongs to.
