import { Hono } from 'hono'
import type { WorkRole, WorkSection } from '../types'

const app = new Hono<{ Bindings: Env }>()

interface RoleRow {
  id: number
  company_title: string
  work_date_range: string
  job_title: string
  job_location: string
}
interface SectionRow {
  id: number
  work_id: number
  label: string
}
interface ValueRow {
  section_id: number
  value: string
}

app.get('/', async (ctx) => {
  const database = ctx.env.personal_site_db
  const [rolesResult, sectionsResult, valuesResult] = await database.batch<
    RoleRow | SectionRow | ValueRow
  >([
    database.prepare(
      `SELECT id, company_title, work_date_range, job_title, job_location
       FROM work_experience ORDER BY position`,
    ),
    database.prepare(
      `SELECT id, work_id, label FROM work_sections ORDER BY position`,
    ),
    database.prepare(
      `SELECT section_id, value FROM work_section_values ORDER BY position`,
    ),
  ])

  const valuesBySection = new Map<number, string[]>()
  for (const valueRow of valuesResult.results as ValueRow[]) {
    const existing = valuesBySection.get(valueRow.section_id) ?? []
    existing.push(valueRow.value)
    valuesBySection.set(valueRow.section_id, existing)
  }

  const sectionsByRole = new Map<number, WorkSection[]>()
  for (const sectionRow of sectionsResult.results as SectionRow[]) {
    const existing = sectionsByRole.get(sectionRow.work_id) ?? []
    existing.push({
      label: sectionRow.label,
      values: valuesBySection.get(sectionRow.id) ?? [],
    })
    sectionsByRole.set(sectionRow.work_id, existing)
  }

  const body: WorkRole[] = (rolesResult.results as RoleRow[]).map((roleRow) => ({
    companyTitle: roleRow.company_title,
    workDateRange: roleRow.work_date_range,
    jobTitle: roleRow.job_title,
    jobLocation: roleRow.job_location,
    sections: sectionsByRole.get(roleRow.id) ?? [],
  }))

  return ctx.json(body)
})

export default app
