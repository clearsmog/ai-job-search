import { afterEach, describe, expect, test } from "bun:test"
import { fetchText } from "../src/helpers"

// A stalled upstream connection (accepted socket, no response) would otherwise
// hang the CLI forever - fetch has no default timeout. Assert the request
// wrapper carries an AbortSignal timeout, and that the retry loop arms a fresh
// one per attempt: a single signal reused across attempts would already be
// aborted by the time the second one runs, turning a slow response into a
// permanent failure.

const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout

afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
})

describe("fetchText request timeout", () => {
  test("passes an AbortSignal timeout to fetch", async () => {
    let init: RequestInit | undefined
    globalThis.fetch = (async (_url: string | URL | Request, i?: RequestInit) => {
      init = i
      return new Response("<html></html>", { status: 200 })
    }) as unknown as typeof fetch

    await fetchText("https://www.reed.co.uk/jobs/x")

    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(init?.signal?.aborted).toBe(false)
  })

  test("arms a fresh signal on each retry attempt", async () => {
    globalThis.setTimeout = ((fn: () => void) =>
      originalSetTimeout(fn, 0)) as unknown as typeof setTimeout

    const signals: (AbortSignal | null | undefined)[] = []
    let calls = 0
    globalThis.fetch = (async (_url: string | URL | Request, i?: RequestInit) => {
      signals.push(i?.signal)
      calls++
      return calls === 1
        ? new Response("", { status: 429 })
        : new Response("<html>ok</html>", { status: 200 })
    }) as unknown as typeof fetch

    expect(await fetchText("https://www.reed.co.uk/jobs/x")).toBe("<html>ok</html>")
    expect(signals).toHaveLength(2)
    expect(signals[0]).not.toBe(signals[1])
  })
})
