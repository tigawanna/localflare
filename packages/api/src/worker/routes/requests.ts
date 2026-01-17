import { Hono } from 'hono'
import type { Env } from '../types.js'
import { requestStore } from '../utils/request-store.js'

export function createRequestsRoutes() {
  const app = new Hono<{ Bindings: Env }>()

  // Get all captured requests
  app.get('/', (c) => {
    const requests = requestStore.getAll()
    return c.json({
      requests,
      total: requests.length,
    })
  })

  // Get a specific request by ID
  app.get('/:id', (c) => {
    const id = c.req.param('id')
    const request = requestStore.get(id)

    if (!request) {
      return c.json({ error: 'Request not found' }, 404)
    }

    return c.json(request)
  })

  // Clear all captured requests
  app.delete('/', (c) => {
    requestStore.clear()
    return c.json({ success: true })
  })

  return app
}
