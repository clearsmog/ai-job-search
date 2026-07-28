// Data source: efinancialcareers.co.uk search and job pages (HTML with an
// embedded JSON payload).
//
// Parsing strategy, chosen from what the pages actually serve:
//
// - Search results come from a JSON object embedded in the results page under
//   the `"jobs"` key. It carries title, company, location, salary, id and the
//   destination path already structured, so there is no markup to parse.
// - Job pages carry a schema.org `JobPosting` block in JSON-LD.
//
// TRAP, verified against the live site: the same page embeds a second array
// under `"data"` whose objects look richer (they include `posted_date` and a
// full description) but are NOT the search results — they are promoted or
// recommended listings, and their titles do not match the query at all. A
// search for "market risk" returns "Junior Investment Manager" and "DevOps
// Engineer" in `"data"`. Read `"jobs"`; never `"data"`.
//
// Consequence: search results have no posting date. eFC rejects every date
// filter parameter tried against it, so `--jobage` cannot be pushed to the
// server either. Dates come from `detail`, and age filtering is the caller's
// job. That is a real limitation, stated rather than papered over.

export const BASE_URL = "https://www.efinancialcareers.co.uk"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

const TIMEOUT_MS = 25000

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/** GET a page as text. Retries 429/5xx with backoff; null on 404. */
export async function fetchText(url: string): Promise<string | null> {
  const maxRetries = 4
  let delay = 500

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-GB,en;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (e) {
      throw new Error(
        `could not reach efinancialcareers.co.uk (${e instanceof Error ? e.message : String(e)})`,
      )
    }

    if (response.status === 404 || response.status === 410) return null
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(
          `efinancialcareers.co.uk request failed: ${response.status} ${response.statusText}`,
        )
      }
      await sleep(delay + Math.floor(Math.random() * 400))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (!response.ok) {
      throw new Error(
        `efinancialcareers.co.uk request failed: ${response.status} ${response.statusText}`,
      )
    }
    return await response.text()
  }
  throw new Error("efinancialcareers.co.uk request failed after retries")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&pound;/g, "£")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => numericEntity(parseInt(d, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, h) => numericEntity(parseInt(h, 16)))
}

/** Strip tags to readable text. Block tags become newlines. */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null
  const withBreaks = html
    .replace(/<!--.*?-->/gs, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d|tr)>/gi, "\n")
  const text = decodeEntities(withBreaks.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return text || null
}

/**
 * Extract the JSON array that follows `"<key>":` in a page, by counting
 * brackets from the opening one. A regex cannot do this: the array contains
 * job descriptions with escaped brackets and quotes, so any lazy match stops
 * in the middle of a description.
 */
export function extractJsonArray(html: string, key: string): unknown[] | null {
  const marker = `"${key}":[`
  const at = html.indexOf(marker)
  if (at < 0) return null
  const start = html.indexOf("[", at)

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < html.length; i++) {
    const ch = html[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === "\\") {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === "[") depth++
    else if (ch === "]") {
      depth--
      if (depth === 0) {
        try {
          const parsed = JSON.parse(html.slice(start, i + 1))
          return Array.isArray(parsed) ? parsed : null
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** Every schema.org object of the given @type found in the page's JSON-LD. */
export function jsonLd(html: string, type: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )
  for (const b of blocks) {
    let parsed: unknown
    try {
      parsed = JSON.parse(decodeEntities(b[1].trim()))
    } catch {
      continue
    }
    const queue = Array.isArray(parsed) ? [...parsed] : [parsed]
    while (queue.length) {
      const node = queue.shift()
      if (!node || typeof node !== "object") continue
      const rec = node as Record<string, unknown>
      if (rec["@type"] === type) out.push(rec)
      if (Array.isArray(rec["@graph"])) queue.push(...(rec["@graph"] as unknown[]))
    }
  }
  return out
}

/** A search result in the portal-skill contract shape. Missing values are null. */
export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  /** Always null from search: eFC's results payload carries no posting date. */
  date: string | null
  url: string
  salary: string | null
  job_type: string | null
}

/** A job detail: the search fields plus dates, description and structured salary. */
export interface JobDetailResult extends JobResult {
  employment_type: string | null
  valid_through: string | null
  description: string | null
}

/** Accepts a bare numeric id, an `.id<digits>` path, or a full eFC URL. */
export function normalizeJobId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed
  const m = trimmed.match(/\.id(\d+)/)
  return m ? m[1] : null
}

/**
 * Build an eFC search URL.
 *
 * `page` is the pagination parameter. `pageNum` looks plausible and is silently
 * ignored by the site — it returns page 1 again, which would make a paginated
 * scrape loop over identical results forever.
 */
export function searchUrl(opts: { query: string; location?: string; page?: number }): string {
  const params = new URLSearchParams()
  params.set("q", opts.query)
  if (opts.location) params.set("location", opts.location)
  if (opts.page && opts.page > 1) params.set("page", String(opts.page))
  return `${BASE_URL}/jobs/?${params.toString()}`
}
