export interface Job {
  id: string
  name: string
  schedule: string
  endpoint: string
  method: string
  description: string
  status: "active" | "paused" | "failing"
  timeoutSecs: number
  createdAt: string
  updatedAt: string
  lastRunAt: string | null
  nextRunAt: string | null
}

export interface Execution {
  id: string
  jobId: string
  status: "success" | "failure" | "timeout"
  statusCode: number | null
  durationMs: number
  triggeredAt: string
}

export interface RegisterParams {
  name: string
  schedule: string
  endpoint: string
  method?: string
  description?: string
  timeoutSecs?: number
}
