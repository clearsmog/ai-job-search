---
name: efinancialcareers-search
version: 1.0.0
description: >
  Use this skill to search live finance job listings on efinancialcareers.co.uk,
  the main vertical job board for banking, trading, commodities, risk, quant and
  asset management roles in the UK and globally. Best source for front- and
  middle-office roles that never appear on general boards. Trigger phrases:
  finance jobs, banking jobs, trading jobs, commodities jobs, market risk roles,
  quant jobs, buy-side jobs, "are there any <finance role> jobs in <city>",
  search eFinancialCareers, look up this efinancialcareers posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/efinancialcareers-search/cli/src/cli.ts *)
---

# eFinancialCareers Search Skill

Searches **[efinancialcareers.co.uk](https://www.efinancialcareers.co.uk)** by
reading the JSON payload its pages already embed. No account, no API key, zero
runtime dependencies.

This is the sector-specific board: market risk, commodities, trading, quant and
asset-management roles concentrate here in a way they do not on general boards.

## Usage

```bash
bun run .agents/skills/efinancialcareers-search/cli/src/cli.ts search --query "<terms>" [options]
bun run .agents/skills/efinancialcareers-search/cli/src/cli.ts detail <job-url>
```

### Search flags

| Flag | Meaning |
|---|---|
| `-q`, `--query <terms>` | **Required.** Keywords, e.g. `"market risk"` |
| `-l`, `--location <place>` | City or region, e.g. `"London"` |
| `-p`, `--page <n>` | 1-indexed page (default 1) |
| `-n`, `--limit <n>` | Cap results client-side |
| `--format <fmt>` | `json` (default), `table`, `plain` |

There is deliberately **no `--jobage`**. See "Verified quirks" below.

### Examples

```bash
# Commodity market risk roles in London
bun run .agents/skills/efinancialcareers-search/cli/src/cli.ts search \
  -q "market risk commodities" -l London --format table

# Full description for one job — pass the URL search returned
bun run .agents/skills/efinancialcareers-search/cli/src/cli.ts detail \
  "https://www.efinancialcareers.co.uk/jobs-United_Kingdom-London-Market_Risk_Quant.id24582893"
```

## Output

`search` returns `{query, location, page, count, results[]}`. Each result:
`id`, `title`, `company`, `location`, `date`, `url`, `salary`, `job_type`.
Missing values are `null`, never omitted.

`detail` adds `employment_type`, `valid_through` and the full `description`.

Errors go to stderr as `{"error": "...", "code": "..."}` with exit code 1.

## Verified quirks

Each established against the live site, not assumed.

**Read `"jobs"`, never `"data"`.** The results page embeds two arrays. `"data"`
looks richer — it carries `posted_date` and full descriptions — but its contents
are **promoted listings unrelated to the query**: a search for "market risk"
finds "Junior Investment Manager" and "DevOps Engineer" in there. `"jobs"` holds
the actual results. Using `"data"` would return the wrong jobs with confident
dates attached, which is worse than returning nothing. A test covers this.

**Search results carry no posting date.** The `"jobs"` payload omits it, and
every date-filter parameter tried against the site (`dateposted`, `date_posted`,
`postedDate`, `days`) is ignored — all return the same unfiltered 15 results.
So `date` is `null` from `search`, and `--jobage` is **rejected rather than
silently accepted**: a caller that passed it and got unfiltered results back
would believe it had filtered them. Get dates from `detail`, and filter by age
in the caller.

**`page` paginates; `pageNum` does not.** `pageNum` looks plausible and is
silently ignored, returning page 1 again — a paginated scrape using it would
loop over identical results forever. A page holds **15 results**.

**`detail` wants a URL.** Job pages live at slug-heavy paths
(`/jobs-United_Kingdom-London-<Title>.id24582893`) that cannot be derived from
the numeric id, so a bare id falls back to an id-only URL that usually 404s.
Pass the URL `search` returned.

**"Competitive" is not a salary.** The site uses it, plus "Negotiable" and bare
currency symbols like `£/annum`, as placeholders for undisclosed pay. These are
normalised to `null` so a row does not look like it carried compensation data.

If the `"jobs"` payload is **missing on a page that is not an explicit
"no results" page, the CLI raises an error** rather than reporting an empty
portal. A silent zero would hide a broken parser for weeks.

## Terms of use

Personal-use scraping at human rates. The CLI sends a normal browser
User-Agent, backs off on 429/5xx, and makes one request per search page. Do not
wire it into automated high-frequency polling.
