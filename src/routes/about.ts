import { Hono } from 'hono'
import type { AboutResponse } from '../types'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (ctx) => {
  const row = await ctx.env.personal_site_db
    .prepare(
      `SELECT
         about.why,
         COALESCE((
           SELECT json_group_array(value) FROM (
             SELECT value FROM about_interests ORDER BY position
           )
         ), '[]') AS interests_json,
         COALESCE((
           SELECT json_group_array(value) FROM (
             SELECT value FROM about_goals ORDER BY position
           )
         ), '[]') AS goals_json
       FROM about
       WHERE about.id = 1`,
    )
    .first<{ why: string; interests_json: string; goals_json: string }>()

  if (!row) return ctx.json({ error: 'not initialized' }, 404)

  const body: AboutResponse = {
    interests: JSON.parse(row.interests_json) as string[],
    goals: JSON.parse(row.goals_json) as string[],
    why: row.why,
  }
  return ctx.json(body)
})

export default app
