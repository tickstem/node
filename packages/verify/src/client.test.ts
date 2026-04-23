import { describe, it, expect, afterEach } from "vitest"
import { createServer, type Server } from "node:http"
import { VerifyClient } from "./client.js"
import { APIError } from "@tickstem/core"

function startServer(handler: (body: string) => { status: number; body: unknown }): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server: Server = createServer((req, res) => {
      let raw = ""
      req.on("data", (chunk: Buffer) => { raw += chunk.toString() })
      req.on("end", () => {
        const result = handler(raw)
        res.writeHead(result.status, { "Content-Type": "application/json" })
        res.end(JSON.stringify(result.body))
      })
    })
    server.listen(0, () => {
      const addr = server.address() as { port: number }
      resolve({ url: `http://localhost:${addr.port}/v1`, close: () => server.close() })
    })
  })
}

describe("VerifyClient", () => {
  let server: { url: string; close: () => void }
  let client: VerifyClient

  afterEach(() => server?.close())

  it("given valid email when verifying then returns verification result", async () => {
    const result = { id: "v1", email: "user@example.com", valid: true, mx_found: true, disposable: false, role_based: false, reason: "", created_at: "" }
    server = await startServer(() => ({ status: 200, body: result }))
    client = new VerifyClient("key", { baseURL: server.url })
    const verification = await client.verify("user@example.com")
    expect(verification.valid).toBe(true)
    expect(verification.mx_found).toBe(true)
    expect(verification.disposable).toBe(false)
    expect(verification.role_based).toBe(false)
  })

  it("given role-based email when verifying then returns role_based true", async () => {
    const result = { id: "v2", email: "admin@example.com", valid: true, mx_found: true, disposable: false, role_based: true, reason: "role-based address", created_at: "" }
    server = await startServer(() => ({ status: 200, body: result }))
    client = new VerifyClient("key", { baseURL: server.url })
    const verification = await client.verify("admin@example.com")
    expect(verification.role_based).toBe(true)
    expect(verification.reason).toBe("role-based address")
  })

  it("given disposable email when verifying then returns disposable true", async () => {
    const result = { id: "v3", email: "user@mailinator.com", valid: false, mx_found: true, disposable: true, role_based: false, reason: "disposable email provider", created_at: "" }
    server = await startServer(() => ({ status: 200, body: result }))
    client = new VerifyClient("key", { baseURL: server.url })
    const verification = await client.verify("user@mailinator.com")
    expect(verification.valid).toBe(false)
    expect(verification.disposable).toBe(true)
  })

  it("given 401 response when requesting then throws APIError", async () => {
    server = await startServer(() => ({ status: 401, body: { error: "unauthorized" } }))
    client = new VerifyClient("bad-key", { baseURL: server.url })
    await expect(client.verify("user@example.com")).rejects.toBeInstanceOf(APIError)
    await expect(client.verify("user@example.com")).rejects.toMatchObject({ statusCode: 401 })
  })

  it("given 402 response when requesting then throws APIError with quota status", async () => {
    server = await startServer(() => ({ status: 402, body: { error: "quota exceeded" } }))
    client = new VerifyClient("key", { baseURL: server.url })
    await expect(client.verify("user@example.com")).rejects.toMatchObject({ statusCode: 402 })
  })

  it("given history request when listing then returns verifications array", async () => {
    const entry = { id: "v1", email: "user@example.com", valid: true, created_at: "" }
    server = await startServer(() => ({ status: 200, body: { verifications: [entry] } }))
    client = new VerifyClient("key", { baseURL: server.url })
    const history = await client.history()
    expect(history).toHaveLength(1)
    expect(history[0].email).toBe("user@example.com")
  })
})
