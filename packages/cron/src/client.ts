import { TickstemClient, type ClientOptions } from "@tickstem/core"
import type { Job, Execution, RegisterParams } from "./types.js"

const VERSION = "0.1.0"

export class CronClient extends TickstemClient {
  constructor(apiKey: string, options: ClientOptions = {}) {
    super(apiKey, VERSION, options)
  }

  list(): Promise<Job[]> {
    return this.request<{ jobs: Job[] }>("GET", "/jobs").then((r) => r.jobs)
  }

  get(jobId: string): Promise<Job> {
    return this.request<Job>("GET", `/jobs/${jobId}`)
  }

  register(params: RegisterParams): Promise<Job> {
    return this.request<Job>("POST", "/jobs", params)
  }

  update(jobId: string, params: Partial<RegisterParams>): Promise<Job> {
    return this.request<Job>("PUT", `/jobs/${jobId}`, params)
  }

  pause(jobId: string): Promise<Job> {
    return this.request<Job>("PATCH", `/jobs/${jobId}`, { status: "paused" })
  }

  resume(jobId: string): Promise<Job> {
    return this.request<Job>("PATCH", `/jobs/${jobId}`, { status: "active" })
  }

  delete(jobId: string): Promise<void> {
    return this.request<void>("DELETE", `/jobs/${jobId}`)
  }

  executions(jobId: string): Promise<Execution[]> {
    return this.request<{ executions: Execution[] }>("GET", `/executions?job_id=${jobId}`).then((r) => r.executions)
  }
}
