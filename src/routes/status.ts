import { Hono } from 'hono'
import type { StatusResponse } from '../types'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (ctx) => {
  const row = await ctx.env.personal_site_db
    .prepare(`SELECT currently, next, future FROM status WHERE id = 1`)
    .first<StatusResponse>()

  if (!row) return ctx.json({ error: 'not initialized' }, 404)
  return ctx.json(row)
})

export default app
