import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseToml } from 'toml'
import type { WranglerConfig, DiscoveredBindings } from './types.js'

export function parseWranglerConfig(configPath: string): WranglerConfig {
  const fullPath = resolve(configPath)

  if (!existsSync(fullPath)) {
    throw new Error(`Wrangler config not found at: ${fullPath}`)
  }

  const content = readFileSync(fullPath, 'utf-8')
  return parseToml(content) as WranglerConfig
}

export function discoverBindings(config: WranglerConfig): DiscoveredBindings {
  return {
    d1: config.d1_databases ?? [],
    kv: config.kv_namespaces ?? [],
    r2: config.r2_buckets ?? [],
    durableObjects: config.durable_objects?.bindings ?? [],
    queues: {
      producers: config.queues?.producers ?? [],
      consumers: config.queues?.consumers ?? [],
    },
    vars: config.vars ?? {},
  }
}

export function getBindingSummary(bindings: DiscoveredBindings): string[] {
  const summary: string[] = []

  if (bindings.d1.length > 0) {
    summary.push(`D1 Databases: ${bindings.d1.map(d => d.binding).join(', ')}`)
  }
  if (bindings.kv.length > 0) {
    summary.push(`KV Namespaces: ${bindings.kv.map(k => k.binding).join(', ')}`)
  }
  if (bindings.r2.length > 0) {
    summary.push(`R2 Buckets: ${bindings.r2.map(r => r.binding).join(', ')}`)
  }
  if (bindings.durableObjects.length > 0) {
    summary.push(`Durable Objects: ${bindings.durableObjects.map(d => d.name).join(', ')}`)
  }
  if (bindings.queues.producers.length > 0) {
    summary.push(`Queue Producers: ${bindings.queues.producers.map(q => q.binding).join(', ')}`)
  }
  if (bindings.queues.consumers.length > 0) {
    summary.push(`Queue Consumers: ${bindings.queues.consumers.map(q => q.queue).join(', ')}`)
  }
  if (Object.keys(bindings.vars).length > 0) {
    summary.push(`Environment Variables: ${Object.keys(bindings.vars).join(', ')}`)
  }

  return summary
}
