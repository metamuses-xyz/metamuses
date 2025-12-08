/**
 * Generic async queue system
 * Processes items one at a time in order
 */

export interface QueueHandler<T> {
  (ctx: {
    data: T
    emit: (event: string, ...args: any[]) => void
  }): void | Promise<void>
}

export interface QueueOptions<T> {
  handlers: QueueHandler<T>[]
}

export interface Queue<T> {
  enqueue: (item: T) => void
  clear: () => void
  onHandlerEvent: (event: string, handler: (...args: any[]) => void) => void
}

export function createQueue<T>(options: QueueOptions<T>): Queue<T> {
  const queue: T[] = []
  const eventHandlers: Record<string, Array<(...args: any[]) => void>> = {}
  let processing = false

  async function processQueue() {
    if (processing || queue.length === 0) return

    processing = true

    while (queue.length > 0) {
      const item = queue.shift()!
      
      const ctx = {
        data: item,
        emit: (event: string, ...args: any[]) => {
          const handlers = eventHandlers[event] || []
          handlers.forEach(handler => handler(...args))
        },
      }

      for (const handler of options.handlers) {
        await handler(ctx)
      }
    }

    processing = false
  }

  return {
    enqueue: (item: T) => {
      queue.push(item)
      processQueue()
    },
    
    clear: () => {
      queue.length = 0
    },
    
    onHandlerEvent: (event: string, handler: (...args: any[]) => void) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = []
      }
      eventHandlers[event].push(handler)
    },
  }
}
