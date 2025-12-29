import { Hono } from 'hono'
import { readdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import type { LocalFlare } from 'localflare-core'

export function createDurableObjectRoutes(localflare: LocalFlare) {
  const app = new Hono()

  // List all Durable Object bindings
  app.get('/', async (c) => {
    const bindings = localflare.getDiscoveredBindings()
    return c.json({
      durableObjects: bindings?.durableObjects ?? [],
    })
  })

  // Discover existing DO instances from storage
  app.get('/instances', async (c) => {
    try {
      const bindings = localflare.getDiscoveredBindings()
      const options = localflare.getOptions()
      const configPath = resolve(options.configPath)
      const rootDir = dirname(configPath)
      const persistPath = resolve(rootDir, options.persistPath, 'do')

      const instances: Array<{ binding: string; class_name: string; id: string }> = []

      if (!existsSync(persistPath)) {
        return c.json({ instances })
      }

      // Scan DO storage directories
      const doDirs = readdirSync(persistPath, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))

      for (const doDir of doDirs) {
        // Folder name format: "{worker-name}-{class-name}" or "-{class-name}"
        const className = doDir.name.replace(/^-/, '').replace(/^.*-/, '')

        // Find matching binding
        const doBinding = bindings?.durableObjects.find(
          (d) => d.class_name.toLowerCase() === className.toLowerCase() ||
                 doDir.name.includes(d.class_name)
        )

        if (!doBinding) continue

        // Get all .sqlite files (each is a DO instance)
        const doPath = join(persistPath, doDir.name)
        const files = readdirSync(doPath)
          .filter((f) => f.endsWith('.sqlite') && !f.includes('-shm') && !f.includes('-wal'))

        for (const file of files) {
          const id = file.replace('.sqlite', '')
          instances.push({
            binding: doBinding.name,
            class_name: doBinding.class_name,
            id,
          })
        }
      }

      return c.json({ instances })
    } catch (error) {
      return c.json({ error: String(error), instances: [] }, 500)
    }
  })

  // Get or create a Durable Object stub by ID
  app.post('/:binding/id', async (c) => {
    try {
      const namespace = await localflare.getDurableObjectNamespace(c.req.param('binding'))
      const { name, id } = await c.req.json<{ name?: string; id?: string }>()

      let doId
      if (id) {
        doId = namespace.idFromString(id)
      } else if (name) {
        doId = namespace.idFromName(name)
      } else {
        doId = namespace.newUniqueId()
      }

      return c.json({
        id: doId.toString(),
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Send a fetch request to a Durable Object
  app.all('/:binding/:id/fetch/*', async (c) => {
    try {
      const namespace = await localflare.getDurableObjectNamespace(c.req.param('binding'))
      const idStr = c.req.param('id')
      const pathParts = c.req.path.split('/fetch')
      const path = pathParts[1] || '/'

      const doId = namespace.idFromString(idStr)
      const stub = namespace.get(doId)

      // Build the URL for the DO request
      const doUrl = `http://do.internal${path}`

      // Forward the request to the DO
      const response = await stub.fetch(doUrl, {
        method: c.req.method,
        headers: Object.fromEntries(c.req.raw.headers.entries()),
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.text() : undefined,
      })

      // Return the DO response
      const responseBody = await response.text()
      return new Response(responseBody, {
        status: response.status,
        headers: response.headers,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  return app
}
