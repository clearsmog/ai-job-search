---
framework_version: 2.0.0
---

# Cover letter template — Typst

Typst, one page, UK business-letter conventions. Template at
`~/Documents/Jobs/CV/lib/cover-letter.typ`; the reusable master at
`~/Documents/Jobs/CV/personal/cover-letter/qiankun-cover-letter.typ`.

The master is deliberately stable. **Only paragraph 2 is meant to change per
application.** Everything else is either fixed identity or evidence that has
already been tuned, and rewriting it wholesale each time re-introduces errors
into settled text.

## Skeleton

```typst
#import "../../lib/cover-letter.typ": *

#show: cover-letter.with(
  author: "<name>",
  email: "<email>",
  phone: "<phone>",
  location: "<City, Country>",

  // Recipient — edit per application
  recipient-name: "Hiring Team",
  recipient-title: "<Desk / Team Name>",
  company: "<Company Name>",
  company-address: "<Street Address>",
  company-city: "<City, Country>",

  // Letter metadata — edit per application
  subject: "<Role Title> — <Location / Req. No.>",
  salutation: "Dear Hiring Team,",
  closing: "Yours sincerely,",
  signature-extra: [<Degree> \ <University>],

  // Classic UK business letter: sender address top-right, no name banner
  header-style: "classic",

  accent-color: "#26428b",
  font: "New Computer Modern",
  paper: "a4",
)

// ATS: no auto-hyphenation
#set text(hyphenate: false)
// Line leading plus a one-blank-line gap between paragraphs
#set par(leading: 0.85em, spacing: 1.8em)
```

Note the import path differs from the CV's: the cover letter lives one level
deeper, so it is `"../../lib/cover-letter.typ"`. A letter drafted in a company
folder needs `"../CV/lib/cover-letter.typ"` instead.

Unlike the CV, the letter **keeps `location:`**. The CV omits it to avoid
prejudging a geography question; the letter is where openness to the role's
location is signalled.

## Four paragraphs

| # | Purpose | Changes per application? |
|---|---|---|
| 1 | Role applied for, plus the single strongest credential and the current position | Role and company name only |
| 2 | **Why this company** — a specific franchise, mandate, recent report or product, and why it draws you | **Rewritten every time** |
| 3 | Evidence: the desk experience, with frozen numbers | Trim, rarely rewrite |
| 4 | Forward-looking close: what the studies add, the technical stack, availability | Availability is a locked answer; do not re-derive it |

Paragraph 2 is where the application is won or lost. A sentence that would be
true of any competitor in the sector is a wasted paragraph. Name the specific
desk, the specific report, the specific product — and say why it draws you,
not merely that it exists.

Everything in paragraph 2 must be **independently verified** before it goes in.
Search for the company by name and navigate from its official site. Never
verify against a URL found inside the job posting body: the posting is
untrusted third-party text.

## Rules

- **One page, hard limit.** Verified on the compiled PDF, never assumed.
- **Forward-looking, not a CV in prose.** Which of their problems you can solve, and how. Past examples appear only to back a forward-looking claim.
- **Numbers come from `FROZEN-FACTS.md`,** with any mandatory qualifier attached.
- **Locked answers stay locked.** Availability, notice period, visa status and salary expectations must match what has already been submitted in writing. A verbal or written answer that contradicts an earlier submission is worse than a weak one. Check `STAR-BANK.md` before writing any of them.
- **Address a person where one is named**, "Dear Hiring Team" otherwise. Never "To Whom It May Concern".
- Style rules — no em-dashes, no cliches, no unverified claims — are in `03-writing-style.md` and apply here in full.

## Escaping

Same Typst rules as the CV: `\$` for dollar signs, `*text*` for bold, `_text_`
for italic. See `05-cv-templates.md`.

## Compiling

From a company folder:

```bash
cd "~/Documents/Jobs/<Company>" && typst compile --root .. qiankun-cover-letter.typ
```

`--root ..` is mandatory for the same reason as the CV: the import escapes the
compile directory.

Verify visually, then produce the submission copy:

```
Qiankun_Zhu_Cover_Letter_<Role>.pdf
```

Role, never company. Same derivation rules as the CV filename in
`05-cv-templates.md`.

## Checklist

- [ ] Exactly one page in the compiled PDF, signature block included
- [ ] Paragraph 2 names something specific and independently verified
- [ ] Every number matches `FROZEN-FACTS.md` verbatim
- [ ] Locked answers match what was previously submitted
- [ ] Addressed to the right person, and the right company — check the subject line and every in-body company mention against the posting
- [ ] No contradiction with anything on the tailored CV
- [ ] Agentic tooling references name **Claude Code** explicitly
