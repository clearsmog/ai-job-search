# Search queries for the job scraper

Target market: **UK, London-centred**, energy trading and commodities, market
and credit risk, quantitative analysis. Adjust when the target changes.

## Sources, in the order `/scrape` should use them

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and
runs its CLI first. No `site:` line below is needed for those.

| Source | Kind | Best for |
|---|---|---|
| `efinancialcareers-search` | CLI | **The sector board.** Front and middle office, trading, commodities, risk, quant. Roles here often never reach general boards. |
| `reed-search` | CLI | Largest UK general board. Broad coverage, salary figures on most listings. |
| `linkedin-search` | CLI | Reach and recency; also where the hiring manager is visible. Personal use only per its own ToS note. |
| `freehire-search` | CLI | Aggregator across ~50 ATS platforms, tech-first — catches quant and data roles posted only on a company's own ATS. |
| **Indeed MCP** | MCP tools | `mcp__claude_ai_Indeed__search_jobs` / `get_job_details`. **Use this instead of scraping Indeed.** It is an official integration over Indeed's own API; scraping Indeed breaches its terms and hits heavy bot protection. Call with `country_code: "GB"`. |
| WebSearch `site:` | Fallback | Company career pages, and any portal without a CLI. |

## Query categories

Run the top three by default. Run all on "broad". On a focus area, prioritise
the matching category and generate 2–3 custom queries for it.

### Priority 1 — Market and credit risk in commodity trading

The strongest match and the stated career direction.

```
market risk analyst
credit risk analyst commodity
risk analyst energy trading
middle office analyst commodities
trade control analyst
```

WebSearch fallback:
```
site:efinancialcareers.co.uk "market risk analyst" London
site:linkedin.com/jobs "credit risk analyst" energy trading London
```

### Priority 2 — Energy, LNG, gas and power

Domain expertise, where the LNG and gas experience argues loudest.

```
LNG analyst
gas trading analyst
power trading analyst
energy trading analyst
commodity analyst
emissions carbon analyst
```

WebSearch fallback:
```
site:efinancialcareers.co.uk LNG OR "natural gas" analyst London
site:linkedin.com/jobs "energy trading" analyst London
```

### Priority 3 — Quantitative and data

Where the Python, modelling and FRM side leads.

```
quantitative analyst commodities
quantitative risk analyst
data analyst trading
model validation analyst
pricing analyst derivatives
```

### Priority 4 — Adjacent and broader

Wider net; expect lower fit scores.

```
trading operations analyst
settlements analyst commodities
product control analyst
treasury analyst energy
graduate scheme commodity trading
```

## Target employers for direct career-page checks

Energy majors and trading houses: Shell, BP, TotalEnergies, Eni, Equinor,
Centrica, Vitol, Trafigura, Gunvor, Mercuria, Glencore, Freepoint, Hartree,
Castleton Commodities, Petroineos, SEFE, Uniper, RWE, EDF Trading, Engie,
Axpo, Brook Green Supply, SmartestEnergy, Statkraft.

Banks and funds with commodity desks: Goldman Sachs, Morgan Stanley, JP Morgan,
Macquarie, Jefferies, BNP Paribas, Société Générale, Citi.

## Location filter

- **London** — the target. On-site and hybrid both fine.
- **Remote UK** — include.
- **Reading, Windsor, Slough, St Albans** and similar commuter towns — include, flag the commute.
- **Edinburgh, Aberdeen** — include; Aberdeen is a real energy hub, and Edinburgh is the current base until the London move.
- Elsewhere in the UK — include only on a strong fit, flagged as requiring relocation.
- Outside the UK — exclude unless it names visa sponsorship and relocation.

## Date filter

Only jobs posted within the last 14 days, or with an open deadline. Where a
posting date cannot be determined, include it and flag "date unknown".

**eFinancialCareers returns no date at search time** — its results payload omits
it and the site ignores every date-filter parameter. Either fetch `detail` for
the dates that matter or accept the whole page and let `/rank` sort it out. Do
not silently drop its results for having no date.

## Work-authorisation note

Sponsorship status gates hard and is checked in `/apply`, not here. But when a
posting states "no sponsorship" prominently, record that in the scrape notes so
`/rank` can weight it rather than discovering it at drafting time.
