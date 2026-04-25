export interface Job {
  id: string
  name: string
  schedule: string
  endpoint: string
  method: string
  description: string
  status: "active" | "paused" | "failing"
  timeout_secs: number
  retries: number
  created_at: string
  updated_at: string
  next_run_at: string | null
}

export interface Execution {
  id: string
  job_id: string
  status: "success" | "failure" | "timeout"
  status_code: number | null
  duration_ms: number
  triggered_at: string
}

export interface RegisterParams {
  name: string
  schedule: string
  endpoint: string
  method?: string
  description?: string
  timeout_secs?: number
}
