import { APIError } from "./errors.js"

export const DEFAULT_BASE_URL = "https://api.tickstem.dev/v1"

export interface ClientOptions {
  baseURL?: string
}

export class TickstemClient {
  protected readonly apiKey: string
  protected readonly baseURL: string
  protected readonly sdkVersion: string

  constructor(apiKey: string, sdkVersion: string, options: ClientOptions = {}) {
    this.apiKey = apiKey
    this.baseURL = options.baseURL ?? DEFAULT_BASE_URL
    this.sdkVersion = sdkVersion
  }

  protected async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `tickstem-node/${this.sdkVersion}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const text = await response.text()

    if (!response.ok) {
      let message = response.statusText
      try {
        const json = JSON.parse(text) as { error?: string; message?: string }
        message = json.error ?? json.message ?? message
      } catch {
        // use statusText fallback
      }
      throw new APIError(response.status, message)
    }

    return (text ? JSON.parse(text) : undefined) as T
  }
}
