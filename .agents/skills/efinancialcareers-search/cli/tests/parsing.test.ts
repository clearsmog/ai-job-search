// Offline parser tests. The fixture is a trimmed capture of a real
// efinancialcareers.co.uk results page and deliberately contains BOTH embedded
// arrays, so the "read jobs, never data" trap is covered by a test rather than
// only by a comment.
import { describe, expect, test } from "bun:test"
import { join } from "path"
import { isEmptyResultPage, toResult } from "../src/commands/search.js"
import { detailUrl, formatLocation } from "../src/commands/detail.js"
import { extractJsonArray, htmlToText, normalizeJobId, searchUrl } from "../src/helpers.js"

const FIXTURE = await Bun.file(join(import.meta.dir, "fixtures/search-payload.html")).text()

describe("extractJsonArray", () => {
  test("reads the jobs array from a real page", () => {
    const jobs = extractJsonArray(FIXTURE, "jobs")
    expect(jobs).not.toBeNull()
    expect(jobs!.length).toBe(4)
  })

  test("jobs holds the search results; data holds something else entirely", () => {
    // The bug this guards: `data` looks richer (it has posted_date), so it is
    // tempting to prefer it. Its contents are promoted listings unrelated to
    // the query, and using it would return the wrong jobs with confident dates.
    const jobs = extractJsonArray(FIXTURE, "jobs") as Record<string, unknown>[]
    const data = extractJsonArray(FIXTURE, "data") as Record<string, unknown>[]
    expect(String(jobs[0].job_title)).toContain("Market Risk")
    expect(String(data[0].title)).not.toContain("Market Risk")
  })

  test("counts brackets rather than regex-matching, so descriptions do not truncate it", () => {
    // A lazy regex would stop at the ] inside the description string.
    const html = `{"jobs":[{"job_id":"1","job_title":"A ] bracket [ inside","company_name":"C"}]}`
    const jobs = extractJsonArray(html, "jobs") as Record<string, unknown>[]
    expect(jobs.length).toBe(1)
    expect(jobs[0].job_title).toBe("A ] bracket [ inside")
  })

  test("handles escaped quotes inside strings", () => {
    const html = `{"jobs":[{"job_id":"1","job_title":"He said \\"go\\" ]","company_name":"C"}]}`
    const jobs = extractJsonArray(html, "jobs") as Record<string, unknown>[]
    expect(jobs.length).toBe(1)
  })

  test("returns null when the key is absent or the JSON is broken", () => {
    expect(extractJsonArray("<html>nothing</html>", "jobs")).toBeNull()
    expect(extractJsonArray(`{"jobs":[{oops}]}`, "jobs")).toBeNull()
  })
})

describe("toResult", () => {
  const jobs = extractJsonArray(FIXTURE, "jobs") as Record<string, unknown>[]

  test("maps a real payload job into the contract shape", () => {
    const r = toResult(jobs[0])
    expect(r).not.toBeNull()
    expect(r!.id).toMatch(/^\d+$/)
    expect(r!.title).toContain("Market Risk")
    expect(r!.company).toBe("Jefferies")
    expect(r!.url).toStartWith("https://www.efinancialcareers.co.uk/")
  })

  test("date is null from search — the payload has no posting date", () => {
    for (const j of jobs) expect(toResult(j)!.date).toBeNull()
  })

  test('drops "Competitive" and other non-salaries rather than reporting them', () => {
    // Otherwise every row looks like it carried compensation data.
    expect(toResult({ job_id: "1", job_title: "T", salary: "Competitive" })!.salary).toBeNull()
    expect(toResult({ job_id: "1", job_title: "T", salary: "Negotiable" })!.salary).toBeNull()
    expect(toResult({ job_id: "1", job_title: "T", salary: "£/annum" })!.salary).toBeNull()
    expect(toResult({ job_id: "1", job_title: "T", salary: "£60,000 - £70,000" })!.salary).toBe(
      "£60,000 - £70,000",
    )
  })

  test("builds an absolute URL from a relative destination path", () => {
    const r = toResult({ job_id: "9", job_title: "T", destination_url: "/jobs-X.id9" })
    expect(r!.url).toBe("https://www.efinancialcareers.co.uk/jobs-X.id9")
  })

  test("falls back to an id-only URL when no path is given", () => {
    expect(toResult({ job_id: "9", job_title: "T" })!.url).toContain(".id9")
  })

  test("returns null without an id or a title", () => {
    expect(toResult({ job_title: "T" })).toBeNull()
    expect(toResult({ job_id: "9" })).toBeNull()
  })
})

