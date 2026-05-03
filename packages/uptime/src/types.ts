export type AssertionSource = "status_code" | "response_time" | "body"

export type AssertionComparison =
  | "eq" | "ne"
  | "lt" | "lte" | "gt" | "gte"
  | "contains" | "not_contains"

export interface Assertion {
  source: AssertionSource
  comparison: AssertionComparison
  target: string
}

export interface Monitor {
  id: string
  name: string
  url: string
  interval_secs: number
  timeout_secs: number
  status: "active" | "paused" | "failing"
  ssl_expires_at: string | null
  assertions: Assertion[]
  next_check_at: string | null
  created_at: string
  updated_at: string
}

export interface MonitorCheck {
  id: string
  monitor_id: string
  status: "up" | "down" | "timeout"
  status_code: number | null
  duration_ms: number
  error: string
  ssl_expires_at: string | null
  checked_at: string
}

export interface CreateParams {
  name: string
  url: string
  interval_secs?: number
  timeout_secs?: number
  assertions?: Assertion[]
}

export interface UpdateParams {
  name?: string
  url?: string
  interval_secs?: number
  timeout_secs?: number
  status?: "active" | "paused"
  assertions?: Assertion[]
}
