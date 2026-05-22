import { Hono } from 'hono'
import { ENTRY_SELECT, mapNote, type ContentRow } from '../lib/entries'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (ctx) => {
  const { results } = await ctx.env.personal_site_db
    .prepare(
      `${ENTRY_SELECT}
       WHERE entry.kind = 'note' AND entry.status = 'published'
       ORDER BY entry.date DESC`,
    )
    .all<ContentRow>()
  return ctx.json(results.map(mapNote))
})

app.get('/:slug', async (ctx) => {
  const row = await ctx.env.personal_site_db
    .prepare(
      `${ENTRY_SELECT}
       WHERE entry.kind = 'note' AND entry.status = 'published' AND entry.slug = ?1`,
    )
    .bind(ctx.req.param('slug'))
    .first<ContentRow>()
  if (!row) return ctx.json({ error: 'not found' }, 404)
  return ctx.json(mapNote(row))
})

export default app
