export type HeartbeatStatus = "active" | "paused" | "failing"

export interface Heartbeat {
  id: string
  name: string
  token: string
  interval_secs: number
  grace_secs: number
  status: HeartbeatStatus
  consecutive_misses: number
  last_pinged_at: string | null
  next_expected_at: string | null
  created_at: string
  updated_at: string
}

export interface HeartbeatPing {
  id: string
  heartbeat_id: string
  pinged_at: string
}

export interface CreateParams {
  name: string
  interval_secs?: number
  grace_secs?: number
}

export interface UpdateParams {
  name?: string
  interval_secs?: number
  grace_secs?: number
}

export interface PingsParams {
  limit?: number
}
