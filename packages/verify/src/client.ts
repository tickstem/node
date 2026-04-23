import { TickstemClient, type ClientOptions } from "@tickstem/core"
import type { EmailVerification, VerifyHistoryEntry } from "./types.js"

const VERSION = "0.1.0"

export class VerifyClient extends TickstemClient {
  constructor(apiKey: string, options: ClientOptions = {}) {
    super(apiKey, VERSION, options)
  }

  verify(email: string): Promise<EmailVerification> {
    return this.request<EmailVerification>("POST", "/verify", { email })
  }

  history(): Promise<VerifyHistoryEntry[]> {
    return this.request<{ verifications: VerifyHistoryEntry[] }>("GET", "/verify/history").then(
      (r) => r.verifications
    )
  }
}
