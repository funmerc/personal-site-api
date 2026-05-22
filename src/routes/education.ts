import { Hono } from 'hono'
import type { EducationResponse } from '../types'

const app = new Hono<{ Bindings: Env }>()

interface EducationRow {
  name: string
  graduation_date: string
  degree_title: string
  coursework_json: string
}

app.get('/', async (ctx) => {
  const { results } = await ctx.env.personal_site_db
    .prepare(
      `SELECT
         education.name, education.graduation_date, education.degree_title,
         COALESCE((
           SELECT json_group_array(value) FROM (
             SELECT value FROM education_coursework
             WHERE education_id = education.id ORDER BY position
           )
         ), '[]') AS coursework_json
       FROM education
       ORDER BY education.position`,
    )
    .all<EducationRow>()

  const body: EducationResponse = {
    items: results.map((educationRow) => ({
      name: educationRow.name,
      graduation_date: educationRow.graduation_date,
      degree_title: educationRow.degree_title,
      relevant_coursework: JSON.parse(educationRow.coursework_json) as string[],
    })),
  }
  return ctx.json(body)
})

export default app
