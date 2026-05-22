// Response shapes returned by the API. Mirror the original site's
// src/content/types.ts and src/data/types.ts so the frontend can swap from
// bundled JSON to live API with no shape changes.

export type Status = 'draft' | 'published'

export interface BaseEntry {
  slug: string
  title: string
  summary: string
  date: string
  status: Status
  tags?: string[]
}

export interface Project extends BaseEntry {
  tech: string[]
  role?: 'solo' | 'lead' | 'contributor'
  period?: string
  cover?: string
  featured?: boolean
  body?: string
  links?: {
    live?: string
    repo?: string
    demo?: string
  }
}

export interface Demo extends BaseEntry {
  tech: string[]
  cover?: string
  body?: string
  embed?: string
  links?: {
    live?: string
    repo?: string
  }
}

export interface Note extends BaseEntry {
  body: string
  readingMinutes?: number
}

export type RecentItem =
  | (Project & { kind: 'projects' })
  | (Demo & { kind: 'demos' })
  | (Note & { kind: 'notes' })

export interface AboutResponse {
  interests: string[]
  goals: string[]
  why: string
}

export interface StatusResponse {
  currently: string
  next: string
  future: string
}

export interface EducationItem {
  name: string
  graduation_date: string
  degree_title: string
  relevant_coursework: string[]
}

export interface EducationResponse {
  items: EducationItem[]
}

export interface WorkSection {
  label: string
  values: string[]
}

export interface WorkRole {
  companyTitle: string
  workDateRange: string
  jobTitle: string
  jobLocation: string
  sections: WorkSection[]
}

export interface UsesSection {
  label: string
  items: string[]
}

export interface UsesResponse {
  sections: UsesSection[]
}
