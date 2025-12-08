/**
 * LLM Marker Parser
 * Parses streaming LLM responses for special markers (emotions, delays, etc.)
 * 
 * Example: "Hello! <|EMOTE_HAPPY|> How are you?" 
 * => Extracts "<|EMOTE_HAPPY|>" as a special token
 */

const TAG_OPEN = '<|'
const TAG_CLOSE = '|>'

export interface LlmParserOptions {
  onLiteral?: (literal: string) => void | Promise<void>
  onSpecial?: (special: string) => void | Promise<void>
  minLiteralEmitLength?: number
}

export function createLlmMarkerParser(options: LlmParserOptions) {
  const minLiteralEmitLength = Math.max(1, options.minLiteralEmitLength ?? 1)
  let buffer = ''
  let inTag = false

  return {
    /**
     * Consumes a chunk of text from the stream
     * Processes the buffer to find complete literal and special parts
     */
    async consume(textPart: string) {
      buffer += textPart

      while (buffer.length > 0) {
        if (!inTag) {
          const openTagIndex = buffer.indexOf(TAG_OPEN)
          
          // No opening tag found
          if (openTagIndex < 0) {
            // Emit all but last character (wait for potential tag)
            if (buffer.length - 1 >= minLiteralEmitLength) {
              const emit = buffer.slice(0, -1)
              buffer = buffer[buffer.length - 1]
              await options.onLiteral?.(emit)
            }
            break
          }

          // Emit text before tag
          if (openTagIndex > 0) {
            const emit = buffer.slice(0, openTagIndex)
            buffer = buffer.slice(openTagIndex)
            await options.onLiteral?.(emit)
          }
          
          inTag = true
        } else {
          const closeTagIndex = buffer.indexOf(TAG_CLOSE)
          
          // Wait for closing tag
          if (closeTagIndex < 0) {
            break
          }

          // Emit complete special token
          const emit = buffer.slice(0, closeTagIndex + TAG_CLOSE.length)
          buffer = buffer.slice(closeTagIndex + TAG_CLOSE.length)
          await options.onSpecial?.(emit)
          inTag = false
        }
      }
    },

    /**
     * Finalizes parsing - call when stream ends
     * Flushes remaining buffer
     */
    async end() {
      // Incomplete tag should not be emitted
      if (!inTag && buffer.length > 0) {
        await options.onLiteral?.(buffer)
        buffer = ''
      }
    },
  }
}
