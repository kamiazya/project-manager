import { describe, expect, it } from 'vitest'
import { formatErrorResponse, formatSuccessResponse } from './response-formatter.ts'

describe('response-formatter', () => {
  describe('formatSuccessResponse', () => {
    it('should format simple data with success flag', () => {
      const data = { id: '123', name: 'Test' }
      const response = formatSuccessResponse(data)

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, id: '123', name: 'Test' }, null, 2),
          },
        ],
      })
    })

    it('should handle empty object data', () => {
      const data = {}
      const response = formatSuccessResponse(data)

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true }, null, 2),
          },
        ],
      })
    })

    it('should handle null data', () => {
      const data = null
      const response = formatSuccessResponse(data)

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true }, null, 2),
          },
        ],
      })
    })

    it('should handle undefined data', () => {
      const data = undefined
      const response = formatSuccessResponse(data)

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true }, null, 2),
          },
        ],
      })
    })

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const response = formatSuccessResponse(data)

      expect(response.content[0]!.text).toContain('"success": true')
      expect(response.content[0]!.text).toContain('"0"')
      expect(response.content[0]!.text).toContain('"1"')
    })

    it('should handle nested object data', () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      }
      const response = formatSuccessResponse(data)

      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.success).toBe(true)
      expect(parsedText.user.profile.name).toBe('John')
      expect(parsedText.user.profile.settings.theme).toBe('dark')
    })

    it('should handle data with existing success property', () => {
      const data = { success: false, message: 'Override test' }
      const response = formatSuccessResponse(data)

      const parsedText = JSON.parse(response.content[0]!.text)
      // Data success property overrides the initial true value due to spread order
      expect(parsedText.success).toBe(false)
      expect(parsedText.message).toBe('Override test')
    })

    it('should handle string data', () => {
      const data = 'simple string'
      const response = formatSuccessResponse(data)

      expect(response.content[0]!.text).toContain('"success": true')
      // String gets spread as indexed character properties
      expect(response.content[0]!.text).toContain('"0": "s"')
      expect(response.content[0]!.text).toContain('"1": "i"')
    })

    it('should handle number data', () => {
      const data = 42
      const response = formatSuccessResponse(data)

      expect(response.content[0]!.text).toContain('"success": true')
      // Number spreads as empty object, so only success property remains
      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.success).toBe(true)
      expect(Object.keys(parsedText)).toEqual(['success'])
    })

    it('should handle boolean data', () => {
      const data = true
      const response = formatSuccessResponse(data)

      expect(response.content[0]!.text).toContain('"success": true')
      expect(response.content[0]!.text).toContain('true')
    })

    it('should format with proper JSON indentation', () => {
      const data = { nested: { value: 'test' } }
      const response = formatSuccessResponse(data)

      // Should contain proper indentation (2 spaces)
      expect(response.content[0]!.text).toContain('  "success": true')
      expect(response.content[0]!.text).toContain('  "nested": {')
      expect(response.content[0]!.text).toContain('    "value": "test"')
    })

    it('should not include isError flag in success response', () => {
      const data = { message: 'Success' }
      const response = formatSuccessResponse(data)

      expect(response.isError).toBeUndefined()
    })

    it('should handle special characters and Unicode', () => {
      const data = {
        message: 'Special chars: "quotes" \\backslash \n newline',
        unicode: '🎉 测试 αβγ',
      }
      const response = formatSuccessResponse(data)

      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.message).toBe('Special chars: "quotes" \\backslash \n newline')
      expect(parsedText.unicode).toBe('🎉 测试 αβγ')
    })

    it('should handle Date objects by converting to ISO string', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const data = { timestamp: date }
      const response = formatSuccessResponse(data)

      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.timestamp).toBe('2023-01-01T00:00:00.000Z')
    })

    it('should handle circular references gracefully', () => {
      const data: any = { name: 'circular' }
      data.self = data

      expect(() => {
        formatSuccessResponse(data)
      }).toThrow() // JSON.stringify should throw on circular references
    })

    it('should handle very large objects', () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` })),
      }
      const response = formatSuccessResponse(largeData)

      expect(response.content[0]!.text).toContain('"success": true')
      expect(response.content[0]!.text).toContain('"items"')
      expect(response.content[0]!.text.length).toBeGreaterThan(10000)
    })
  })

  describe('formatErrorResponse', () => {
    it('should format error with default isError flag', () => {
      const error = { message: 'Something went wrong', code: 'ERR001' }
      const response = formatErrorResponse(error)

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, message: 'Something went wrong', code: 'ERR001' },
              null,
              2
            ),
          },
        ],
        isError: true,
      })
    })

    it('should format error with custom isError flag', () => {
      const error = { message: 'Warning message' }
      const response = formatErrorResponse(error, false)

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, message: 'Warning message' }, null, 2),
          },
        ],
        isError: false,
      })
    })

    it('should handle Error object instance', () => {
      const error = new Error('Test error message')
      const response = formatErrorResponse(error)

      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.success).toBe(false)
      // Error objects don't have enumerable properties, so only success is spread
      expect(Object.keys(parsedText)).toEqual(['success'])
      expect(response.isError).toBe(true)
    })

    it('should handle string error', () => {
      const error = 'Simple error string'
      const response = formatErrorResponse(error)

      expect(response.content[0]!.text).toContain('"success": false')
      // String gets spread as indexed character properties
      expect(response.content[0]!.text).toContain('"0": "S"')
      expect(response.content[0]!.text).toContain('"1": "i"')
      expect(response.isError).toBe(true)
    })

    it('should handle null error', () => {
      const error = null
      const response = formatErrorResponse(error)

      expect(response.content[0]!.text).toContain('"success": false')
      expect(response.isError).toBe(true)
    })

    it('should handle undefined error', () => {
      const error = undefined
      const response = formatErrorResponse(error)

      expect(response.content[0]!.text).toContain('"success": false')
      expect(response.isError).toBe(true)
    })

    it('should handle error with existing success property', () => {
      const error = { success: true, message: 'Override test' }
      const response = formatErrorResponse(error)

      const parsedText = JSON.parse(response.content[0]!.text)
      // Error success property overrides the initial false value due to spread order
      expect(parsedText.success).toBe(true)
      expect(parsedText.message).toBe('Override test')
    })

    it('should handle nested error object', () => {
      const error = {
        error: {
          type: 'ValidationError',
          details: {
            field: 'email',
            message: 'Invalid format',
          },
        },
      }
      const response = formatErrorResponse(error)

      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.success).toBe(false)
      expect(parsedText.error.type).toBe('ValidationError')
      expect(parsedText.error.details.field).toBe('email')
    })

    it('should format with proper JSON indentation for errors', () => {
      const error = {
        error: {
          message: 'Nested error',
          stack: 'Error stack trace',
        },
      }
      const response = formatErrorResponse(error)

      // Should contain proper indentation (2 spaces)
      expect(response.content[0]!.text).toContain('  "success": false')
      expect(response.content[0]!.text).toContain('  "error": {')
      expect(response.content[0]!.text).toContain('    "message": "Nested error"')
    })

    it('should handle error with stack trace', () => {
      const error = {
        name: 'TypeError',
        message: 'Cannot read property',
        stack: 'TypeError: Cannot read property\n    at Object.<anonymous> (/path/file.js:10:5)',
      }
      const response = formatErrorResponse(error)

      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.success).toBe(false)
      expect(parsedText.name).toBe('TypeError')
      expect(parsedText.message).toBe('Cannot read property')
      expect(parsedText.stack).toContain('TypeError: Cannot read property')
    })

    it('should handle multiple error properties', () => {
      const error = {
        code: 500,
        message: 'Internal Server Error',
        details: 'Database connection failed',
        timestamp: '2023-01-01T00:00:00Z',
      }
      const response = formatErrorResponse(error)

      const parsedText = JSON.parse(response.content[0]!.text)
      expect(parsedText.success).toBe(false)
      expect(parsedText.code).toBe(500)
      expect(parsedText.message).toBe('Internal Server Error')
      expect(parsedText.details).toBe('Database connection failed')
      expect(parsedText.timestamp).toBe('2023-01-01T00:00:00Z')
    })
  })

  describe('McpResponse interface compliance', () => {
    it('should return valid McpResponse structure for success', () => {
      const data = { test: 'data' }
      const response = formatSuccessResponse(data)

      // Type checking - should compile and have correct structure
      expect(response.content).toBeInstanceOf(Array)
      expect(response.content).toHaveLength(1)
      expect(response.content[0]!.type).toBe('text')
      expect(typeof response.content[0]!.text).toBe('string')
      expect(response.isError).toBeUndefined()
    })

    it('should return valid McpResponse structure for error', () => {
      const error = { message: 'Error' }
      const response = formatErrorResponse(error)

      // Type checking - should compile and have correct structure
      expect(response.content).toBeInstanceOf(Array)
      expect(response.content).toHaveLength(1)
      expect(response.content[0]!.type).toBe('text')
      expect(typeof response.content[0]!.text).toBe('string')
      expect(typeof response.isError).toBe('boolean')
    })

    it('should always have content array with text type', () => {
      const successResponse = formatSuccessResponse({})
      const errorResponse = formatErrorResponse({})

      expect(successResponse.content[0]!.type).toBe('text')
      expect(errorResponse.content[0]!.type).toBe('text')
    })
  })

  describe('edge cases and performance', () => {
    it('should handle extremely nested objects', () => {
      const deepNested: any = { level: 0 }
      let current = deepNested
      for (let i = 1; i < 100; i++) {
        current.next = { level: i }
        current = current.next
      }

      const response = formatSuccessResponse(deepNested)
      expect(response.content[0]!.text).toContain('"success": true')
      expect(response.content[0]!.text).toContain('"level": 0')
    })

    it('should handle objects with many properties', () => {
      const manyProps: any = {}
      for (let i = 0; i < 1000; i++) {
        manyProps[`prop${i}`] = `value${i}`
      }

      const response = formatSuccessResponse(manyProps)
      expect(response.content[0]!.text).toContain('"success": true')
      expect(response.content[0]!.text).toContain('"prop0": "value0"')
      expect(response.content[0]!.text).toContain('"prop999": "value999"')
    })

    it('should handle empty arrays and objects consistently', () => {
      const emptyArray = formatSuccessResponse([])
      const emptyObject = formatSuccessResponse({})

      expect(emptyArray.content[0]!.text).toContain('"success": true')
      expect(emptyObject.content[0]!.text).toContain('"success": true')
    })

    it('should handle response formatting performance efficiently', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, data: 'x'.repeat(100) })),
      }

      const start = Date.now()
      const response = formatSuccessResponse(largeData)
      const duration = Date.now() - start

      expect(response.content[0]!.text).toContain('"success": true')
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })
  })

  describe('integration scenarios', () => {
    it('should format typical MCP tool success response', () => {
      const ticketData = {
        ticket: {
          id: 'TKT-123',
          title: 'Fix login issue',
          status: 'pending',
          priority: 'high',
        },
      }

      const response = formatSuccessResponse(ticketData)
      const parsedText = JSON.parse(response.content[0]!.text)

      expect(parsedText.success).toBe(true)
      expect(parsedText.ticket.id).toBe('TKT-123')
      expect(parsedText.ticket.title).toBe('Fix login issue')
    })

    it('should format typical MCP tool error response', () => {
      const errorData = {
        error: 'Ticket not found',
        code: 'NOT_FOUND',
        ticketId: 'TKT-999',
      }

      const response = formatErrorResponse(errorData)
      const parsedText = JSON.parse(response.content[0]!.text)

      expect(parsedText.success).toBe(false)
      expect(parsedText.error).toBe('Ticket not found')
      expect(parsedText.code).toBe('NOT_FOUND')
      expect(response.isError).toBe(true)
    })

    it('should format search results response', () => {
      const searchResults = {
        query: 'bug',
        total: 2,
        tickets: [
          { id: 'TKT-1', title: 'Bug fix 1' },
          { id: 'TKT-2', title: 'Bug fix 2' },
        ],
      }

      const response = formatSuccessResponse(searchResults)
      const parsedText = JSON.parse(response.content[0]!.text)

      expect(parsedText.success).toBe(true)
      expect(parsedText.total).toBe(2)
      expect(parsedText.tickets).toHaveLength(2)
    })

    it('should format statistics response', () => {
      const stats = {
        total: 100,
        pending: 30,
        inProgress: 20,
        completed: 45,
        archived: 5,
        byPriority: { high: 10, medium: 50, low: 40 },
      }

      const response = formatSuccessResponse(stats)
      const parsedText = JSON.parse(response.content[0]!.text)

      expect(parsedText.success).toBe(true)
      expect(parsedText.total).toBe(100)
      expect(parsedText.byPriority.high).toBe(10)
    })
  })
})
