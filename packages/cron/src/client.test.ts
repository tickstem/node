import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createServer, type Server } from "node:http"
import { CronClient } from "./client.js"
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

describe("CronClient", () => {
  let server: { url: string; close: () => void }
  let client: CronClient

  afterEach(() => server?.close())

  it("given valid response when listing jobs then returns jobs array", async () => {
    const job = { id: "j1", name: "test", schedule: "* * * * *", endpoint: "https://example.com", method: "POST", description: "", status: "active", timeoutSecs: 30, createdAt: "", updatedAt: "", lastRunAt: null, nextRunAt: null }
    server = await startServer(() => ({ status: 200, body: { jobs: [job] } }))
    client = new CronClient("key", { baseURL: server.url })
    const jobs = await client.list()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].id).toBe("j1")
  })

  it("given 401 response when requesting then throws APIError with isUnauthorized", async () => {
    server = await startServer(() => ({ status: 401, body: { error: "unauthorized" } }))
    client = new CronClient("bad-key", { baseURL: server.url })
    await expect(client.list()).rejects.toBeInstanceOf(APIError)
    await expect(client.list()).rejects.toMatchObject({ statusCode: 401 })
  })

  it("given 402 response when requesting then throws APIError with isQuotaExceeded", async () => {
    server = await startServer(() => ({ status: 402, body: { error: "quota exceeded" } }))
    client = new CronClient("key", { baseURL: server.url })
    await expect(client.list()).rejects.toMatchObject({ statusCode: 402 })
  })

  it("given valid params when registering job then posts and returns job", async () => {
    const job = { id: "j2", name: "new", schedule: "0 * * * *", endpoint: "https://example.com/job", method: "POST", description: "", status: "active", timeoutSecs: 30, createdAt: "", updatedAt: "", lastRunAt: null, nextRunAt: null }
    server = await startServer(() => ({ status: 200, body: job }))
    client = new CronClient("key", { baseURL: server.url })
    const result = await client.register({ name: "new", schedule: "0 * * * *", endpoint: "https://example.com/job" })
    expect(result.id).toBe("j2")
  })

  it("given job id when deleting then resolves without error", async () => {
    server = await startServer(() => ({ status: 200, body: {} }))
    client = new CronClient("key", { baseURL: server.url })
    await expect(client.delete("j1")).resolves.not.toThrow()
  })
})
