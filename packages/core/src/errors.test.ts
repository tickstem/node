import { describe, it, expect } from "vitest"
import { APIError, isUnauthorized, isQuotaExceeded } from "./errors.js"

describe("APIError", () => {
  it("given 401 status when checking isUnauthorized then returns true", () => {
    const err = new APIError(401, "unauthorized")
    expect(isUnauthorized(err)).toBe(true)
    expect(isQuotaExceeded(err)).toBe(false)
  })

  it("given 402 status when checking isQuotaExceeded then returns true", () => {
    const err = new APIError(402, "quota exceeded")
    expect(isQuotaExceeded(err)).toBe(true)
    expect(isUnauthorized(err)).toBe(false)
  })

  it("given non-APIError when checking then returns false", () => {
    const err = new Error("other")
    expect(isUnauthorized(err)).toBe(false)
    expect(isQuotaExceeded(err)).toBe(false)
  })
})
