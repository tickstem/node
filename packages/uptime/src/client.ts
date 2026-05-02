import { TickstemClient, type ClientOptions } from "@tickstem/core"
import type { Monitor, MonitorCheck, CreateParams, UpdateParams } from "./types.js"

const VERSION = "0.1.0"

export class UptimeClient extends TickstemClient {
  constructor(apiKey: string, options: ClientOptions = {}) {
    super(apiKey, VERSION, options)
  }

  list(): Promise<Monitor[]> {
    return this.request<{ monitors: Monitor[] | null }>("GET", "/monitors").then((r) => r.monitors ?? [])
  }

  get(monitorId: string): Promise<Monitor> {
    return this.request<Monitor>("GET", `/monitors/${monitorId}`)
  }

  create(params: CreateParams): Promise<Monitor> {
    return this.request<Monitor>("POST", "/monitors", params)
  }

  update(monitorId: string, params: UpdateParams): Promise<Monitor> {
    return this.request<Monitor>("PATCH", `/monitors/${monitorId}`, params)
  }

  pause(monitorId: string): Promise<Monitor> {
    return this.request<Monitor>("PATCH", `/monitors/${monitorId}`, { status: "paused" })
  }

  resume(monitorId: string): Promise<Monitor> {
    return this.request<Monitor>("PATCH", `/monitors/${monitorId}`, { status: "active" })
  }

  delete(monitorId: string): Promise<void> {
    return this.request<void>("DELETE", `/monitors/${monitorId}`)
  }

  checks(monitorId: string, limit = 50): Promise<MonitorCheck[]> {
    return this.request<{ checks: MonitorCheck[] | null }>("GET", `/monitors/${monitorId}/checks?limit=${limit}`).then((r) => r.checks ?? [])
  }
}
