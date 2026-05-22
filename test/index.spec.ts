import { SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

describe('root', () => {
  it('GET / responds with ok payload', async () => {
    const res = await SELF.fetch('https://example.com/')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('unknown routes return 404 JSON', async () => {
    const res = await SELF.fetch('https://example.com/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'not found' })
  })
})
