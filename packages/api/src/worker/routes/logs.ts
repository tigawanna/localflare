import { Hono } from 'hono'
import type { Env } from '../types.js'
import { logStore, sseManager } from '../utils/request-store.js'

export function createLogsRoutes() {
  const app = new Hono<{ Bindings: Env }>()

  // Get recent logs
  app.get('/', (c) => {
    const limit = parseInt(c.req.query('limit') || '100')
    const logs = logStore.getRecent(limit)
    return c.json({ logs })
  })

  // Clear logs
  app.delete('/', (c) => {
    logStore.clear()
    return c.json({ success: true })
  })

  // SSE stream endpoint - streams both logs and requests
  app.get('/stream', (c) => {
    const { response } = sseManager.createStream()
    return response
  })

  // Add a custom log entry (for testing or user-triggered logs)
  app.post('/', async (c) => {
    try {
      const body = await c.req.json<{
        level?: 'log' | 'info' | 'warn' | 'error' | 'debug'
        message: string
        data?: unknown
        source?: 'worker' | 'queue' | 'do' | 'system'
      }>()

      if (!body.message) {
        return c.json({ error: 'message is required' }, 400)
      }

      logStore.log(
        body.level || 'info',
        body.message,
        body.data,
        body.source || 'system'
      )

      return c.json({ success: true })
    } catch {
      return c.json({ error: 'Invalid request body' }, 400)
    }
  })

  return app
}
