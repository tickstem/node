export class APIError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
  ) {
    super(message)
    this.name = "APIError"
  }
}

export function isUnauthorized(err: unknown): err is APIError {
  return err instanceof APIError && err.statusCode === 401
}

export function isQuotaExceeded(err: unknown): err is APIError {
  return err instanceof APIError && err.statusCode === 402
}
