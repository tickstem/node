export interface EmailVerification {
  id: string
  email: string
  valid: boolean
  mx_found: boolean
  disposable: boolean
  role_based: boolean
  reason: string
  created_at: string
}

export interface VerifyHistoryEntry {
  id: string
  email: string
  valid: boolean
  created_at: string
}
