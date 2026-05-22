import type { Demo, Note, Project, Status } from '../types'

// Shared SELECT for content_entries with tags/tech aggregated to JSON arrays.
// Append a WHERE / ORDER BY in the caller.
export const ENTRY_SELECT = `
  SELECT
    entry.id, entry.kind, entry.slug, entry.title, entry.summary, entry.body, entry.date, entry.status,
    entry.cover, entry.role, entry.period, entry.featured, entry.embed, entry.reading_minutes,
    entry.link_live, entry.link_repo, entry.link_demo,
    COALESCE((
      SELECT json_group_array(name) FROM (
        SELECT tags.name FROM entry_tags
        JOIN tags ON tags.id = entry_tags.tag_id
        WHERE entry_tags.entry_id = entry.id
        ORDER BY tags.name
      )
    ), '[]') AS tags_json,
    COALESCE((
      SELECT json_group_array(name) FROM (
        SELECT tech.name FROM entry_tech
        JOIN tech ON tech.id = entry_tech.tech_id
        WHERE entry_tech.entry_id = entry.id
        ORDER BY tech.name
      )
    ), '[]') AS tech_json
  FROM content_entries entry
`

export interface ContentRow {
  id: number
  kind: 'project' | 'demo' | 'note'
  slug: string
  title: string
  summary: string
  body: string | null
  date: string
  status: string
  cover: string | null
  role: string | null
  period: string | null
  featured: number | null
  embed: string | null
  reading_minutes: number | null
  link_live: string | null
  link_repo: string | null
  link_demo: string | null
  tags_json: string
  tech_json: string
}

const parseStringArray = (json: string): string[] => JSON.parse(json) as string[]

function baseEntry(row: ContentRow) {
  const tags = parseStringArray(row.tags_json)
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    date: row.date,
    status: row.status as Status,
    ...(tags.length > 0 && { tags }),
  }
}

export function mapProject(row: ContentRow): Project {
  const links: NonNullable<Project['links']> = {}
  if (row.link_live) links.live = row.link_live
  if (row.link_repo) links.repo = row.link_repo
  if (row.link_demo) links.demo = row.link_demo

  return {
    ...baseEntry(row),
    tech: parseStringArray(row.tech_json),
    ...(row.role && { role: row.role as Project['role'] }),
    ...(row.period && { period: row.period }),
    ...(row.cover && { cover: row.cover }),
    ...(row.featured === 1 && { featured: true }),
    ...(row.body && { body: row.body }),
    ...(Object.keys(links).length > 0 && { links }),
  }
}

export function mapDemo(row: ContentRow): Demo {
  const links: NonNullable<Demo['links']> = {}
  if (row.link_live) links.live = row.link_live
  if (row.link_repo) links.repo = row.link_repo

  return {
    ...baseEntry(row),
    tech: parseStringArray(row.tech_json),
    ...(row.cover && { cover: row.cover }),
    ...(row.body && { body: row.body }),
    ...(row.embed && { embed: row.embed }),
    ...(Object.keys(links).length > 0 && { links }),
  }
}

export function mapNote(row: ContentRow): Note {
  return {
    ...baseEntry(row),
    body: row.body ?? '',
    ...(row.reading_minutes !== null && { readingMinutes: row.reading_minutes }),
  }
}
