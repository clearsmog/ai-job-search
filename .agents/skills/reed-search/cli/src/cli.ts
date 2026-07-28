#!/usr/bin/env bun
// Self-contained CLI for searching reed.co.uk. No CLI framework, zero runtime
// dependencies, so it runs on a fresh clone with nothing but `bun`.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { writeError, type JobResult } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

const ALIAS: Record<string, string> = { q: "query", l: "location", n: "limit", p: "page" }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("-")) {
      ;(flags._ as string[]).push(a)
      continue
    }
    const name = a.replace(/^-+/, "")
    const key = ALIAS[name] ?? name
    const next = argv[i + 1]
    let value: string | boolean = true
    if (next !== undefined && !next.startsWith("-")) {
      value = next
      i++
    }
    flags[key] = value
  }
  return flags
}

function stringFlag(raw: unknown): string | undefined {
  return typeof raw === "string" ? raw : undefined
}

/** A positive integer flag. Rejects junk loudly rather than silently defaulting. */
function intFlag(raw: unknown, name: string): number | undefined {
  if (raw === undefined || raw === true) return undefined
  const s = String(raw)
  if (!/^\d+$/.test(s)) throw new Error(`--${name} must be a positive integer (got "${s}")`)
  const n = parseInt(s, 10)
  if (n < 1) throw new Error(`--${name} must be at least 1 (got ${n})`)
  return n
}

const USAGE = `reed-search - search reed.co.uk

Usage:
  reed-search search --query <terms> [--location <place>] [options]
  reed-search detail <job-id-or-url>

Search options:
  -q, --query <terms>     Required. Keywords, e.g. "market risk"
  -l, --location <place>  Town, city or region, e.g. "London"
      --jobage <days>     Only jobs posted within N days (site buckets:
                          1, 3, 7, 14; beyond that the filter is dropped)
  -p, --page <n>          1-indexed page (default 1)
  -n, --limit <n>         Cap results client-side (a page holds 25)
      --format <fmt>      json | table | plain (default json)

Notes:
  Reed serves 25 results per page and only honours its slug URL form, so
  --query and --location are converted into a path, not a query string.
`

function formatTable(results: JobResult[]): string {
  if (!results.length) return "(no results)"
  const rows = results.map((r) => [
    r.id,
    (r.title ?? "").slice(0, 46),
    (r.company ?? "-").slice(0, 26),
    (r.location ?? "-").slice(0, 22),
    r.date ?? "-",
  ])
  const head = ["ID", "TITLE", "COMPANY", "LOCATION", "POSTED"]
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join("  ").trimEnd()
  return [line(head), line(widths.map((w) => "-".repeat(w))), ...rows.map(line)].join("\n")
}

function formatPlain(results: JobResult[]): string {
  if (!results.length) return "(no results)"
  return results
    .map((r) =>
      [
        r.title,
        `  ${r.company ?? "-"} · ${r.location ?? "-"}${r.salary ? ` · ${r.salary}` : ""}`,
        `  ${r.date ?? "-"}  ${r.url}`,
      ].join("\n"),
    )
    .join("\n\n")
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const positional = flags._ as string[]
  const command = positional[0]

  if (!command || flags.help === true || flags.h === true) {
    process.stdout.write(USAGE)
    return command ? 0 : 1
  }

  const format = stringFlag(flags.format) ?? "json"
  if (!["json", "table", "plain"].includes(format)) {
    writeError(`--format must be json, table or plain (got "${format}")`, "INVALID_FLAG")
    return 1
  }

  if (command === "search") {
    const query = stringFlag(flags.query)
    if (!query) {
      writeError("search requires --query/-q", "MISSING_ARG")
      return 1
    }
    const opts: SearchOpts = {
      query,
      location: stringFlag(flags.location),
      page: intFlag(flags.page, "page"),
      limit: intFlag(flags.limit, "limit"),
      jobAge: intFlag(flags.jobage, "jobage"),
    }
    const out = await runSearch(opts)
    if (format === "json") process.stdout.write(JSON.stringify(out, null, 2) + "\n")
    else if (format === "table") process.stdout.write(formatTable(out.results) + "\n")
    else process.stdout.write(formatPlain(out.results) + "\n")
    return 0
  }

  if (command === "detail") {
    const id = positional[1] ?? stringFlag(flags.id)
    if (!id) {
      writeError("detail requires a job id or URL", "MISSING_ARG")
      return 1
    }
    const opts: DetailOpts = { id }
    const out = await runDetail(opts)
    if (out === null) {
      writeError(`no Reed job found for "${id}" (expired or wrong id)`, "NOT_FOUND")
      return 1
    }
    if (format === "json") process.stdout.write(JSON.stringify(out, null, 2) + "\n")
    else {
      process.stdout.write(
        [
          out.title,
          `${out.company ?? "-"} · ${out.location ?? "-"}`,
          out.salary ? `Salary: ${out.salary}` : "Salary: -",
          `Posted: ${out.date ?? "-"}  Closes: ${out.valid_through ?? "-"}`,
          out.url,
          "",
          out.description ?? "(no description)",
        ].join("\n") + "\n",
      )
    }
    return 0
  }

  writeError(`unknown command "${command}" (expected search or detail)`, "UNKNOWN_COMMAND")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((e: unknown) => {
    writeError(e instanceof Error ? e.message : String(e), "ERROR")
    process.exit(1)
  })
