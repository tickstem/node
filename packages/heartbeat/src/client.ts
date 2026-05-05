import { TickstemClient, APIError, type ClientOptions } from "@tickstem/core"
import type { Heartbeat, HeartbeatPing, CreateParams, UpdateParams, PingsParams } from "./types.js"

const VERSION = "0.1.0"

export class HeartbeatClient extends TickstemClient {
  constructor(apiKey: string, options: ClientOptions = {}) {
    super(apiKey, VERSION, options)
  }

  list(): Promise<Heartbeat[]> {
    return this.request<{ heartbeats: Heartbeat[] | null }>("GET", "/heartbeats").then((r) => r.heartbeats ?? [])
  }

  get(heartbeatId: string): Promise<Heartbeat> {
    return this.request<Heartbeat>("GET", `/heartbeats/${heartbeatId}`)
  }

  create(params: CreateParams): Promise<Heartbeat> {
    return this.request<Heartbeat>("POST", "/heartbeats", params)
  }

  update(heartbeatId: string, params: UpdateParams): Promise<Heartbeat> {
    return this.request<Heartbeat>("PATCH", `/heartbeats/${heartbeatId}`, params)
  }

  pause(heartbeatId: string): Promise<Heartbeat> {
    return this.request<Heartbeat>("PATCH", `/heartbeats/${heartbeatId}`, { status: "paused" })
  }

  resume(heartbeatId: string): Promise<Heartbeat> {
    return this.request<Heartbeat>("PATCH", `/heartbeats/${heartbeatId}`, { status: "active" })
  }

  delete(heartbeatId: string): Promise<void> {
    return this.request<void>("DELETE", `/heartbeats/${heartbeatId}`)
  }

  pings(heartbeatId: string, params: PingsParams = {}): Promise<HeartbeatPing[]> {
    const limit = params.limit ?? 50
    return this.request<{ pings: HeartbeatPing[] | null }>("GET", `/heartbeats/${heartbeatId}/pings?limit=${limit}`).then((r) => r.pings ?? [])
  }

  // Ping does not use the API key — the token is the credential.
  async ping(token: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/heartbeats/${token}/ping`, {
      method: "POST",
      headers: {
        "User-Agent": `tickstem-node/${VERSION}`,
      },
    })
    if (!response.ok) {
      const text = await response.text()
      let message = response.statusText
      try {
        const json = JSON.parse(text) as { error?: string }
        message = json.error ?? message
      } catch {
        // use statusText fallback
      }
      throw new APIError(response.status, message)
    }
  }
}
