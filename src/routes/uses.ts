import { Hono } from 'hono'
import type { UsesResponse } from '../types'

const app = new Hono<{ Bindings: Env }>()

interface UsesSectionRow {
  label: string
  items_json: string
}

app.get('/', async (ctx) => {
  const { results } = await ctx.env.personal_site_db
    .prepare(
      `SELECT
         uses_sections.label,
         COALESCE((
           SELECT json_group_array(value) FROM (
             SELECT value FROM uses_items
             WHERE section_id = uses_sections.id ORDER BY position
           )
         ), '[]') AS items_json
       FROM uses_sections
       ORDER BY uses_sections.position`,
    )
    .all<UsesSectionRow>()

  const body: UsesResponse = {
    sections: results.map((sectionRow) => ({
      label: sectionRow.label,
      items: JSON.parse(sectionRow.items_json) as string[],
    })),
  }
  return ctx.json(body)
})

export default app
