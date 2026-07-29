import { afterEach, describe, expect, test } from "bun:test"
import { fetchText } from "../src/helpers"

// The portal contract requires backoff on 429/5xx. These tests pin the retry
// loop offline: a stubbed fetch counts attempts, and a stubbed setTimeout
// fires immediately so the exhaustion case does not sleep through the real
// 500ms -> 8s backoff schedule. fetchText's documented graceful-degradation
// contract (connection failures fail fast, no retry) is pinned too.

const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout

afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
})

function instantTimers() {
  globalThis.setTimeout = ((fn: () => void) =>
    originalSetTimeout(fn, 0)) as unknown as typeof setTimeout
}

function stubFetch(responses: Array<() => Response>): { calls: number } {
  const state = { calls: 0 }
  globalThis.fetch = (async () => {
    const i = Math.min(state.calls, responses.length - 1)
    state.calls++
    return responses[i]()
  }) as unknown as typeof fetch

  return state
}

describe("fetchText retry/backoff", () => {
  test("retries a 429 and succeeds on the next attempt", async () => {
    instantTimers()
    const state = stubFetch([
      () => new Response("", { status: 429 }),
      () => new Response("<html>ok</html>", { status: 200 }),
    ])

    expect(await fetchText("/x")).toBe("<html>ok</html>")
    expect(state.calls).toBe(2)
  })

  test("returns the documented null on a dead job id without retrying", async () => {
    for (const status of [404, 410]) {
      const state = stubFetch([() => new Response("", { status })])

      expect(await fetchText("/x")).toBeNull()
      expect(state.calls).toBe(1)
    }
  })

  test("gives up after the initial attempt plus four retries on persistent 5xx", async () => {
    instantTimers()
    const state = stubFetch([() => new Response("", { status: 500 })])

    await expect(fetchText("/x")).rejects.toThrow(/500/)
    expect(state.calls).toBe(5)
  })

  test("fails fast on a connection error - no retry, per the graceful-degradation contract", async () => {
    const state = { calls: 0 }
    globalThis.fetch = (async () => {
      state.calls++
      throw new TypeError("Unable to connect")
    }) as unknown as typeof fetch

    await expect(fetchText("/x")).rejects.toThrow(/could not reach reed\.co\.uk/)
    expect(state.calls).toBe(1)
  })
})
