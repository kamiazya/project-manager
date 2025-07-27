import { describe, expect, it, vi } from 'vitest'
import {
  type ArchitectureLayer,
  type LogContext,
  type LogMetadata,
  LogMetadataUtils,
  type OperationType,
} from '../types/log-metadata.ts'
import type { Logger } from './logger.ts'

describe('Logger', () => {
  describe('Logger interface contract', () => {
    it('should define all required log level methods', () => {
      // Create a minimal Logger implementation to test interface compliance
      const logger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis(),
      }

      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.child).toBe('function')
    })

    it('should accept LogMetadata for all log methods', () => {
      const mockLogger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis(),
      }

      const metadata: LogMetadata = {
        traceId: 'trace-123',
        operation: 'test.operation',
        component: 'TestComponent',
        layer: 'application',
        userId: 'user-456',
      }

      mockLogger.debug('debug message', metadata)
      mockLogger.info('info message', metadata)
      mockLogger.warn('warn message', metadata)
      mockLogger.error('error message', metadata)

      expect(mockLogger.debug).toHaveBeenCalledWith('debug message', metadata)
      expect(mockLogger.info).toHaveBeenCalledWith('info message', metadata)
      expect(mockLogger.warn).toHaveBeenCalledWith('warn message', metadata)
      expect(mockLogger.error).toHaveBeenCalledWith('error message', metadata)
    })

    it('should accept LogContext for child method', () => {
      const mockChildLogger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis(),
      }

      const mockLogger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnValue(mockChildLogger),
      }

      const context: LogContext = {
        component: 'TestComponent',
        layer: 'application',
        operation: 'test.operation',
        traceId: 'trace-123',
      }

      const child = mockLogger.child(context)

      expect(mockLogger.child).toHaveBeenCalledWith(context)
      expect(child).toBe(mockChildLogger)
    })

    it('should handle optional metadata parameter', () => {
      const mockLogger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis(),
      }

      // Test without metadata
      mockLogger.info('message without metadata')
      expect(mockLogger.info).toHaveBeenCalledWith('message without metadata')

      // Test with undefined metadata
      mockLogger.info('message with undefined', undefined)
      expect(mockLogger.info).toHaveBeenCalledWith('message with undefined', undefined)
    })
  })

  describe('LogMetadataUtils.sanitize', () => {
    it('should redact sensitive string fields', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        password: 'secret123',
        apiKey: 'key-456',
        token: 'token-789',
        userSecret: 'secret-data',
        operation: 'auth.login',
      }

      const sanitized = LogMetadataUtils.sanitize(metadata)

      expect(sanitized.traceId).toBe('trace-123') // Not sensitive
      expect(sanitized.operation).toBe('auth.login') // Not sensitive
      expect(sanitized.password).toBe('***REDACTED***')
      expect(sanitized.apiKey).toBe('***REDACTED***')
      expect(sanitized.token).toBe('***REDACTED***')
      expect(sanitized.userSecret).toBe('***REDACTED***')
    })

    it('should remove non-string sensitive fields', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        password: { value: 'secret' }, // Non-string sensitive field
        apiKeyObject: { key: 'value' }, // Non-string sensitive field
        operation: 'auth.login',
      }

      const sanitized = LogMetadataUtils.sanitize(metadata)

      expect(sanitized.traceId).toBe('trace-123')
      expect(sanitized.operation).toBe('auth.login')
      expect(sanitized.password).toBeUndefined() // Removed
      expect(sanitized.apiKeyObject).toBeUndefined() // Removed
    })

    it('should sanitize nested objects recursively', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        requestData: {
          username: 'user123',
          password: 'secret123',
          nested: {
            apiKey: 'key-456',
            publicData: 'public',
          },
        },
        operation: 'auth.login',
      }

      const sanitized = LogMetadataUtils.sanitize(metadata)

      expect(sanitized.traceId).toBe('trace-123')
      expect(sanitized.operation).toBe('auth.login')
      expect((sanitized.requestData as any).username).toBe('user123')
      expect((sanitized.requestData as any).password).toBe('***REDACTED***')
      expect((sanitized.requestData as any).nested.publicData).toBe('public')
      expect((sanitized.requestData as any).nested.apiKey).toBe('***REDACTED***')
    })

    it('should handle case-insensitive sensitive field detection', () => {
      const metadata: LogMetadata = {
        PASSWORD: 'secret123',
        ApiKey: 'key-456',
        userTOKEN: 'token-789',
        CREDENTIAL: 'cred-123',
        operation: 'test',
      }

      const sanitized = LogMetadataUtils.sanitize(metadata)

      expect(sanitized.PASSWORD).toBe('***REDACTED***')
      expect(sanitized.ApiKey).toBe('***REDACTED***')
      expect(sanitized.userTOKEN).toBe('***REDACTED***')
      expect(sanitized.CREDENTIAL).toBe('***REDACTED***')
      expect(sanitized.operation).toBe('test')
    })

    it('should preserve original metadata object', () => {
      const original: LogMetadata = {
        traceId: 'trace-123',
        password: 'secret123',
        operation: 'test',
      }

      const sanitized = LogMetadataUtils.sanitize(original)

      // Original should not be modified
      expect(original.password).toBe('secret123')
      expect(sanitized.password).toBe('***REDACTED***')
      expect(sanitized).not.toBe(original)
    })
  })

  describe('LogMetadataUtils.merge', () => {
    it('should merge multiple metadata objects', () => {
      const metadata1: LogMetadata = {
        traceId: 'trace-123',
        operation: 'test.operation',
        component: 'Component1',
      }

      const metadata2: LogMetadata = {
        userId: 'user-456',
        component: 'Component2', // Should override
        duration: 1000,
      }

      const metadata3: LogMetadata = {
        sessionId: 'session-789',
        duration: 2000, // Should override
      }

      const merged = LogMetadataUtils.merge(metadata1, metadata2, metadata3)

      expect(merged.traceId).toBe('trace-123') // From metadata1
      expect(merged.operation).toBe('test.operation') // From metadata1
      expect(merged.userId).toBe('user-456') // From metadata2
      expect(merged.sessionId).toBe('session-789') // From metadata3
      expect(merged.component).toBe('Component2') // metadata2 overrides metadata1
      expect(merged.duration).toBe(2000) // metadata3 overrides metadata2
    })

    it('should handle undefined metadata objects', () => {
      const metadata1: LogMetadata = {
        traceId: 'trace-123',
        operation: 'test',
      }

      const merged = LogMetadataUtils.merge(metadata1, undefined, metadata1)

      expect(merged.traceId).toBe('trace-123')
      expect(merged.operation).toBe('test')
    })

    it('should return empty object when all inputs are undefined', () => {
      const merged = LogMetadataUtils.merge(undefined, undefined)
      expect(merged).toEqual({})
    })

    it('should handle empty metadata objects', () => {
      const metadata1: LogMetadata = { traceId: 'trace-123' }
      const metadata2: LogMetadata = {}
      const metadata3: LogMetadata = { operation: 'test' }

      const merged = LogMetadataUtils.merge(metadata1, metadata2, metadata3)

      expect(merged.traceId).toBe('trace-123')
      expect(merged.operation).toBe('test')
    })
  })

  describe('LogMetadataUtils.validate', () => {
    describe('general validation', () => {
      it('should validate valid metadata', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
          duration: 1000,
          operation: 'test.operation',
        }

        const errors = LogMetadataUtils.validate(metadata, 'general')
        expect(errors).toEqual([])
      })

      it('should validate traceId type', () => {
        const metadata: LogMetadata = {
          traceId: 123 as any, // Invalid type
          operation: 'test',
        }

        const errors = LogMetadataUtils.validate(metadata, 'general')
        expect(errors).toContain('traceId must be a string')
      })

      it('should validate duration type', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
          duration: 'invalid' as any, // Invalid type
        }

        const errors = LogMetadataUtils.validate(metadata, 'general')
        expect(errors).toContain('duration must be a number')
      })
    })

    describe('audit validation', () => {
      it('should require traceId for audit logs', () => {
        const metadata: LogMetadata = {
          operation: 'ticket.create',
          entityType: 'ticket',
        }

        const errors = LogMetadataUtils.validate(metadata, 'audit')
        expect(errors).toContain('traceId is required for audit logs')
      })

      it('should require operation for audit logs', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
          entityType: 'ticket',
        }

        const errors = LogMetadataUtils.validate(metadata, 'audit')
        expect(errors).toContain('operation is required for audit logs')
      })

      it('should require entityType for audit logs', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
          operation: 'ticket.create',
        }

        const errors = LogMetadataUtils.validate(metadata, 'audit')
        expect(errors).toContain('entityType is required for audit logs')
      })

      it('should pass validation with all required audit fields', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
          operation: 'ticket.create',
          entityType: 'ticket',
        }

        const errors = LogMetadataUtils.validate(metadata, 'audit')
        expect(errors).toEqual([])
      })
    })

    describe('performance validation', () => {
      it('should require operation for performance logs', () => {
        const metadata: LogMetadata = {
          startTime: Date.now(),
          duration: 1000,
        }

        const errors = LogMetadataUtils.validate(metadata, 'performance')
        expect(errors).toContain('operation is required for performance logs')
      })

      it('should require duration when startTime is present', () => {
        const metadata: LogMetadata = {
          operation: 'ticket.create',
          startTime: Date.now(),
          // duration is missing
        }

        const errors = LogMetadataUtils.validate(metadata, 'performance')
        expect(errors).toContain('duration should be provided when startTime is present')
      })

      it('should pass validation with operation and duration', () => {
        const metadata: LogMetadata = {
          operation: 'ticket.create',
          startTime: Date.now(),
          duration: 1000,
        }

        const errors = LogMetadataUtils.validate(metadata, 'performance')
        expect(errors).toEqual([])
      })
    })

    describe('error validation', () => {
      it('should require operation for error logs', () => {
        const metadata: LogMetadata = {
          errorName: 'ValidationError',
          stack: 'Error stack trace...',
        }

        const errors = LogMetadataUtils.validate(metadata, 'error')
        expect(errors).toContain('operation is required for error logs')
      })

      it('should pass validation with operation', () => {
        const metadata: LogMetadata = {
          operation: 'ticket.validate',
          errorName: 'ValidationError',
        }

        const errors = LogMetadataUtils.validate(metadata, 'error')
        expect(errors).toEqual([])
      })
    })
  })

  describe('LogMetadataUtils.extractStandardFields', () => {
    it('should extract only standard fields', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        operation: 'test.operation',
        component: 'TestComponent',
        customField: 'custom-value',
        anotherCustom: { nested: 'data' },
        userId: 'user-456',
      }

      const standard = LogMetadataUtils.extractStandardFields(metadata)

      expect(standard.traceId).toBe('trace-123')
      expect(standard.operation).toBe('test.operation')
      expect(standard.component).toBe('TestComponent')
      expect(standard.userId).toBe('user-456')
      expect(standard.customField).toBeUndefined()
      expect(standard.anotherCustom).toBeUndefined()
    })

    it('should handle metadata with no standard fields', () => {
      const metadata: LogMetadata = {
        customField1: 'value1',
        customField2: 'value2',
      }

      const standard = LogMetadataUtils.extractStandardFields(metadata)
      expect(Object.keys(standard)).toHaveLength(0)
    })
  })

  describe('LogMetadataUtils.extractCustomFields', () => {
    it('should extract only custom fields', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        operation: 'test.operation',
        component: 'TestComponent',
        customField: 'custom-value',
        anotherCustom: { nested: 'data' },
        userId: 'user-456',
      }

      const custom = LogMetadataUtils.extractCustomFields(metadata)

      expect(custom.customField).toBe('custom-value')
      expect(custom.anotherCustom).toEqual({ nested: 'data' })
      expect(custom.traceId).toBeUndefined()
      expect(custom.operation).toBeUndefined()
      expect(custom.component).toBeUndefined()
      expect(custom.userId).toBeUndefined()
    })

    it('should handle metadata with no custom fields', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        operation: 'test.operation',
        userId: 'user-456',
      }

      const custom = LogMetadataUtils.extractCustomFields(metadata)
      expect(Object.keys(custom)).toHaveLength(0)
    })
  })

  describe('LogMetadataUtils.calculateSize', () => {
    it('should calculate metadata size', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        operation: 'test',
      }

      const size = LogMetadataUtils.calculateSize(metadata)
      const expectedSize = JSON.stringify(metadata).length

      expect(size).toBe(expectedSize)
      expect(size).toBeGreaterThan(0)
    })

    it('should handle empty metadata', () => {
      const size = LogMetadataUtils.calculateSize({})
      expect(size).toBe(2) // "{}" = 2 characters
    })

    it('should handle complex nested metadata', () => {
      const metadata: LogMetadata = {
        traceId: 'trace-123',
        nested: {
          level1: {
            level2: {
              array: [1, 2, 3],
              string: 'value',
            },
          },
        },
      }

      const size = LogMetadataUtils.calculateSize(metadata)
      expect(size).toBeGreaterThan(50) // Should be reasonably large
    })
  })

  describe('Type Safety', () => {
    it('should enforce OperationType enum values', () => {
      const validOperationTypes: OperationType[] = [
        'create',
        'read',
        'update',
        'delete',
        'search',
        'sync',
        'auth',
        'config',
        'health',
        'cache',
        'batch',
        'export',
        'import',
      ]

      validOperationTypes.forEach(operationType => {
        const metadata: LogMetadata = {
          operationType,
          operation: 'test.operation',
        }

        expect(metadata.operationType).toBe(operationType)
      })
    })

    it('should enforce ArchitectureLayer enum values', () => {
      const validLayers: ArchitectureLayer[] = [
        'domain',
        'application',
        'infrastructure',
        'sdk',
        'cli',
        'mcp',
      ]

      validLayers.forEach(layer => {
        const metadata: LogMetadata = {
          layer,
          operation: 'test.operation',
        }

        expect(metadata.layer).toBe(layer)
      })
    })

    it('should accept LogContext with proper structure', () => {
      const context: LogContext = {
        component: 'TestComponent',
        layer: 'application',
        operation: 'test.operation',
        traceId: 'trace-123',
        userId: 'user-456',
        sessionId: 'session-789',
        customField: 'custom-value',
      }

      expect(context.component).toBe('TestComponent')
      expect(context.layer).toBe('application')
      expect(context.operation).toBe('test.operation')
      expect(context.traceId).toBe('trace-123')
      expect(context.userId).toBe('user-456')
      expect(context.sessionId).toBe('session-789')
      expect(context.customField).toBe('custom-value')
    })
  })

  describe('Boundary Value Tests', () => {
    describe('Metadata sanitization edge cases', () => {
      it('should handle circular references in sanitization', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
        }

        // Create circular reference
        const circularObj: any = { ref: null }
        circularObj.ref = circularObj
        metadata.circular = circularObj

        // The current implementation doesn't handle circular references
        // This test documents the current behavior
        expect(() => LogMetadataUtils.sanitize(metadata)).toThrow(
          'Maximum call stack size exceeded'
        )
      })

      it('should handle null and undefined values in sanitization', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
          nullValue: null,
          undefinedValue: undefined,
          password: null, // Sensitive but null
        }

        const sanitized = LogMetadataUtils.sanitize(metadata)

        expect(sanitized.traceId).toBe('trace-123')
        expect(sanitized.nullValue).toBeNull()
        expect(sanitized.undefinedValue).toBeUndefined()
        expect(sanitized.password).toBeUndefined() // Removed because it's non-string sensitive
      })

      it('should handle arrays in sensitive field detection', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123',
          passwords: ['password1', 'password2'], // Array with sensitive name
          data: ['safe', 'data'],
        }

        const sanitized = LogMetadataUtils.sanitize(metadata)

        expect(sanitized.traceId).toBe('trace-123')
        expect(sanitized.passwords).toBeUndefined() // Removed (non-string)
        expect(sanitized.data).toEqual(['safe', 'data']) // Preserved
      })
    })

    describe('Metadata merging edge cases', () => {
      it('should handle very large number of metadata objects', () => {
        const metadataObjects: LogMetadata[] = []

        // Create 100 metadata objects
        for (let i = 0; i < 100; i++) {
          metadataObjects.push({
            [`field${i}`]: `value${i}`,
            traceId: `trace-${i}`, // Will be overridden by later objects
          })
        }

        const merged = LogMetadataUtils.merge(...metadataObjects)

        expect(merged.field0).toBe('value0')
        expect(merged.field99).toBe('value99')
        expect(merged.traceId).toBe('trace-99') // Last one wins
        expect(Object.keys(merged)).toHaveLength(101) // 100 fields + traceId
      })

      it('should handle metadata with falsy values', () => {
        const metadata1: LogMetadata = {
          traceId: 'trace-123',
          count: 0,
          flag: false,
          empty: '',
        }

        const metadata2: LogMetadata = {
          count: 5, // Should override 0
          flag: true, // Should override false
          empty: 'not empty', // Should override ''
        }

        const merged = LogMetadataUtils.merge(metadata1, metadata2)

        expect(merged.traceId).toBe('trace-123')
        expect(merged.count).toBe(5)
        expect(merged.flag).toBe(true)
        expect(merged.empty).toBe('not empty')
      })
    })

    describe('Validation edge cases', () => {
      it('should handle metadata with special characters', () => {
        const metadata: LogMetadata = {
          traceId: 'trace-123-!@#$%^&*()',
          operation: 'test.operation.with.dots',
          component: 'Component/With/Slashes',
        }

        const errors = LogMetadataUtils.validate(metadata, 'general')
        expect(errors).toEqual([]) // Should be valid
      })

      it('should handle very long field values', () => {
        const longValue = 'x'.repeat(10000)
        const metadata: LogMetadata = {
          traceId: longValue,
          operation: 'test',
        }

        const errors = LogMetadataUtils.validate(metadata, 'general')
        expect(errors).toEqual([]) // Should be valid (no length restrictions)
      })

      it('should handle metadata with extreme numeric values', () => {
        const metadata: LogMetadata = {
          duration: Number.MAX_SAFE_INTEGER,
          startTime: 0,
          processId: -1,
        }

        const errors = LogMetadataUtils.validate(metadata, 'general')
        expect(errors).toEqual([]) // Should be valid
      })
    })

    describe('Size calculation edge cases', () => {
      it('should handle very large metadata objects', () => {
        const largeMetadata: LogMetadata = {
          traceId: 'trace-123',
        }

        // Add many fields
        for (let i = 0; i < 1000; i++) {
          largeMetadata[`field${i}`] = `value${i}`.repeat(10)
        }

        const size = LogMetadataUtils.calculateSize(largeMetadata)
        expect(size).toBeGreaterThan(50000) // Should be reasonably large
      })

      it('should handle metadata with unicode characters', () => {
        const metadata: LogMetadata = {
          traceId: '🚀-trace-123-🎯',
          operation: 'test.操作',
          message: 'Hello 世界',
        }

        const size = LogMetadataUtils.calculateSize(metadata)
        expect(size).toBeGreaterThan(0)
        expect(typeof size).toBe('number')
      })
    })
  })
})
