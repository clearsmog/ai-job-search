---
name: reed-search
version: 1.0.0
description: >
  Use this skill to search live UK job listings on reed.co.uk, one of the
  largest general job boards in the UK, or to look up a specific Reed posting.
  Broad coverage across sectors and seniorities, with salary figures on most
  listings. Trigger phrases: find a job in the UK, UK job search, jobs in
  London, graduate jobs UK, "are there any <role> jobs in <UK city>", search
  Reed, look up this reed.co.uk posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/reed-search/cli/src/cli.ts *)
---

# Reed Search Skill

Searches **[reed.co.uk](https://www.reed.co.uk)** by scraping its public search
and job pages. No account, no API key, zero runtime dependencies.

## Usage

```bash
bun run .agents/skills/reed-search/cli/src/cli.ts search --query "<terms>" [options]
bun run .agents/skills/reed-search/cli/src/cli.ts detail <job-id-or-url>
```

### Search flags

| Flag | Meaning |
|---|---|
| `-q`, `--query <terms>` | **Required.** Keywords, e.g. `"market risk"` |
| `-l`, `--location <place>` | Town, city or region, e.g. `"London"` |
| `--jobage <days>` | Only jobs posted within N days |
| `-p`, `--page <n>` | 1-indexed page (default 1) |
| `-n`, `--limit <n>` | Cap results client-side |
| `--format <fmt>` | `json` (default), `table`, `plain` |

### Examples

```bash
# Energy trading risk roles in London, posted this week
bun run .agents/skills/reed-search/cli/src/cli.ts search \
  -q "market risk energy trading" -l London --jobage 7

# Second page, human-readable
bun run .agents/skills/reed-search/cli/src/cli.ts search \
  -q "commodity analyst" -l London -p 2 --format table

# Full description and structured salary for one job
bun run .agents/skills/reed-search/cli/src/cli.ts detail 57082167
```

## Output

`search` returns `{query, location, page, count, results[]}`. Each result:
`id`, `title`, `company`, `location`, `date` (ISO), `url`, `salary`, `job_type`.
Missing values are `null`, never omitted.

`detail` adds `employment_type`, `salary_min`, `salary_max`, `salary_currency`,
`valid_through` and the full `description`.

Errors go to stderr as `{"error": "...", "code": "..."}` with exit code 1.

## How it parses, and what that means for maintenance

Two different strategies, each chosen from what the page actually serves:

- **Search results** are read from `data-qa` attributes. Those are QA test
  hooks rather than styling, so they survive CSS refactors. Reed's class names
  are hashed CSS-module output (`index-module_jobTitle__702ZU`) that changes on
  every build — never key on them.
- **Job pages** are read from schema.org `JobPosting` JSON-LD, the most stable
  target available: it is a published contract for search engines, so Reed has
  an incentive to keep it correct.

**Verified quirks** (each established against the live site, not assumed):

- Reed only honours its **slug URL form** (`/jobs/market-risk-jobs-in-london`).
  The query-string form returns a page with zero job cards. The CLI builds
  slugs for you.
- `?pageno=N` paginates; a page holds **25 results**.
- Cards use three date formats — `2 July`, `Today`/`Yesterday`, and `4 hrs ago`.
  The elapsed form appears on the freshest listings, which is exactly what a
  scrape cares about most.
- `--jobage` maps onto the site's fixed buckets (1, 3, 7, 14 days). Beyond 14
  days the filter is dropped rather than faked.

If the search returns **zero cards on a page that is not an explicit
"no results" page, the CLI raises an error** instead of reporting an empty
portal. A silent zero reads as "nothing new today" and would hide a broken
parser for weeks.

## Not used: the official API

Reed runs a Jobseeker API (`/api/1.0/search`, HTTP Basic with a free key).
It is not used here because it requires registering an account, and this
skill's contract is that it works on a fresh clone with nothing but `bun`.
If a key becomes available, `REED_API_KEY` is the natural place to add that
path — it would be more robust than scraping.

## Terms of use

Personal-use scraping at human rates. The CLI sends a normal browser
User-Agent, backs off on 429/5xx, and makes one request per search page. Do not
wire it into automated high-frequency polling.
