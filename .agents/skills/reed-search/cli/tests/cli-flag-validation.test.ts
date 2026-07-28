// Flag-contract tests. These never touch the network: every case must fail
// during argument validation, before a request is attempted.
import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers.js"

describe("argument validation", () => {
  test("search without --query exits 1 with a JSON error", async () => {
    const r = await runCLI(["search"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("MISSING_ARG")
  })

  test("detail without an id exits 1", async () => {
    const r = await runCLI(["detail"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("MISSING_ARG")
  })

  test("an unknown command exits 1", async () => {
    const r = await runCLI(["frobnicate"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("UNKNOWN_COMMAND")
  })

  test("a bad --format is rejected before any request", async () => {
    const r = await runCLI(["search", "-q", "risk", "--format", "yaml"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("INVALID_FLAG")
  })

  test("a non-numeric --page is rejected rather than silently defaulting", async () => {
    const r = await runCLI(["search", "-q", "risk", "--page", "two"])
    expect(r.exitCode).toBe(1)
    expect(r.stderr).toContain("--page")
  })

  test("--limit 0 is rejected", async () => {
    const r = await runCLI(["search", "-q", "risk", "--limit", "0"])
    expect(r.exitCode).toBe(1)
    expect(r.stderr).toContain("--limit")
  })

  test("detail rejects an id it cannot resolve", async () => {
    const r = await runCLI(["detail", "not-a-job"])
    expect(r.exitCode).toBe(1)
    expect(r.stderr).toContain("not a Reed job id")
  })

  test("no arguments prints usage and exits 1", async () => {
    const r = await runCLI([])
    expect(r.exitCode).toBe(1)
    expect(r.stdout).toContain("reed-search")
  })

  test("--help prints usage and exits 0", async () => {
    const r = await runCLI(["search", "--help"])
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toContain("Usage:")
  })
})
