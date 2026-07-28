import {
  BASE_URL,
  dataQaText,
  fetchText,
  htmlToText,
  parsePostedDate,
  searchUrl,
  type JobResult,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  page?: number
  limit?: number
  jobAge?: number
}

/**
 * Split the results page into job cards.
 *
 * Reed wraps each result in `<article … data-qa="job-card">`. Matching the
 * opening tag and slicing to the next one (rather than a lazy `</article>`)
 * keeps nested markup intact.
 */
export function splitCards(html: string): string[] {
  const marker = /<article[^>]*data-qa="job-card"[^>]*>/gi
  const starts: number[] = []
  for (const m of html.matchAll(marker)) starts.push(m.index ?? 0)
  if (!starts.length) return []
  return starts.map((s, i) => html.slice(s, i + 1 < starts.length ? starts[i + 1] : undefined))
}

/**
 * Parse one card into the contract shape.
 *
 * The card prints "<date> by <recruiter>" in a single `job-posted-by` element,
 * so the two are separated here: the recruiter is the anchor text, the date is
 * whatever precedes " by ".
 */
export function parseCard(card: string, today = new Date()): JobResult | null {
  const link = card.match(/<a\s+href="(\/jobs\/[^"]+?\/(\d+))[^"]*"[^>]*data-qa="job-card-title"[^>]*>([\s\S]*?)<\/a>/i)
  if (!link) return null

  const id = link[2]
  const title = htmlToText(link[3])
  if (!title) return null

  const postedBy = dataQaText(card, "job-posted-by")
  let company: string | null = null
  let dateText: string | null = postedBy
  if (postedBy) {
    const idx = postedBy.lastIndexOf(" by ")
    if (idx >= 0) {
      dateText = postedBy.slice(0, idx).trim()
      company = postedBy.slice(idx + 4).trim() || null
    }
  }
  // The recruiter name also sits in its own anchor; prefer it when present.
  const recruiter = card.match(/data-element="recruiter"[^>]*>([\s\S]*?)<\/a>/i)
  if (recruiter) company = htmlToText(recruiter[1]) ?? company

  // The third metadata <li> has no data-qa of its own; it is the contract line.
  const items = [...card.matchAll(/<li[^>]*role="listitem\s*"[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
    htmlToText(m[1]),
  )
  const jobType = items.length >= 3 ? items[2] : null

  return {
    id,
    title,
    company,
    location: dataQaText(card, "job-metadata-location"),
    date: parsePostedDate(dateText, today),
    url: `${BASE_URL}${link[1]}`,
    salary: dataQaText(card, "job-metadata-salary"),
    job_type: jobType,
  }
}

/** Detect a results page that loaded but matched nothing (a soft zero). */
export function isEmptyResultPage(html: string): boolean {
  return /no jobs (were )?found|0 jobs found|didn.t match any jobs/i.test(html)
}

export async function runSearch(opts: SearchOpts): Promise<{
  query: string
  location: string | null
  page: number
  count: number
  results: JobResult[]
}> {
  const page = opts.page && opts.page > 0 ? opts.page : 1
  const url = searchUrl({
    query: opts.query,
    location: opts.location,
    page,
    jobAge: opts.jobAge,
  })

  const html = await fetchText(url)
  if (html === null) {
    return { query: opts.query, location: opts.location ?? null, page, count: 0, results: [] }
  }

  const cards = splitCards(html)
  // Zero cards on a page that is not an explicit "no results" page means the
  // markup moved. Say so rather than reporting an empty portal - a silent zero
  // reads as "nothing new today" and hides a broken parser for weeks.
  if (!cards.length && !isEmptyResultPage(html)) {
    throw new Error(
      "reed.co.uk returned a page with no recognisable job cards - the markup may have changed " +
        "(expected <article data-qa=\"job-card\">)",
    )
  }

  let results = cards.map((c) => parseCard(c)).filter((r): r is JobResult => r !== null)
  if (opts.limit && opts.limit > 0) results = results.slice(0, opts.limit)

  return {
    query: opts.query,
    location: opts.location ?? null,
    page,
    count: results.length,
    results,
  }
}
