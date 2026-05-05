import { describe, it, expect, afterEach } from "vitest"
import { createServer, type Server } from "node:http"
import { UptimeClient } from "./client.js"
import { APIError } from "@tickstem/core"

function startServer(handler: (method: string, url: string, body: string) => { status: number; body: unknown }): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server: Server = createServer((req, res) => {
      let raw = ""
      req.on("data", (chunk: Buffer) => { raw += chunk.toString() })
      req.on("end", () => {
        const result = handler(req.method ?? "", req.url ?? "", raw)
        res.writeHead(result.status, { "Content-Type": "application/json" })
        if (result.body !== undefined) {
          res.end(JSON.stringify(result.body))
        } else {
          res.end()
        }
      })
    })
    server.listen(0, () => {
      const addr = server.address() as { port: number }
      resolve({ url: `http://localhost:${addr.port}/v1`, close: () => server.close() })
    })
  })
}

const monitor = {
  id: "m1",
  name: "Production API",
  url: "https://api.example.com/health",
  interval_secs: 60,
  timeout_secs: 10,
  status: "active",
  next_check_at: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
}

describe("UptimeClient", () => {
  let server: { url: string; close: () => void }
  let client: UptimeClient

  afterEach(() => server?.close())

  it("given monitors exist when listing then returns array", async () => {
    server = await startServer(() => ({ status: 200, body: { monitors: [monitor] } }))
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.list()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("m1")
  })

  it("given empty response when listing then returns empty array", async () => {
    server = await startServer(() => ({ status: 200, body: { monitors: null } }))
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.list()
    expect(result).toEqual([])
  })

  it("given monitor id when getting then returns monitor", async () => {
    server = await startServer(() => ({ status: 200, body: monitor }))
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.get("m1")
    expect(result.id).toBe("m1")
    expect(result.name).toBe("Production API")
  })

  it("given valid params when creating then returns created monitor", async () => {
    server = await startServer(() => ({ status: 201, body: monitor }))
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.create({ name: "Production API", url: "https://api.example.com/health" })
    expect(result.id).toBe("m1")
  })

  it("given update params when updating then returns updated monitor", async () => {
    const updated = { ...monitor, name: "Updated" }
    server = await startServer(() => ({ status: 200, body: updated }))
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.update("m1", { name: "Updated" })
    expect(result.name).toBe("Updated")
  })

  it("given monitor id when pausing then sends PATCH with paused status and returns paused monitor", async () => {
    const paused = { ...monitor, status: "paused" }
    let capturedMethod = "", capturedUrl = "", capturedBody = ""
    server = await startServer((method, url, body) => {
      capturedMethod = method; capturedUrl = url; capturedBody = body
      return { status: 200, body: paused }
    })
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.pause("m1")
    expect(result.status).toBe("paused")
    expect(capturedMethod).toBe("PATCH")
    expect(capturedUrl).toBe("/v1/monitors/m1")
    expect(JSON.parse(capturedBody)).toMatchObject({ status: "paused" })
  })

  it("given monitor id when resuming then sends PATCH with active status and returns active monitor", async () => {
    let capturedMethod = "", capturedUrl = "", capturedBody = ""
    server = await startServer((method, url, body) => {
      capturedMethod = method; capturedUrl = url; capturedBody = body
      return { status: 200, body: monitor }
    })
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.resume("m1")
    expect(result.status).toBe("active")
    expect(capturedMethod).toBe("PATCH")
    expect(capturedUrl).toBe("/v1/monitors/m1")
    expect(JSON.parse(capturedBody)).toMatchObject({ status: "active" })
  })

  it("given monitor id when deleting then resolves without error", async () => {
    server = await startServer(() => ({ status: 204, body: undefined }))
    client = new UptimeClient("key", { baseURL: server.url })
    await expect(client.delete("m1")).resolves.not.toThrow()
  })

  it("given checks exist when listing checks then returns array", async () => {
    const check = { id: "c1", monitor_id: "m1", status: "up", status_code: 200, duration_ms: 45, error: "", checked_at: "2026-05-01T00:00:00Z" }
    server = await startServer(() => ({ status: 200, body: { checks: [check] } }))
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.checks("m1")
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe("up")
  })

  it("given empty checks when listing then returns empty array", async () => {
    server = await startServer(() => ({ status: 200, body: { checks: null } }))
    client = new UptimeClient("key", { baseURL: server.url })
    const result = await client.checks("m1")
    expect(result).toEqual([])
  })

  it("given 401 response when requesting then throws APIError", async () => {
    server = await startServer(() => ({ status: 401, body: { error: "unauthorized" } }))
    client = new UptimeClient("bad-key", { baseURL: server.url })
    await expect(client.list()).rejects.toBeInstanceOf(APIError)
    await expect(client.list()).rejects.toMatchObject({ statusCode: 401 })
  })

  it("given 402 response when requesting then throws APIError with quota status", async () => {
    server = await startServer(() => ({ status: 402, body: { error: "monitor quota reached" } }))
    client = new UptimeClient("key", { baseURL: server.url })
    await expect(client.create({ name: "x", url: "https://x.com" })).rejects.toMatchObject({ statusCode: 402 })
  })
})
