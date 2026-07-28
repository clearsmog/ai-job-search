import {
  BASE_URL,
  fetchText,
  htmlToText,
  jsonLd,
  normalizeJobId,
  type JobDetailResult,
} from "../helpers.js"

export interface DetailOpts {
  id: string
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return null
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
    for (const key of ["addressLocality", "addressRegion", "postalCode", "addressCountry"]) {
      const v = str(a[key])
      if (v && !parts.includes(v)) parts.push(v)
    }
  }
  return parts.length ? parts.join(", ") : null
}

/** Pull min/max/currency out of schema.org baseSalary. */
export function parseSalary(base: unknown): {
  min: number | null
  max: number | null
  currency: string | null
  text: string | null
} {
  const empty = { min: null, max: null, currency: null, text: null }
  if (!base || typeof base !== "object") return empty
  const b = base as Record<string, unknown>
  const currency = str(b.currency)
  const value = b.value
  if (!value || typeof value !== "object") return { ...empty, currency }
  const v = value as Record<string, unknown>
  const min = num(v.minValue) ?? num(v.value)
  const max = num(v.maxValue) ?? num(v.value)
  const unit = str(v.unitText)

  let text: string | null = null
  if (min != null || max != null) {
    const cur = currency ? `${currency} ` : ""
    const range = min != null && max != null && min !== max ? `${min}–${max}` : `${min ?? max}`
    text = `${cur}${range}${unit ? ` ${unit.toLowerCase()}` : ""}`
  }
  return { min, max, currency, text }
}

export async function runDetail(opts: DetailOpts): Promise<JobDetailResult | null> {
  const id = normalizeJobId(opts.id)
  if (!id) throw new Error(`not a Reed job id or URL: ${opts.id}`)

  // The slug segment is cosmetic; Reed resolves the id and redirects.
  const url = `${BASE_URL}/jobs/job/${id}`
  const html = await fetchText(url)
  if (html === null) return null

  const postings = jsonLd(html, "JobPosting")
  if (!postings.length) {
    throw new Error(
      `reed.co.uk job ${id} has no JobPosting structured data - the page may have changed, ` +
        "or the listing has expired",
    )
  }
  const p = postings[0]

  const org = p.hiringOrganization
  const company =
    org && typeof org === "object" ? str((org as Record<string, unknown>).name) : null

  const salary = parseSalary(p.baseSalary)
  const datePosted = str(p.datePosted)

  return {
    id,
    title: str(p.title) ?? "(untitled)",
    company,
    location: formatLocation(p.jobLocation),
    date: datePosted ? datePosted.slice(0, 10) : null,
    url,
    salary: salary.text,
    job_type: str(p.employmentType),
    employment_type: str(p.employmentType),
    salary_min: salary.min,
    salary_max: salary.max,
    salary_currency: salary.currency,
    valid_through: str(p.validThrough)?.slice(0, 10) ?? null,
    description: htmlToText(str(p.description)),
  }
}
