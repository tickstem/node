import { describe, it, expect, afterEach } from "vitest"
import { createServer, type Server } from "node:http"
import { HeartbeatClient } from "./client.js"
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

const heartbeat = {
  id: "hb1",
  name: "daily backup",
  token: "abc123token",
  interval_secs: 86400,
  grace_secs: 3600,
  status: "active",
  consecutive_misses: 0,
  last_pinged_at: null,
  next_expected_at: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
}

describe("HeartbeatClient", () => {
  let server: { url: string; close: () => void }
  let client: HeartbeatClient

  afterEach(() => server?.close())

  it("given heartbeats exist when listing then returns array", async () => {
    server = await startServer(() => ({ status: 200, body: { heartbeats: [heartbeat] } }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.list()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("hb1")
  })

  it("given null response when listing then returns empty array", async () => {
    server = await startServer(() => ({ status: 200, body: { heartbeats: null } }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.list()
    expect(result).toEqual([])
  })

  it("given heartbeat id when getting then returns heartbeat", async () => {
    server = await startServer(() => ({ status: 200, body: heartbeat }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.get("hb1")
    expect(result.id).toBe("hb1")
    expect(result.token).toBe("abc123token")
  })

  it("given valid params when creating then returns created heartbeat", async () => {
    server = await startServer(() => ({ status: 201, body: heartbeat }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.create({ name: "daily backup", interval_secs: 86400 })
    expect(result.id).toBe("hb1")
    expect(result.name).toBe("daily backup")
  })

  it("given update params when updating then returns updated heartbeat", async () => {
    const updated = { ...heartbeat, name: "weekly backup", interval_secs: 604800 }
    server = await startServer(() => ({ status: 200, body: updated }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.update("hb1", { name: "weekly backup", interval_secs: 604800 })
    expect(result.name).toBe("weekly backup")
    expect(result.interval_secs).toBe(604800)
  })

  it("given heartbeat id when pausing then sends PATCH with paused status and returns paused heartbeat", async () => {
    const paused = { ...heartbeat, status: "paused" }
    let capturedMethod = "", capturedUrl = "", capturedBody = ""
    server = await startServer((method, url, body) => { capturedMethod = method; capturedUrl = url; capturedBody = body; return { status: 200, body: paused } })
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.pause("hb1")
    expect(result.status).toBe("paused")
    expect(capturedMethod).toBe("PATCH")
    expect(capturedUrl).toBe("/v1/heartbeats/hb1")
    expect(JSON.parse(capturedBody)).toMatchObject({ status: "paused" })
  })

  it("given heartbeat id when resuming then sends PATCH with active status and returns active heartbeat", async () => {
    let capturedMethod = "", capturedUrl = "", capturedBody = ""
    server = await startServer((method, url, body) => { capturedMethod = method; capturedUrl = url; capturedBody = body; return { status: 200, body: heartbeat } })
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.resume("hb1")
    expect(result.status).toBe("active")
    expect(capturedMethod).toBe("PATCH")
    expect(capturedUrl).toBe("/v1/heartbeats/hb1")
    expect(JSON.parse(capturedBody)).toMatchObject({ status: "active" })
  })

  it("given heartbeat id when deleting then resolves without error", async () => {
    server = await startServer(() => ({ status: 204, body: undefined }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    await expect(client.delete("hb1")).resolves.not.toThrow()
  })

  it("given pings exist when listing pings then returns array", async () => {
    const ping = { id: "p1", heartbeat_id: "hb1", pinged_at: "2026-05-01T00:00:00Z" }
    server = await startServer(() => ({ status: 200, body: { pings: [ping] } }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.pings("hb1")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("p1")
  })

  it("given null pings when listing then returns empty array", async () => {
    server = await startServer(() => ({ status: 200, body: { pings: null } }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    const result = await client.pings("hb1")
    expect(result).toEqual([])
  })

  it("given valid token when pinging then resolves without auth header", async () => {
    let capturedAuthHeader: string | undefined
    server = await startServer((method, url, _body) => {
      return { status: 200, body: { status: "ok" } }
    })
    const srv = await new Promise<{ url: string; authHeader: string | undefined; close: () => void }>((resolve) => {
      const s: Server = createServer((req, res) => {
        capturedAuthHeader = req.headers["authorization"]
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ status: "ok" }))
      })
      s.listen(0, () => {
        const addr = s.address() as { port: number }
        resolve({
          url: `http://localhost:${addr.port}/v1`,
          authHeader: capturedAuthHeader,
          close: () => s.close(),
        })
      })
    })
    client = new HeartbeatClient("my-api-key", { baseURL: srv.url })
    await client.ping("abc123token")
    expect(capturedAuthHeader).toBeUndefined()
    srv.close()
  })

  it("given 4xx response when pinging then throws APIError", async () => {
    server = await startServer(() => ({ status: 404, body: { error: "not found" } }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    await expect(client.ping("badtoken")).rejects.toBeInstanceOf(APIError)
  })

  it("given 401 response when requesting then throws APIError", async () => {
    server = await startServer(() => ({ status: 401, body: { error: "unauthorized" } }))
    client = new HeartbeatClient("bad-key", { baseURL: server.url })
    await expect(client.list()).rejects.toBeInstanceOf(APIError)
    await expect(client.list()).rejects.toMatchObject({ statusCode: 401 })
  })

  it("given 402 response when creating then throws APIError with quota status", async () => {
    server = await startServer(() => ({ status: 402, body: { error: "heartbeat quota reached" } }))
    client = new HeartbeatClient("key", { baseURL: server.url })
    await expect(client.create({ name: "x" })).rejects.toMatchObject({ statusCode: 402 })
  })
})
