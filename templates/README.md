# templates/

Holds user-registered CV or cover-letter templates managed by `/add-template`.

**Normally empty, and that is correct.** The active CV and cover-letter
templates are Typst and live outside this repo at `~/Documents/Jobs/CV/lib/`,
described natively in `05-cv-templates.md` and `06-cover-letter-templates.md`.
Nothing needs registering to use them.

This folder only gains content if a *second* template is registered — trying an
alternative Typst theme, say, or a LaTeX variant for an employer that demands
one. Registering writes a `TEMPLATE.md` manifest here and inserts an
`ACTIVE-TEMPLATE` block into the matching guidance file, which then overrides
the Typst guidance for as long as it is active.

```
templates/
└── cv/
    └── <name>/
        ├── TEMPLATE.md   compile command, fonts, page limit, known pitfalls
        └── template.typ  the skeleton
```

Switch back with `/add-template --use default`, which removes the override
block and returns control to the Typst guidance.
