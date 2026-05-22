import { Hono } from 'hono'
import {
  ENTRY_SELECT,
  mapDemo,
  mapNote,
  mapProject,
  type ContentRow,
} from '../lib/entries'
import type { RecentItem } from '../types'

const app = new Hono<{ Bindings: Env }>()

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 50

app.get('/', async (ctx) => {
  const limitParam = ctx.req.query('limit')
  const parsed = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT
  const limit = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  const { results } = await ctx.env.personal_site_db
    .prepare(
      `${ENTRY_SELECT}
       WHERE entry.status = 'published'
       ORDER BY entry.date DESC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<ContentRow>()

  const items: RecentItem[] = results.map((row): RecentItem => {
    if (row.kind === 'project') return { ...mapProject(row), kind: 'projects' }
    if (row.kind === 'demo') return { ...mapDemo(row), kind: 'demos' }
    return { ...mapNote(row), kind: 'notes' }
  })

  return ctx.json(items)
})

export default app
