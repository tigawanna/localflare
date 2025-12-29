import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TaskDone01Icon,
  Sent02Icon,
  InformationCircleIcon,
  CheckmarkCircle02Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { queuesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { DataTableLoading } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

interface SentMessage {
  id: number
  binding: string
  queue: string
  body: unknown
  timestamp: Date
}

export function QueuesExplorer() {
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)
  const [messageBody, setMessageBody] = useState('{\n  "type": "task",\n  "data": "example"\n}')
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([])

  const { data: queues, isLoading } = useQuery({
    queryKey: ["queues"],
    queryFn: queuesApi.list,
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ binding, message }: { binding: string; message: unknown }) =>
      queuesApi.send(binding, message),
    onSuccess: (_, variables) => {
      // Track sent message
      const producer = producers.find(p => p.binding === variables.binding)
      setSentMessages(prev => [{
        id: Date.now(),
        binding: variables.binding,
        queue: producer?.queue ?? "",
        body: variables.message,
        timestamp: new Date(),
      }, ...prev].slice(0, 20)) // Keep last 20
    },
  })

  const handleSendMessage = () => {
    if (!selectedQueue || !messageBody.trim()) return

    try {
      const message = JSON.parse(messageBody)
      sendMessageMutation.mutate({ binding: selectedQueue, message })
    } catch {
      // If not valid JSON, send as string
      sendMessageMutation.mutate({ binding: selectedQueue, message: messageBody })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <DataTableLoading />
      </div>
    )
  }

  const producers = queues?.producers ?? []
  const consumers = queues?.consumers ?? []

  // Find matching consumer for selected producer
  const selectedProducer = producers.find(p => p.binding === selectedQueue)
  const matchingConsumer = consumers.find(c => c.queue === selectedProducer?.queue)

  if (!producers.length) {
    return (
      <div className="p-6">
        <PageHeader
          icon={TaskDone01Icon}
          iconColor="text-queues"
          title="Queues"
          description="Cloudflare Queues for async message processing"
        />
        <EmptyState
          icon={TaskDone01Icon}
          title="No Queues configured"
          description="Add a Queue binding to your wrangler.toml to get started"
          className="mt-8"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={TaskDone01Icon}
          iconColor="text-queues"
          title="Queues"
          description="Cloudflare Queues for async message processing"
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={Sent02Icon}
            iconColor="text-queues"
            label="Producers"
            value={producers.length}
            description="Send messages"
          />
          <StatsCard
            icon={Settings02Icon}
            iconColor="text-muted-foreground"
            label="Consumers"
            value={consumers.length}
            description="Process messages"
          />
          <StatsCard
            icon={CheckmarkCircle02Icon}
            iconColor="text-green-500"
            label="Sent (Session)"
            value={sentMessages.length}
            description="This session"
          />
        </StatsCardGroup>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Queue List */}
        <div className="w-64 border-r border-border flex flex-col bg-muted/30">
          <div className="p-3 border-b border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Producers (Send Messages)
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {producers.map((producer) => (
                <button
                  key={producer.binding}
                  onClick={() => setSelectedQueue(producer.binding)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors",
                    selectedQueue === producer.binding
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={Sent02Icon}
                    className={cn("size-4", selectedQueue === producer.binding && "text-queues")}
                    strokeWidth={2}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{producer.binding}</div>
                    <div className="text-[10px] opacity-60 truncate">{producer.queue}</div>
                  </div>
                </button>
              ))}
            </div>

            {consumers.length > 0 && (
              <>
                <div className="p-3 border-t border-b border-border mt-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Consumers (Process Messages)
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {consumers.map((consumer) => (
                    <div
                      key={consumer.queue}
                      className="px-3 py-2 rounded-md text-sm text-muted-foreground"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <HugeiconsIcon icon={Settings02Icon} className="size-4" strokeWidth={2} />
                        <span className="truncate font-medium">{consumer.queue}</span>
                      </div>
                      <div className="ml-6 text-[10px] space-y-0.5 opacity-70">
                        <div>Batch: {consumer.max_batch_size} msgs</div>
                        <div>Timeout: {consumer.max_batch_timeout}s</div>
                        <div>Retries: {consumer.max_retries}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedQueue ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-2xl space-y-6">
                {/* How it works info */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <HugeiconsIcon icon={InformationCircleIcon} className="size-5 text-blue-500 mt-0.5" strokeWidth={2} />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-blue-600">How Cloudflare Queues Work</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-600/80">
                        <li><strong>Producer</strong> sends messages to the queue (what you do here)</li>
                        <li><strong>Queue</strong> holds messages until a consumer is ready</li>
                        <li><strong>Consumer</strong> receives batches and processes them</li>
                        <li><strong>Output</strong> appears in your <code className="bg-blue-500/20 px-1 rounded">terminal logs</code></li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Send Message Section */}
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Sent02Icon} className="size-5 text-queues" strokeWidth={2} />
                    <h3 className="text-base font-semibold">Send Message</h3>
                    <span className="text-xs text-muted-foreground">
                      to <code className="bg-muted px-1 rounded">{selectedProducer?.queue}</code>
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Message Body (JSON or text)</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder='{"type": "task", "data": "hello"}'
                      className="mt-1.5 w-full min-h-40 p-3 rounded-md border border-input bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {sendMessageMutation.isError && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {String(sendMessageMutation.error)}
                    </div>
                  )}

                  {sendMessageMutation.isSuccess && (
                    <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" strokeWidth={2} />
                      Message sent! Check your terminal for consumer output.
                    </div>
                  )}

                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageBody.trim() || sendMessageMutation.isPending}
                  >
                    <HugeiconsIcon icon={Sent02Icon} className="size-4 mr-1.5" strokeWidth={2} />
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>

                {/* Consumer Config */}
                {matchingConsumer && (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HugeiconsIcon icon={Settings02Icon} className="size-5 text-muted-foreground" strokeWidth={2} />
                      <h3 className="text-sm font-semibold">Consumer Configuration</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-xs text-muted-foreground">Max Batch Size</div>
                        <div className="font-mono text-sm">{matchingConsumer.max_batch_size} messages</div>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-xs text-muted-foreground">Max Batch Timeout</div>
                        <div className="font-mono text-sm">{matchingConsumer.max_batch_timeout} seconds</div>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-xs text-muted-foreground">Max Retries</div>
                        <div className="font-mono text-sm">{matchingConsumer.max_retries}</div>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-xs text-muted-foreground">Dead Letter Queue</div>
                        <div className="font-mono text-sm">{matchingConsumer.dead_letter_queue ?? "None"}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Consumer waits up to {matchingConsumer.max_batch_timeout}s or {matchingConsumer.max_batch_size} messages before processing a batch.
                    </p>
                  </div>
                )}

                {/* Sent Messages History */}
                {sentMessages.length > 0 && (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-500" strokeWidth={2} />
                        Recently Sent Messages
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setSentMessages([])}>
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sentMessages.map((msg) => (
                        <div key={msg.id} className="p-3 bg-muted rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{msg.binding}</span>
                            <span className="text-xs text-muted-foreground">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                            {typeof msg.body === "string" ? msg.body : JSON.stringify(msg.body, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <HugeiconsIcon icon={TaskDone01Icon} className="size-12 text-muted-foreground/50 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold mb-2">Select a Producer</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a queue producer from the sidebar to send messages.
                </p>
                <div className="p-4 rounded-lg bg-muted/50 text-left text-sm">
                  <p className="font-medium mb-2">Quick Guide:</p>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>1. Select a producer (e.g., TASKS)</li>
                    <li>2. Enter a JSON message</li>
                    <li>3. Click Send Message</li>
                    <li>4. Check your terminal for consumer output</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
