import { Hono } from 'hono'
import { cors } from 'hono/cors'
import about from './routes/about'
import demos from './routes/demos'
import education from './routes/education'
import notes from './routes/notes'
import projects from './routes/projects'
import recent from './routes/recent'
import status from './routes/status'
import uses from './routes/uses'
import work from './routes/work'

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (origin === 'https://jasonrice.me') return origin
      if (origin?.startsWith('http://localhost:')) return origin
      if (origin?.startsWith('http://127.0.0.1:')) return origin
      return null
    },
    allowMethods: ['GET'],
    maxAge: 86400,
  }),
)

app.use('*', async (ctx, next) => {
  const ip = ctx.req.header('CF-Connecting-IP') ?? 'unknown'
  const { success } = await ctx.env.RATE_LIMITER.limit({ key: ip })
  if (!success) {
    return ctx.json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' })
  }
  return next()
})

app.get('/', (ctx) => ctx.json({ ok: true }))

app.route('/projects', projects)
app.route('/demos', demos)
app.route('/notes', notes)
app.route('/recent', recent)
app.route('/about', about)
app.route('/status', status)
app.route('/education', education)
app.route('/work', work)
app.route('/uses', uses)

app.notFound((ctx) => ctx.json({ error: 'not found' }, 404))
app.onError((error, ctx) => {
  console.error(error)
  return ctx.json({ error: 'internal' }, 500)
})

export default app
