import { Hono } from 'hono'
import type { LocalFlare } from 'localflare-core'

export function createBindingsRoutes(localflare: LocalFlare) {
  const app = new Hono()

  // Get all discovered bindings summary
  app.get('/', async (c) => {
    const bindings = localflare.getDiscoveredBindings()
    const config = localflare.getConfig()

    if (!bindings) {
      return c.json({ error: 'No bindings discovered' }, 500)
    }

    return c.json({
      name: config?.name ?? 'unknown',
      bindings: {
        d1: bindings.d1.map((d) => ({
          type: 'D1',
          binding: d.binding,
          database_name: d.database_name,
        })),
        kv: bindings.kv.map((k) => ({
          type: 'KV',
          binding: k.binding,
        })),
        r2: bindings.r2.map((r) => ({
          type: 'R2',
          binding: r.binding,
          bucket_name: r.bucket_name,
        })),
        durableObjects: bindings.durableObjects.map((d) => ({
          type: 'DurableObject',
          name: d.name,
          binding: d.name,
          class_name: d.class_name,
          script_name: d.script_name,
        })),
        queues: {
          producers: bindings.queues.producers.map((q) => ({
            type: 'Queue',
            binding: q.binding,
            queue: q.queue,
          })),
          consumers: bindings.queues.consumers.map((q) => ({
            type: 'QueueConsumer',
            queue: q.queue,
          })),
        },
        vars: Object.entries(bindings.vars).map(([key, value]) => ({
          type: 'Var',
          key,
          value: value.length > 50 ? value.slice(0, 50) + '...' : value,
        })),
      },
    })
  })

  return app
}