describe("searchUrl", () => {
  test("builds the query-string form the site honours", () => {
    expect(searchUrl({ query: "market risk", location: "London" })).toBe(
      "https://www.efinancialcareers.co.uk/jobs/?q=market+risk&location=London",
    )
  })

  test("page 1 adds no parameter; later pages use `page`", () => {
    // `pageNum` is silently ignored upstream and returns page 1 again, which
    // would make a paginated scrape loop over identical results forever.
    expect(searchUrl({ query: "risk", page: 1 })).not.toContain("page=")
    expect(searchUrl({ query: "risk", page: 3 })).toContain("page=3")
  })

  test("encodes characters that would break the query string", () => {
    expect(searchUrl({ query: "risk & data" })).toContain("q=risk+%26+data")
  })
})

describe("normalizeJobId", () => {
  test("accepts a bare id, an .id path, and a full URL", () => {
    expect(normalizeJobId("24582893")).toBe("24582893")
    expect(normalizeJobId("/jobs-United_Kingdom-London-Title.id24582893")).toBe("24582893")
    expect(
      normalizeJobId("https://www.efinancialcareers.co.uk/jobs-X-Y.id24582893"),
    ).toBe("24582893")
  })

  test("rejects input carrying no id", () => {
    expect(normalizeJobId("")).toBeNull()
    expect(normalizeJobId("https://www.efinancialcareers.co.uk/jobs/")).toBeNull()
  })
})

describe("detailUrl", () => {
  test("passes a full URL through untouched", () => {
    const u = "https://www.efinancialcareers.co.uk/jobs-A-B.id123"
    expect(detailUrl(u, "123")).toBe(u)
  })

  test("absolutises a relative path", () => {
    expect(detailUrl("/jobs-A.id123", "123")).toBe(
      "https://www.efinancialcareers.co.uk/jobs-A.id123",
    )
  })

  test("falls back to the id-only form for a bare id", () => {
    expect(detailUrl("123", "123")).toBe("https://www.efinancialcareers.co.uk/jobs.id123")
  })
})

describe("formatLocation", () => {
  test("flattens a schema.org Place", () => {
    expect(
      formatLocation({
        "@type": "Place",
        address: { addressLocality: "London", addressRegion: "England", addressCountry: "GB" },
      }),
    ).toBe("London, England, GB")
  })

  test("unwraps an addressCountry given as an object", () => {
    expect(
      formatLocation({ address: { addressLocality: "London", addressCountry: { name: "GB" } } }),
    ).toBe("London, GB")
  })

  test("null when there is no address", () => {
    expect(formatLocation(null)).toBeNull()
    expect(formatLocation({ "@type": "Place" })).toBeNull()
  })
})

describe("htmlToText", () => {
  test("turns block tags into newlines and decodes entities", () => {
    expect(htmlToText("<p>A &amp; B</p><li>C</li>")).toBe("A & B\nC")
  })

  test("null for empty input", () => {
    expect(htmlToText(null)).toBeNull()
    expect(htmlToText("<p></p>")).toBeNull()
  })
})

describe("isEmptyResultPage", () => {
  test("recognises a genuine no-results page", () => {
    expect(isEmptyResultPage("<p>No jobs found for your search</p>")).toBe(true)
  })

  test("does not treat a populated page as empty", () => {
    expect(isEmptyResultPage(FIXTURE)).toBe(false)
  })
})
