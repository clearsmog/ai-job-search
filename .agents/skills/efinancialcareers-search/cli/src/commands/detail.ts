import {
  BASE_URL,
  fetchText,
  htmlToText,
  jsonLd,
  normalizeJobId,
  type JobDetailResult,
} from "../helpers.js"

export interface DetailOpts {
  /** A numeric id, an `.id<digits>` path, or a full eFC job URL. */
  id: string
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null
}

/** Flatten schema.org jobLocation into a readable line. */
export function formatLocation(loc: unknown): string | null {
  const nodes = Array.isArray(loc) ? loc : [loc]
  const parts: string[] = []
  for (const n of nodes) {
    if (!n || typeof n !== "object") continue
    const addr = (n as Record<string, unknown>).address
    if (!addr || typeof addr !== "object") continue
    const a = addr as Record<string, unknown>
    for (const key of ["addressLocality", "addressRegion", "addressCountry"]) {
      const raw = a[key]
      const v =
        typeof raw === "object" && raw
          ? str((raw as Record<string, unknown>).name)
          : str(raw)
      if (v && !parts.includes(v)) parts.push(v)
    }
  }
  return parts.length ? parts.join(", ") : null
}

/**
 * eFC job URLs are slug-heavy (`/jobs-United_Kingdom-London-Title.id24582893`)
 * and the slug is not derivable from the id alone. A full URL is therefore
 * passed straight through; a bare id falls back to the site's id-only form.
 */
export function detailUrl(input: string, id: string): string {
  const trimmed = input.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("/")) return `${BASE_URL}${trimmed}`
  return `${BASE_URL}/jobs.id${id}`
}

export async function runDetail(opts: DetailOpts): Promise<JobDetailResult | null> {
  const id = normalizeJobId(opts.id)
  if (!id) throw new Error(`not an eFinancialCareers job id or URL: ${opts.id}`)

  const url = detailUrl(opts.id, id)
  const html = await fetchText(url)
  if (html === null) return null

  const postings = jsonLd(html, "JobPosting")
  if (!postings.length) {
    throw new Error(
      `efinancialcareers.co.uk job ${id} has no JobPosting structured data - the page may have ` +
        "changed, or the listing has expired",
    )
  }
  const p = postings[0]

  const org = p.hiringOrganization
  const company =
    org && typeof org === "object" ? str((org as Record<string, unknown>).name) : null

  const datePosted = str(p.datePosted)

  return {
    id,
    title: str(p.title) ?? "(untitled)",
    company,
    location: formatLocation(p.jobLocation),
    date: datePosted ? datePosted.slice(0, 10) : null,
    url,
    salary: null,
    job_type: str(p.employmentType),
    employment_type: str(p.employmentType),
    valid_through: str(p.validThrough)?.slice(0, 10) ?? null,
    description: htmlToText(str(p.description)),
  }
}
