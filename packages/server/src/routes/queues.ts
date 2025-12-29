import { Hono } from 'hono'
import type { LocalFlare } from 'localflare-core'

export function createQueueRoutes(localflare: LocalFlare) {
  const app = new Hono()

  // List all queue producers and consumers with full configuration
  app.get('/', async (c) => {
    const bindings = localflare.getDiscoveredBindings()

    // Map consumers with their configuration (with defaults)
    const consumers = (bindings?.queues.consumers ?? []).map(consumer => ({
      queue: consumer.queue,
      max_batch_size: consumer.max_batch_size ?? 10,
      max_batch_timeout: consumer.max_batch_timeout ?? 5,
      max_retries: consumer.max_retries ?? 3,
      dead_letter_queue: consumer.dead_letter_queue,
    }))

    return c.json({
      producers: bindings?.queues.producers ?? [],
      consumers,
    })
  })

  // Send a message to a queue
  app.post('/:binding/send', async (c) => {
    try {
      const queue = await localflare.getQueueProducer(c.req.param('binding'))
      const body = await c.req.json<{ message: unknown; options?: { delaySeconds?: number } }>()

      await queue.send(body.message, body.options)

      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Send batch of messages
  app.post('/:binding/send-batch', async (c) => {
    try {
      const queue = await localflare.getQueueProducer(c.req.param('binding'))
      const { messages } = await c.req.json<{
        messages: Array<{ body: unknown; delaySeconds?: number }>
      }>()

      await queue.sendBatch(messages)

      return c.json({ success: true, sent: messages.length })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  return app
}
