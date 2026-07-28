// Offline parser tests. The fixture is real markup captured from
// reed.co.uk/jobs/market-risk-jobs-in-london, so a Reed redesign that breaks
// the parser can be reproduced here by refreshing the fixture rather than by
// hitting the live site from CI.
import { describe, expect, test } from "bun:test"
import { join } from "path"
import { parseCard, splitCards, isEmptyResultPage } from "../src/commands/search.js"
import { formatLocation, parseSalary } from "../src/commands/detail.js"
import {
  dateCreatedOffset,
  jsonLd,
  normalizeJobId,
  parsePostedDate,
  searchUrl,
} from "../src/helpers.js"

const FIXTURE = await Bun.file(join(import.meta.dir, "fixtures/search-cards.html")).text()

describe("splitCards", () => {
  test("finds every job card in the fixture", () => {
    expect(splitCards(FIXTURE).length).toBe(3)
  })

  test("returns nothing for markup with no cards", () => {
    expect(splitCards("<html><body><p>nothing here</p></body></html>")).toEqual([])
  })

  test("does not truncate a card at nested markup", () => {
    // Each slice must still carry its own title anchor.
    for (const card of splitCards(FIXTURE)) {
      expect(card).toContain('data-qa="job-card-title"')
    }
  })
})

describe("parseCard", () => {
  const cards = splitCards(FIXTURE)
  const today = new Date("2026-07-28T12:00:00Z")

  test("extracts the contract fields from a real card", () => {
    const r = parseCard(cards[0], today)
    expect(r).not.toBeNull()
    expect(r!.id).toMatch(/^\d+$/)
    expect(r!.title.length).toBeGreaterThan(0)
    expect(r!.url).toStartWith("https://www.reed.co.uk/jobs/")
    expect(r!.url).toContain(r!.id)
  })

  test("separates the recruiter from the posted date", () => {
    // The card prints "<date> by <recruiter>" in one element.
    for (const card of cards) {
      const r = parseCard(card, today)
      expect(r!.company).not.toBeNull()
      expect(r!.company).not.toContain(" by ")
      expect(r!.company).not.toMatch(/^\d/)
    }
  })

  test("every fixture card yields a resolvable date", () => {
    // The fixture deliberately spans all three of Reed's date formats.
    for (const card of cards) {
      expect(parseCard(card, today)!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test("returns null when the title anchor is missing", () => {
    expect(parseCard('<article data-qa="job-card">no title</article>')).toBeNull()
  })
})

describe("parsePostedDate", () => {
  const today = new Date("2026-07-28T12:00:00Z")

  test("relative words", () => {
    expect(parsePostedDate("Today", today)).toBe("2026-07-28")
    expect(parsePostedDate("Yesterday", today)).toBe("2026-07-27")
  })

  test("elapsed counts — the format the freshest listings use", () => {
    expect(parsePostedDate("4 hrs ago", today)).toBe("2026-07-28")
    expect(parsePostedDate("35 mins ago", today)).toBe("2026-07-28")
    expect(parsePostedDate("3 days ago", today)).toBe("2026-07-25")
    expect(parsePostedDate("2 weeks ago", today)).toBe("2026-07-14")
  })

  test("day and month", () => {
    expect(parsePostedDate("2 July", today)).toBe("2026-07-02")
    expect(parsePostedDate("17 June by LJ Recruitment", today)).toBe("2026-06-17")
  })

  test("rolls a future month back a year", () => {
    // Read in January, a December listing belongs to the previous year.
    const january = new Date("2027-01-10T12:00:00Z")
    expect(parsePostedDate("20 December", january)).toBe("2026-12-20")
  })

  test("null for unparseable or absent input", () => {
    expect(parsePostedDate(null)).toBeNull()
    expect(parsePostedDate("sometime recently", today)).toBeNull()
  })
})

describe("searchUrl", () => {
  test("uses the slug form, which is the only one Reed honours", () => {
    // The query-string form returns a page with zero job cards on the live site.
    expect(searchUrl({ query: "market risk", location: "London" })).toBe(
      "https://www.reed.co.uk/jobs/market-risk-jobs-in-london",
    )
  })

  test("omits the location segment when no location is given", () => {
    expect(searchUrl({ query: "market risk" })).toBe(
      "https://www.reed.co.uk/jobs/market-risk-jobs",
    )
  })

  test("strips punctuation that would break the slug", () => {
    expect(searchUrl({ query: "C++ / risk & data" })).toBe(
      "https://www.reed.co.uk/jobs/c-risk-data-jobs",
    )
  })

  test("page 1 adds no parameter; later pages do", () => {
    expect(searchUrl({ query: "risk", page: 1 })).not.toContain("pageno")
    expect(searchUrl({ query: "risk", page: 3 })).toContain("pageno=3")
  })

  test("maps job age onto the site's buckets", () => {
    expect(searchUrl({ query: "risk", jobAge: 1 })).toContain("datecreatedoffset=today")
    expect(searchUrl({ query: "risk", jobAge: 7 })).toContain("datecreatedoffset=lastweek")
  })
})

describe("dateCreatedOffset", () => {
  test("buckets days the way the site does", () => {
    expect(dateCreatedOffset(1)).toBe("today")
    expect(dateCreatedOffset(3)).toBe("lastthreedays")
    expect(dateCreatedOffset(7)).toBe("lastweek")
    expect(dateCreatedOffset(14)).toBe("lasttwoweeks")
  })

  test("drops the filter beyond the coarsest bucket rather than inventing one", () => {
    expect(dateCreatedOffset(90)).toBeNull()
    expect(dateCreatedOffset(0)).toBeNull()
    expect(dateCreatedOffset(undefined)).toBeNull()
  })
})

describe("normalizeJobId", () => {
  test("accepts a bare id, a path, and a full URL", () => {
    expect(normalizeJobId("57082167")).toBe("57082167")
    expect(normalizeJobId("/jobs/analyst-quantitative-market-risk/57082167")).toBe("57082167")
    expect(
      normalizeJobId("https://www.reed.co.uk/jobs/analyst/57082167?source=searchResults"),
    ).toBe("57082167")
  })

  test("rejects input carrying no id", () => {
    expect(normalizeJobId("")).toBeNull()
    expect(normalizeJobId("https://www.reed.co.uk/jobs/")).toBeNull()
  })
})

describe("jsonLd", () => {
  test("finds a typed node and ignores other types", () => {
    const html = `<script type="application/ld+json">{"@type":"JobPosting","title":"X"}</script>
      <script type="application/ld+json">{"@type":"WebSite","name":"Y"}</script>`
    const found = jsonLd(html, "JobPosting")
    expect(found.length).toBe(1)
    expect(found[0].title).toBe("X")
  })

  test("walks @graph containers", () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"G"}]}</script>`
    expect(jsonLd(html, "JobPosting")[0].title).toBe("G")
  })

  test("a malformed block does not sink the parse", () => {
    const html = `<script type="application/ld+json">{not json</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"Z"}</script>`
    expect(jsonLd(html, "JobPosting")[0].title).toBe("Z")
  })
})

describe("detail helpers", () => {
  test("formatLocation flattens a schema.org Place", () => {
    expect(
      formatLocation({
        "@type": "Place",
        address: { addressLocality: "London", addressRegion: "South East England" },
      }),
    ).toBe("London, South East England")
  })

  test("formatLocation returns null when there is no address", () => {
    expect(formatLocation(null)).toBeNull()
    expect(formatLocation({ "@type": "Place" })).toBeNull()
  })

  test("parseSalary reads a range", () => {
    const s = parseSalary({
      currency: "GBP",
      value: { minValue: 57000, maxValue: 65000, unitText: "YEAR" },
    })
    expect(s.min).toBe(57000)
    expect(s.max).toBe(65000)
    expect(s.currency).toBe("GBP")
    expect(s.text).toBe("GBP 57000–65000 year")
  })

  test("parseSalary collapses a single value", () => {
    const s = parseSalary({ currency: "GBP", value: { value: 40000, unitText: "YEAR" } })
    expect(s.text).toBe("GBP 40000 year")
  })

  test("parseSalary is null-safe on an absent salary", () => {
    expect(parseSalary(undefined).text).toBeNull()
  })
})

describe("isEmptyResultPage", () => {
  test("recognises a genuine no-results page", () => {
    expect(isEmptyResultPage("<p>No jobs found matching your search</p>")).toBe(true)
  })

  test("does not treat an ordinary page as empty", () => {
    expect(isEmptyResultPage(FIXTURE)).toBe(false)
  })
})
