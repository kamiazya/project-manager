import { TicketError } from '@project-manager/shared'
import { describe, expect, it } from 'vitest'
import { handleError } from './error-handler.ts'

describe('error-handler', () => {
  describe('handleError', () => {
    describe('TicketError handling', () => {
      it('should handle TicketError with message and code', () => {
        const ticketError = new TicketError('Ticket not found', 'NOT_FOUND')
        const result = handleError(ticketError)

        expect(result).toEqual({
          error: 'Ticket not found',
          details: { code: 'NOT_FOUND' },
        })
      })

      it('should handle TicketError with empty message', () => {
        const ticketError = new TicketError('', 'EMPTY_MESSAGE')
        const result = handleError(ticketError)

        expect(result).toEqual({
          error: '',
          details: { code: 'EMPTY_MESSAGE' },
        })
      })

      it('should handle TicketError with special characters in message', () => {
        const ticketError = new TicketError(
          'Error with "quotes" and \\backslashes',
          'SPECIAL_CHARS'
        )
        const result = handleError(ticketError)

        expect(result).toEqual({
          error: 'Error with "quotes" and \\backslashes',
          details: { code: 'SPECIAL_CHARS' },
        })
      })

      it('should handle TicketError with Unicode characters', () => {
        const ticketError = new TicketError('Unicode error: 🎉 测试 αβγ', 'UNICODE_TEST')
        const result = handleError(ticketError)

        expect(result).toEqual({
          error: 'Unicode error: 🎉 测试 αβγ',
          details: { code: 'UNICODE_TEST' },
        })
      })

      it('should handle TicketError with long message', () => {
        const longMessage = 'A'.repeat(1000)
        const ticketError = new TicketError(longMessage, 'LONG_MESSAGE')
        const result = handleError(ticketError)

        expect(result).toEqual({
          error: longMessage,
          details: { code: 'LONG_MESSAGE' },
        })
      })

      it('should handle TicketError with undefined code', () => {
        const ticketError = new TicketError('Test message', undefined as any)
        const result = handleError(ticketError)

        expect(result).toEqual({
          error: 'Test message',
          details: { code: undefined },
        })
      })

      it('should handle TicketError with null code', () => {
        const ticketError = new TicketError('Test message', null as any)
        const result = handleError(ticketError)

        expect(result).toEqual({
          error: 'Test message',
          details: { code: null },
        })
      })
    })

    describe('Standard Error handling', () => {
      it('should handle standard Error instance', () => {
        const error = new Error('Standard error message')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'Standard error message',
        })
      })

      it('should handle Error with empty message', () => {
        const error = new Error('')
        const result = handleError(error)

        expect(result).toEqual({
          error: '',
        })
      })

      it('should handle TypeError instance', () => {
        const error = new TypeError('Type error occurred')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'Type error occurred',
        })
      })

      it('should handle ReferenceError instance', () => {
        const error = new ReferenceError('Reference error occurred')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'Reference error occurred',
        })
      })

      it('should handle SyntaxError instance', () => {
        const error = new SyntaxError('Syntax error occurred')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'Syntax error occurred',
        })
      })

      it('should handle custom Error subclass', () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message)
            this.name = 'CustomError'
          }
        }

        const error = new CustomError('Custom error message')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'Custom error message',
        })
      })

      it('should handle Error with stack trace', () => {
        const error = new Error('Error with stack')
        // Stack trace exists but is not included in output
        const result = handleError(error)

        expect(result).toEqual({
          error: 'Error with stack',
        })
        // Verify stack is not included
        expect(result).not.toHaveProperty('stack')
        expect(result).not.toHaveProperty('details')
      })

      it('should handle Error with special characters in message', () => {
        const error = new Error('Error with "quotes" and \n newlines')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'Error with "quotes" and \n newlines',
        })
      })
    })

    describe('Unknown error handling', () => {
      it('should handle string as error', () => {
        const error = 'Simple string error'
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: 'Simple string error',
        })
      })

      it('should handle number as error', () => {
        const error = 404
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: 404,
        })
      })

      it('should handle boolean as error', () => {
        const error = false
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: false,
        })
      })

      it('should handle null as error', () => {
        const error = null
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: null,
        })
      })

      it('should handle undefined as error', () => {
        const error = undefined
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: undefined,
        })
      })

      it('should handle object as error', () => {
        const error = { code: 500, message: 'Server error' }
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: { code: 500, message: 'Server error' },
        })
      })

      it('should handle array as error', () => {
        const error = ['error1', 'error2']
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: ['error1', 'error2'],
        })
      })

      it('should handle Date as error', () => {
        const error = new Date('2023-01-01T00:00:00Z')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: error,
        })
      })

      it('should handle RegExp as error', () => {
        const error = /test-pattern/gi
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: error,
        })
      })

      it('should handle function as error', () => {
        const error = function testFunction() {
          return 'test'
        }
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: error,
        })
      })

      it('should handle Symbol as error', () => {
        const error = Symbol('test-symbol')
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: error,
        })
      })

      it('should handle BigInt as error', () => {
        const error = BigInt(123456789)
        const result = handleError(error)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: error,
        })
      })
    })

    describe('error precedence and type checking', () => {
      it('should prioritize TicketError over Error when both apply', () => {
        // Create a TicketError instance which is also an Error
        const ticketError = new TicketError('Ticket error message', 'PRIORITY_TEST')

        // Verify it's both TicketError and Error
        expect(ticketError instanceof TicketError).toBe(true)
        expect(ticketError instanceof Error).toBe(true)

        const result = handleError(ticketError)

        // Should be handled as TicketError (with details)
        expect(result).toEqual({
          error: 'Ticket error message',
          details: { code: 'PRIORITY_TEST' },
        })
      })

      it('should handle Error that is not TicketError', () => {
        const regularError = new Error('Regular error message')

        // Verify it's Error but not TicketError
        expect(regularError instanceof Error).toBe(true)
        expect(regularError instanceof TicketError).toBe(false)

        const result = handleError(regularError)

        // Should be handled as Error (without details)
        expect(result).toEqual({
          error: 'Regular error message',
        })
      })

      it('should handle objects that look like Error but are not Error instances', () => {
        const fakeError = {
          message: 'Fake error message',
          name: 'FakeError',
          stack: 'Fake stack trace',
        }

        const result = handleError(fakeError)

        // Should be handled as unknown error
        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: fakeError,
        })
      })
    })

    describe('edge cases and complex scenarios', () => {
      it('should handle circular reference in unknown error', () => {
        const circular: any = { message: 'Circular error' }
        circular.self = circular

        const result = handleError(circular)

        expect(result.error).toBe('An unknown error occurred')
        expect(result.details).toBe(circular)
        // Note: The circular reference is preserved in details
      })

      it('should handle very large error objects', () => {
        const largeError = {
          message: 'Large error',
          data: Array.from({ length: 1000 }, (_, i) => ({ index: i, value: `item-${i}` })),
        }

        const result = handleError(largeError)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: largeError,
        })
      })

      it('should handle nested error structures', () => {
        const nestedError = {
          outer: {
            inner: {
              deep: {
                message: 'Deep nested error',
                code: 'DEEP_ERROR',
              },
            },
          },
        }

        const result = handleError(nestedError)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: nestedError,
        })
      })

      it('should handle error with prototype pollution attempt', () => {
        const maliciousError = {
          __proto__: { polluted: true },
          message: 'Malicious error',
        }

        const result = handleError(maliciousError)

        expect(result).toEqual({
          error: 'An unknown error occurred',
          details: maliciousError,
        })
      })
    })

    describe('performance characteristics', () => {
      it('should handle error processing efficiently', () => {
        const start = Date.now()

        // Process multiple different error types
        const errors = [
          new TicketError('Test 1', 'CODE1'),
          new Error('Test 2'),
          'String error',
          { object: 'error' },
          null,
          undefined,
          42,
        ]

        const results = errors.map(error => handleError(error))

        const duration = Date.now() - start

        expect(results).toHaveLength(7)
        expect(duration).toBeLessThan(100) // Should complete in under 100ms
      })

      it('should handle large error messages efficiently', () => {
        const largeMessage = 'A'.repeat(10000)
        const error = new Error(largeMessage)

        const start = Date.now()
        const result = handleError(error)
        const duration = Date.now() - start

        expect(result.error).toBe(largeMessage)
        expect(duration).toBeLessThan(50) // Should complete in under 50ms
      })
    })

    describe('return type consistency', () => {
      it('should always return object with error property', () => {
        const testCases = [
          new TicketError('Test', 'CODE'),
          new Error('Test'),
          'string error',
          null,
          undefined,
          42,
          {},
        ]

        testCases.forEach(testCase => {
          const result = handleError(testCase)

          expect(result).toBeTypeOf('object')
          expect(result).toHaveProperty('error')
          expect(typeof result.error).toBe('string')
        })
      })

      it('should include details only for TicketError and unknown errors', () => {
        // TicketError should have details
        const ticketResult = handleError(new TicketError('Test', 'CODE'))
        expect(ticketResult).toHaveProperty('details')

        // Standard Error should not have details
        const errorResult = handleError(new Error('Test'))
        expect(errorResult).not.toHaveProperty('details')

        // Unknown error should have details
        const unknownResult = handleError('unknown')
        expect(unknownResult).toHaveProperty('details')
      })
    })
  })
})
