import {
  BASE_URL,
  extractJsonArray,
  fetchText,
  searchUrl,
  type JobResult,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  page?: number
  limit?: number
}

/** The fields this skill reads from an eFC search-payload job. */
interface EfcJob {
  job_id?: string | number
  job_title?: string
  company_name?: string
  job_location?: string
  salary?: string
  destination_url?: string
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim()
  if (typeof v === "number" && Number.isFinite(v)) return String(v)
  return null
}

/**
 * "Competitive" is eFC's placeholder for an undisclosed salary. Reporting it as
 * a salary would make every row look like it carried compensation data.
 */
function salaryOrNull(raw: unknown): string | null {
  const s = str(raw)
  if (!s) return null
  if (/^(competitive|negotiable|doe|n\/?a)$/i.test(s)) return null
  // A bare currency symbol with no figure ("£/annum") is equally empty.
  if (!/\d/.test(s)) return null
  return s
}

export function toResult(j: EfcJob): JobResult | null {
  const id = str(j.job_id)
  const title = str(j.job_title)
  if (!id || !title) return null

  const path = str(j.destination_url)
  const url = path
    ? path.startsWith("http")
      ? path
      : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`
    : `${BASE_URL}/jobs.id${id}`

  return {
    id,
    title,
    company: str(j.company_name),
    location: str(j.job_location),
    date: null, // not present in the search payload; see helpers.ts
    url,
    salary: salaryOrNull(j.salary),
    job_type: null,
  }
}

/** Detect a results page that loaded but matched nothing. */
export function isEmptyResultPage(html: string): boolean {
  return /no jobs (were )?found|0 jobs|didn.t match any jobs|no results/i.test(html)
}

export async function runSearch(opts: SearchOpts): Promise<{
  query: string
  location: string | null
  page: number
  count: number
  results: JobResult[]
}> {
  const page = opts.page && opts.page > 0 ? opts.page : 1
  const url = searchUrl({ query: opts.query, location: opts.location, page })

  const html = await fetchText(url)
  if (html === null) {
    return { query: opts.query, location: opts.location ?? null, page, count: 0, results: [] }
  }

  // "jobs", never "data" — see the trap documented in helpers.ts.
  const raw = extractJsonArray(html, "jobs")
  if (raw === null) {
    if (isEmptyResultPage(html)) {
      return { query: opts.query, location: opts.location ?? null, page, count: 0, results: [] }
    }
    // A missing payload on a page that is not an explicit "no results" page
    // means the site changed. Fail loudly: a silent zero reads as "nothing new"
    // and hides a broken parser for weeks.
    throw new Error(
      'efinancialcareers.co.uk returned a page with no "jobs" payload - the site may have ' +
        "changed its embedded search data",
    )
  }

  let results = raw
    .map((j) => toResult(j as EfcJob))
    .filter((r): r is JobResult => r !== null)
  if (opts.limit && opts.limit > 0) results = results.slice(0, opts.limit)

  return {
    query: opts.query,
    location: opts.location ?? null,
    page,
    count: results.length,
    results,
  }
}
