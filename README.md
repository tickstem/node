# tickstem/node

[![npm](https://img.shields.io/npm/v/@tickstem/cron)](https://www.npmjs.com/package/@tickstem/cron)
[![CI](https://github.com/tickstem/node/actions/workflows/ci.yml/badge.svg)](https://github.com/tickstem/node/actions/workflows/ci.yml)

Node.js SDKs for [Tickstem](https://tickstem.dev) — developer infrastructure primitives available under a single API key.

| Package | Description | npm |
|---------|-------------|-----|
| [`@tickstem/core`](packages/core) | Shared HTTP client and error types | [![npm](https://img.shields.io/npm/v/@tickstem/core)](https://www.npmjs.com/package/@tickstem/core) |
| [`@tickstem/cron`](packages/cron) | Cron job scheduling | [![npm](https://img.shields.io/npm/v/@tickstem/cron)](https://www.npmjs.com/package/@tickstem/cron) |
| [`@tickstem/verify`](packages/verify) | Email verification | [![npm](https://img.shields.io/npm/v/@tickstem/verify)](https://www.npmjs.com/package/@tickstem/verify) |

Works with JavaScript and TypeScript. Get your API key at [app.tickstem.dev](https://app.tickstem.dev).

---

## @tickstem/cron

Reliable cron jobs for production apps. Works on Vercel, Railway, Render, Fly.io, and anywhere else that can't run an always-on scheduler.

### Install

```bash
npm install @tickstem/cron
# or
pnpm add @tickstem/cron
```

### Quick start

**TypeScript**
```ts
import { CronClient } from "@tickstem/cron"

const cron = new CronClient(process.env.TICKSTEM_API_KEY!)

const job = await cron.register({
  name: "daily-cleanup",
  schedule: "0 2 * * *",
  endpoint: "https://yourapp.com/jobs/cleanup",
})

console.log(`job registered: ${job.id} (next run: ${job.next_run_at})`)
```

**JavaScript**
```js
import { CronClient } from "@tickstem/cron"

const cron = new CronClient(process.env.TICKSTEM_API_KEY)

const job = await cron.register({
  name: "daily-cleanup",
  schedule: "0 2 * * *",
  endpoint: "https://yourapp.com/jobs/cleanup",
})

console.log(`job registered: ${job.id} (next run: ${job.next_run_at})`)
```

### Usage

#### List jobs

```ts
const jobs = await cron.list()
for (const job of jobs) {
  console.log(job.id, job.schedule, job.status)
}
```

#### Register a job

```ts
const job = await cron.register({
  name: "send-digest",
  description: "Weekly email digest to all users",
  schedule: "0 9 * * 1",                        // every Monday at 09:00 UTC
  endpoint: "https://yourapp.com/jobs/digest",
  method: "POST",                                // default
  timeout_secs: 60,                              // default: 30
})
```

#### Get, pause, resume, delete

```ts
const job = await cron.get("job_abc123")
await cron.pause(jobId)
await cron.resume(jobId)
await cron.delete(jobId)
```

#### Execution history

```ts
const executions = await cron.executions(jobId)
for (const e of executions) {
  console.log(e.id, e.status, e.duration_ms)
}
```

### Securing your endpoint

Add a shared secret to the job headers and validate it in your handler:

```ts
const job = await cron.register({
  name: "daily-cleanup",
  schedule: "0 2 * * *",
  endpoint: "https://yourapp.com/jobs/cleanup",
  headers: { "X-Tickstem-Secret": process.env.CRON_SECRET },
})
```

Next.js Route Handler example:

```ts
// TypeScript
export async function POST(req: Request) {
  if (req.headers.get("x-tickstem-secret") !== process.env.CRON_SECRET) {
    return new Response("unauthorized", { status: 401 })
  }
  // ... do work
}
```

```js
// JavaScript
export async function POST(req) {
  if (req.headers.get("x-tickstem-secret") !== process.env.CRON_SECRET) {
    return new Response("unauthorized", { status: 401 })
  }
  // ... do work
}
```

Use `openssl rand -hex 32` to generate a secret. Store it as an environment variable in both your app and your Tickstem job.

---

## @tickstem/verify

Email verification that catches bad addresses before they reach your database.

### Install

```bash
npm install @tickstem/verify
# or
pnpm add @tickstem/verify
```

### Quick start

**TypeScript**
```ts
import { VerifyClient } from "@tickstem/verify"

const verify = new VerifyClient(process.env.TICKSTEM_API_KEY!)

const result = await verify.verify("user@example.com")

if (!result.valid) {
  console.log(result.reason) // human-readable explanation
}
```

**JavaScript**
```js
import { VerifyClient } from "@tickstem/verify"

const verify = new VerifyClient(process.env.TICKSTEM_API_KEY)

const result = await verify.verify("user@example.com")

if (!result.valid) {
  console.log(result.reason)
}
```

### What it checks

| Check | What it catches | Why it matters |
|-------|----------------|----------------|
| Syntax | Malformed addresses | Reject obviously bad input before any network call |
| MX lookup | Domains with no mail server | Catch typos and dead domains |
| Disposable | Throwaway services (Mailinator, etc.) | Block single-use signups |
| Role-based | Generic inboxes (admin@, support@, etc.) | Flag addresses not tied to a real person |

### Check for specific issues

```ts
const result = await verify.verify(email)

if (result.disposable) {
  return { error: "Disposable email addresses are not allowed." }
}
if (result.role_based) {
  return { error: "Please use a personal email address." }
}
if (!result.mx_found) {
  return { error: "This email domain doesn't accept mail." }
}
```

### Verification history

```ts
const history = await verify.history()
```

---

## Error handling

Both clients throw `APIError` on non-2xx responses:

```ts
// TypeScript
import { isUnauthorized, isQuotaExceeded, APIError } from "@tickstem/cron"

try {
  await cron.list()
} catch (err) {
  if (isUnauthorized(err)) {
    // invalid API key
  }
  if (isQuotaExceeded(err)) {
    // monthly quota hit — upgrade at app.tickstem.dev/dashboard/billing
  }
  if (err instanceof APIError) {
    console.log(err.statusCode, err.message)
  }
}
```

```js
// JavaScript
import { isUnauthorized, isQuotaExceeded, APIError } from "@tickstem/cron"

try {
  await cron.list()
} catch (err) {
  if (isUnauthorized(err)) { /* invalid key */ }
  if (isQuotaExceeded(err)) { /* quota hit */ }
  if (err instanceof APIError) {
    console.log(err.statusCode, err.message)
  }
}
```

---

## Cron expression reference

```
┌─────── minute        (0–59)
│ ┌───── hour          (0–23)
│ │ ┌─── day of month  (1–31)
│ │ │ ┌─ month         (1–12)
│ │ │ │ ┌ day of week  (0–6, Sun=0)
│ │ │ │ │
* * * * *

Examples:
  0 * * * *      every hour
  */15 * * * *   every 15 minutes
  0 2 * * *      daily at 02:00 UTC
  0 9 * * 1      every Monday at 09:00 UTC
  0 0 1 * *      first day of every month
```

Use [crontab.guru](https://crontab.guru) to build and validate expressions.

---

## Pricing

| Plan     | Cron exec/mo | Email verify/mo | Price  |
|----------|-------------|-----------------|--------|
| Free     | 1,000       | 500             | $0     |
| Starter  | 10,000      | 5,000           | $12/mo |
| Pro      | 100,000     | 50,000          | $29/mo |
| Business | 1,000,000   | 500,000         | $79/mo |

[View full pricing →](https://tickstem.dev/#pricing)

---

## Requirements

- Node.js 18+ (uses native `fetch`)
- ESM — add `"type": "module"` to your `package.json`, or use a bundler (Next.js, Vite, esbuild)

## License

MIT
