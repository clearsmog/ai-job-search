// Data source: reed.co.uk public search and job pages (HTML).
//
// Two different parsing strategies, chosen from what each page actually serves:
//
// - Search results are parsed from `data-qa` attributes. Those are QA test
//   hooks, not styling, so they survive CSS refactors that would break class
//   selectors. Reed's class names are hashed CSS-module output
//   (`index-module_jobTitle__702ZU`) and change on every build - never key on them.
// - Job pages carry a schema.org `JobPosting` block in JSON-LD, which is the
//   most stable target available: it is a published contract for search
//   engines, so Reed has an incentive to keep it correct.
//
// Reed also runs an official Jobseeker API (api/1.0/search, HTTP Basic with a
// free key). It is not used here because it needs an account, and this skill's
// contract is "works on a fresh clone with nothing but bun". If a key is ever
// available, REED_API_KEY is the natural place to add that path.

export const BASE_URL = "https://www.reed.co.uk"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

const TIMEOUT_MS = 20000

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/**
 * GET a page as text. Retries 429/5xx with backoff; returns null on 404 so a
 * dead job id is "not found" rather than an error. A connection failure fails
 * fast so an outage degrades this source quickly instead of hanging /scrape.
 */
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
        `could not reach reed.co.uk (${e instanceof Error ? e.message : String(e)})`,
      )
    }

    if (response.status === 404 || response.status === 410) return null
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`reed.co.uk request failed: ${response.status} ${response.statusText}`)
      }
      await sleep(delay + Math.floor(Math.random() * 400))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (!response.ok) {
      throw new Error(`reed.co.uk request failed: ${response.status} ${response.statusText}`)
    }
    return await response.text()
  }
  throw new Error("reed.co.uk request failed after retries")
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

/** Strip tags and comments to readable text. Block tags become newlines. */
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

/** Text content of the first element carrying `data-qa="<name>"`. */
export function dataQaText(html: string, name: string): string | null {
  const re = new RegExp(`data-qa="${name}"[^>]*>([\\s\\S]*?)<\\/(?:li|div|span|a|h2|p)>`, "i")
  const m = html.match(re)
  return m ? htmlToText(m[1]) : null
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
      continue // a malformed block must not sink the whole parse
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

/**
 * Reed search cards use three date formats, all verified against the live site:
 *
 * - a day and month with no year — "2 July"
 * - a relative day — "Today", "Yesterday"
 * - an elapsed count — "4 hrs ago", "3 days ago"
 *
 * The elapsed form only appears on very recent listings, which is exactly the
 * set /scrape cares about most, so failing to parse it would null out the
 * freshest results.
 *
 * Day-and-month carries no year: resolve against `today` and roll back a year
 * when the result would be in the future, so a December listing read in January
 * does not date itself eleven months ahead.
 */
export function parsePostedDate(text: string | null, today = new Date()): string | null {
  if (!text) return null
  const t = text.trim().toLowerCase()

  if (t.startsWith("today") || t.startsWith("just now")) return isoDate(today)
  if (t.startsWith("yesterday")) {
    const d = new Date(today)
    d.setDate(d.getDate() - 1)
    return isoDate(d)
  }

  const ago = t.match(/^(\d+)\s*(min|minute|hr|hour|day|week)s?\s+ago/)
  if (ago) {
    const n = parseInt(ago[1], 10)
    const unit = ago[2]
    const d = new Date(today)
    if (unit === "day") d.setDate(d.getDate() - n)
    else if (unit === "week") d.setDate(d.getDate() - n * 7)
    // minutes and hours never cross back beyond today for scraping purposes
    return isoDate(d)
  }

  const m = t.match(
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/,
  )
  if (!m) return null
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ]
  const day = parseInt(m[1], 10)
  const month = months.indexOf(m[2])
  if (month < 0) return null

  const d = new Date(Date.UTC(today.getUTCFullYear(), month, day))
  if (d.getTime() > today.getTime() + 86400000) d.setUTCFullYear(d.getUTCFullYear() - 1)
  return isoDate(d)
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** A search result in the portal-skill contract shape. Missing values are null. */
export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  salary: string | null
  job_type: string | null
}

/** A job detail: the search fields plus description and structured salary. */
export interface JobDetailResult extends JobResult {
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  valid_through: string | null
  description: string | null
}

/**
 * Accepts a bare numeric id, a `/jobs/<slug>/<id>` path, or a full Reed URL.
 * Returns the numeric id, which is the only part the job page needs.
 */
export function normalizeJobId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed
  const m = trimmed.match(/\/jobs\/[^/?#]+\/(\d+)/)
  return m ? m[1] : null
}

/**
 * Build a Reed search URL.
 *
 * Reed only honours its slug form: `/jobs/<keywords>-jobs-in-<location>`.
 * The query-string form (`/jobs?keywords=…&location=…`) returns a page with
 * zero job cards - verified against the live site, not assumed.
 */
export function searchUrl(opts: {
  query: string
  location?: string
  page?: number
  jobAge?: number
}): string {
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

  const kw = slugify(opts.query)
  const loc = opts.location ? slugify(opts.location) : ""
  const path = loc ? `/jobs/${kw}-jobs-in-${loc}` : `/jobs/${kw}-jobs`

  const params = new URLSearchParams()
  if (opts.page && opts.page > 1) params.set("pageno", String(opts.page))
  const offset = dateCreatedOffset(opts.jobAge)
  if (offset) params.set("datecreatedoffset", offset)

  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ""}`
}

/** Map a day count onto Reed's fixed `datecreatedoffset` buckets. */
export function dateCreatedOffset(days: number | undefined): string | null {
  if (days == null || !Number.isFinite(days) || days <= 0) return null
  if (days <= 1) return "today"
  if (days <= 3) return "lastthreedays"
  if (days <= 7) return "lastweek"
  if (days <= 14) return "lasttwoweeks"
  return null // beyond the site's coarsest bucket: no filter, filter client-side
}
