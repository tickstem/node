export interface Monitor {
  id: string
  name: string
  url: string
  interval_secs: number
  timeout_secs: number
  status: "active" | "paused" | "failing"
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
  checked_at: string
}

export interface CreateParams {
  name: string
  url: string
  interval_secs?: number
  timeout_secs?: number
}

export interface UpdateParams {
  name?: string
  url?: string
  interval_secs?: number
  timeout_secs?: number
  status?: "active" | "paused"
}
