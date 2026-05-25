# personal-site-api

Cloudflare Worker (TypeScript + Hono) backing [jasonrice.me](https://jasonrice.me). Read-only JSON API over a D1 database; the site swaps from bundled content to this API by changing a base URL.

## Endpoints

| Method | Path | Returns |
|---|---|---|
| GET | `/` | `{ ok: true }` (health) |
| GET | `/projects` · `/projects/:slug` | Project list / detail |
| GET | `/demos` · `/demos/:slug` | Demo list / detail |
| GET | `/notes` · `/notes/:slug` | Note list / detail |
| GET | `/recent?limit=N` | Cross-kind feed (default 5, clamped 1–50) |
| GET | `/about` · `/status` · `/education` · `/work` · `/uses` | Profile singletons |

CORS is locked to `GET` from `https://jasonrice.me`. Localhost origins (`http://localhost:*` / `http://127.0.0.1:*`) are additionally allowed only in local dev, gated on `ENVIRONMENT === "development"` (set via `.dev.vars`, see [Setup](#setup)); in production they're rejected.

## Rate limits

Every endpoint is rate-limited to **60 requests per 60 seconds per IP** via Cloudflare's Workers Rate Limit binding (`CF-Connecting-IP` is the key, so each visitor's browser has its own bucket). When the limit is exceeded the API responds:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{ "error": "rate_limited" }
```

Consumers should read `Retry-After` and back off before retrying.

## Setup

```sh
git clone https://github.com/funmerc/personal-site-api.git
cd personal-site-api
npm install
```

`wrangler.jsonc` is gitignored (it holds your D1 `database_id`). Create one locally:

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "personal-site-api",
	"main": "src/index.ts",
	"compatibility_date": "2026-05-22",
	"compatibility_flags": ["nodejs_compat"],
	"observability": { "enabled": true },
	"upload_source_maps": true,
	"vars": { "ENVIRONMENT": "production" },
	"d1_databases": [
		{
			"binding": "personal_site_db",
			"database_name": "personal-site-db",
			"database_id": "<your-d1-database-id>"
		}
	],
	"ratelimits": [
		{
			"name": "RATE_LIMITER",
			"namespace_id": "1001",
			"simple": { "limit": 60, "period": 60 }
		}
	]
}
```

Copy the local env template (it sets `ENVIRONMENT="development"`, which enables localhost CORS under `npm run dev`):

```sh
cp .dev.vars.example .dev.vars
```

Then apply migrations to the local D1:

```sh
npm run db:migrate:local
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server at `http://localhost:8787` |
| `npm test` | Run vitest suite |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` |
| `npm run db:new -- <name>` | Scaffold the next migration |
| `npm run db:migrate:local` / `db:migrate:remote` | Apply pending migrations |
| `npm run db:status:local` / `db:status:remote` | List pending migrations |

## Project layout

```
src/
	index.ts          Hono app, CORS, route mounting
	routes/           One sub-app per domain (projects, demos, notes, …)
	lib/entries.ts    Shared content SQL (ENTRY_SELECT + mappers)
	types.ts          Response shapes (mirrors the site's content types 1:1)
migrations/         Versioned D1 schema
test/               Vitest suite (runs inside workerd)
```

Routes that read from `content_entries` (projects/demos/notes/recent) build on the shared `ENTRY_SELECT` in `src/lib/entries.ts` — keep that pattern when adding a new kind. Response shapes are a contract with the frontend; optional fields are omitted when null, not returned as `null`.

## Stack

- [Hono](https://hono.dev/) — router
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — runtime (workerd, `nodejs_compat` on)
- [D1](https://developers.cloudflare.com/d1/) — SQLite at the edge
- [Vitest](https://vitest.dev/) via [`@cloudflare/vitest-pool-workers`](https://www.npmjs.com/package/@cloudflare/vitest-pool-workers) — tests run inside workerd
