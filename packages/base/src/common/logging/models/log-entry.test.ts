import { beforeEach, describe, expect, it } from 'vitest'
import { ValidationError } from '../../errors/base-errors.ts'
import type { LogLevel } from '../types/log-level.ts'
import type { LogMetadata } from '../types/log-metadata.ts'
import {
  type CreateLogEntryParams,
  type LogEntryFormatOptions,
  LogEntryModel,
  type LogEntrySerializationOptions,
  LogEntryUtils,
} from './log-entry.ts'

describe('LogEntryModel', () => {
  const baseParams: CreateLogEntryParams = {
    level: 'info',
    message: 'Test log message',
    metadata: {
      traceId: 'trace-456',
      component: 'TestComponent',
    },
  }

  describe('LogEntryModel creation', () => {
    it('should create log entry with required fields', () => {
      const entry = LogEntryModel.create(baseParams)

      expect(entry.level).toBe('info')
      expect(entry.message).toBe('Test log message')
      expect(entry.metadata?.traceId).toBe('trace-456')
      expect(entry.id).toMatch(/^log-\d+-[a-z0-9]+$/)
      expect(entry.timestamp).toBeInstanceOf(Date)
    })

    it('should create log entry with custom timestamp and ID', () => {
      const customTimestamp = new Date('2025-01-01T10:00:00Z')
      const params = {
        ...baseParams,
        id: 'custom-log-id',
        timestamp: customTimestamp,
      }

      const entry = LogEntryModel.create(params)

      expect(entry.id).toBe('custom-log-id')
      expect(entry.timestamp).toBe(customTimestamp)
    })

    it('should create log entry with all metadata fields', () => {
      const fullMetadata: LogMetadata = {
        traceId: 'trace-789',
        operation: 'test.operation',
        component: 'TestComponent',
        layer: 'application',
        source: 'cli',
        userId: 'user-123',
        duration: 150,
        errorName: 'ValidationError',
        stack: 'Error stack trace here',
      }

      const entry = LogEntryModel.create({
        level: 'error',
        message: 'Error occurred',
        metadata: fullMetadata,
      })

      expect(entry.level).toBe('error')
      expect(entry.metadata?.duration).toBe(150)
      expect(entry.metadata?.errorName).toBe('ValidationError')
      expect(entry.metadata?.stack).toBe('Error stack trace here')
    })

    it('should validate required fields', () => {
      const invalidParams = {
        level: '' as LogLevel,
        message: '',
      }

      expect(() => LogEntryModel.create(invalidParams)).toThrow(ValidationError)
    })

    it('should validate log level', () => {
      const invalidParams = {
        level: 'invalid' as LogLevel,
        message: 'Test message',
      }

      expect(() => LogEntryModel.create(invalidParams)).toThrow(ValidationError)
      expect(() => LogEntryModel.create(invalidParams)).toThrow('Invalid log level')
    })

    it('should require non-null message', () => {
      const invalidParams = {
        level: 'info' as LogLevel,
        message: null as any,
      }

      expect(() => LogEntryModel.create(invalidParams)).toThrow(ValidationError)
      expect(() => LogEntryModel.create(invalidParams)).toThrow('Log entry message is required')
    })

    it('should require string message', () => {
      const invalidParams = {
        level: 'info' as LogLevel,
        message: 123 as any,
      }

      expect(() => LogEntryModel.create(invalidParams)).toThrow(ValidationError)
      expect(() => LogEntryModel.create(invalidParams)).toThrow(
        'Log entry message must be a string'
      )
    })
  })

  describe('LogEntryModel static methods', () => {
    it('should generate unique IDs', () => {
      const id1 = LogEntryModel.generateId()
      const id2 = LogEntryModel.generateId()

      expect(id1).toMatch(/^log-\d+-[a-z0-9]+$/)
      expect(id2).toMatch(/^log-\d+-[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should create from plain object', () => {
      const obj = {
        id: 'log-test',
        level: 'warn' as LogLevel,
        message: 'Warning message',
        metadata: { component: 'TestService' },
        timestamp: new Date('2025-01-01T10:00:00Z'),
      }

      const entry = LogEntryModel.fromObject(obj)

      expect(entry.id).toBe('log-test')
      expect(entry.level).toBe('warn')
      expect(entry.message).toBe('Warning message')
      expect(entry.metadata?.component).toBe('TestService')
      expect(entry.timestamp).toEqual(new Date('2025-01-01T10:00:00Z'))
    })

    it('should use defaults when creating from incomplete object', () => {
      const obj = {
        // Missing required fields
      }

      const entry = LogEntryModel.fromObject(obj)

      expect(entry.level).toBe('info') // Default level
      expect(entry.message).toBe('') // Default message
      expect(entry.id).toMatch(/^log-\d+-[a-z0-9]+$/) // Generated ID
      expect(entry.timestamp).toBeInstanceOf(Date) // Generated timestamp
    })
  })

  describe('LogEntryModel methods', () => {
    let entry: LogEntryModel

    beforeEach(() => {
      entry = LogEntryModel.create(baseParams)
    })

    it('should convert to plain object', () => {
      const obj = entry.toObject()

      expect(obj.id).toBe(entry.id)
      expect(obj.timestamp).toBe(entry.timestamp)
      expect(obj.level).toBe(entry.level)
      expect(obj.message).toBe(entry.message)
      expect(obj.metadata).toEqual(entry.metadata)
      expect(obj.traceContext).toEqual(entry.traceContext)

      // These are private cached values, undefined until getters are accessed
      expect(obj.formatted).toBeUndefined()
      expect(obj.serialized).toBeUndefined()

      // But accessing the getters should populate the values
      const formatted = entry.formatted
      const serialized = entry.serialized
      const objAfterAccess = entry.toObject()

      expect(objAfterAccess.formatted).toBe(formatted)
      expect(objAfterAccess.serialized).toBe(serialized)
    })

    it('should serialize to JSON with default options', () => {
      const serialized = entry.serialize()
      const parsed = JSON.parse(serialized)

      expect(parsed.id).toBe(entry.id)
      expect(parsed.level).toBe(entry.level)
      expect(parsed.message).toBe(entry.message)
      expect(parsed.timestamp).toBe(entry.timestamp.toISOString())
    })

    it('should serialize with custom options', () => {
      const entryWithSensitiveData = LogEntryModel.create({
        level: 'info',
        message: 'User data',
        metadata: {
          username: 'testuser',
          password: 'secret123',
          apiKey: 'key-456',
          publicData: 'safe-data',
        },
      })

      const options: LogEntrySerializationOptions = {
        excludeSensitive: true,
        metadataFields: ['username', 'publicData'],
      }

      const serialized = entryWithSensitiveData.serialize(options)
      const parsed = JSON.parse(serialized)

      expect(parsed.metadata.username).toBe('testuser')
      expect(parsed.metadata.publicData).toBe('safe-data')
      expect(parsed.metadata.password).toBe('***REDACTED***')
      expect(parsed.metadata.apiKey).toBe('***REDACTED***')
    })

    it('should serialize with flattened metadata', () => {
      const entryWithNestedMetadata = LogEntryModel.create({
        level: 'info',
        message: 'Test',
        metadata: {
          user: {
            id: 'user-123',
            name: 'Test User',
          },
          request: {
            path: '/api/test',
            method: 'GET',
          },
        },
      })

      const options: LogEntrySerializationOptions = {
        flattenMetadata: true,
      }

      const serialized = entryWithNestedMetadata.serialize(options)
      const parsed = JSON.parse(serialized)

      expect(parsed['user.id']).toBe('user-123')
      expect(parsed['user.name']).toBe('Test User')
      expect(parsed['request.path']).toBe('/api/test')
      expect(parsed['request.method']).toBe('GET')
    })

    it('should clone with modifications', () => {
      const cloned = entry.clone({
        level: 'error',
        message: 'Modified message',
      })

      expect(cloned.level).toBe('error')
      expect(cloned.message).toBe('Modified message')
      expect(cloned.metadata).toEqual(entry.metadata) // Unchanged
      expect(cloned.id).toBe(entry.id) // Unchanged
    })
  })

  describe('LogEntryModel formatting', () => {
    let entry: LogEntryModel

    beforeEach(() => {
      entry = LogEntryModel.create({
        level: 'info',
        message: 'User logged in',
        timestamp: new Date('2025-01-21T10:00:00Z'),
        metadata: {
          userId: 'user-456',
          component: 'AuthService',
          traceId: 'trace-123',
        },
      })
    })

    it('should format with default options', () => {
      const formatted = entry.format()

      expect(formatted).toContain('[2025-01-21T10:00:00.000Z]')
      expect(formatted).toContain('INFO:')
      expect(formatted).toContain('User logged in')
    })

    it('should format with custom timestamp format', () => {
      const options: LogEntryFormatOptions = {
        timestampFormat: 'locale',
      }

      const formatted = entry.format(options)

      expect(formatted).toContain('INFO: User logged in')
      // Locale format varies by system, so just check it doesn't contain ISO format
      expect(formatted).not.toContain('2025-01-21T10:00:00.000Z')
    })

    it('should format with relative timestamp', () => {
      // Create entry with recent timestamp
      const recentEntry = LogEntryModel.create({
        level: 'info',
        message: 'Recent message',
        timestamp: new Date(Date.now() - 30000), // 30 seconds ago
      })

      const options: LogEntryFormatOptions = {
        timestampFormat: 'relative',
      }

      const formatted = recentEntry.format(options)

      expect(formatted).toMatch(/\[\d+s ago\] INFO: Recent message/)
    })

    it('should format without timestamp', () => {
      const options: LogEntryFormatOptions = {
        includeTimestamp: false,
      }

      const formatted = entry.format(options)

      expect(formatted).toBe('INFO: User logged in')
      expect(formatted).not.toContain('2025-01-21')
    })

    it('should format without log level', () => {
      const options: LogEntryFormatOptions = {
        includeLevel: false,
      }

      const formatted = entry.format(options)

      expect(formatted).toContain('[2025-01-21T10:00:00.000Z]')
      expect(formatted).toContain('User logged in')
      expect(formatted).not.toContain('INFO:')
    })

    it('should format with metadata', () => {
      const options: LogEntryFormatOptions = {
        includeMetadata: true,
      }

      const formatted = entry.format(options)

      expect(formatted).toContain('User logged in')
      expect(formatted).toContain('userId')
      expect(formatted).toContain('user-456')
    })

    it('should format with specific metadata fields', () => {
      const options: LogEntryFormatOptions = {
        includeMetadata: true,
        metadataFields: ['userId', 'component'],
      }

      const formatted = entry.format(options)

      expect(formatted).toContain('userId')
      expect(formatted).toContain('component')
      expect(formatted).not.toContain('traceId')
    })

    it('should truncate long messages', () => {
      const longMessageEntry = LogEntryModel.create({
        level: 'info',
        message: `Very long message: ${'x'.repeat(100)}`,
      })

      const options: LogEntryFormatOptions = {
        maxMessageLength: 50,
      }

      const formatted = longMessageEntry.format(options)

      expect(formatted).toContain('Very long message:')
      expect(formatted).toContain('...')
      expect(formatted.length).toBeLessThan(100)
    })

    it('should use colorized output', () => {
      const options: LogEntryFormatOptions = {
        colorize: true,
      }

      const formatted = entry.format(options)

      // Should contain ANSI color codes (ESC sequence)
      expect(formatted).toContain(String.fromCharCode(27) + '[')
    })
  })

  describe('LogEntryModel filtering and matching', () => {
    let entries: LogEntryModel[]

    beforeEach(() => {
      entries = [
        LogEntryModel.create({
          level: 'info',
          message: 'User login',
          metadata: { component: 'AuthService', userId: 'user-123' },
        }),
        LogEntryModel.create({
          level: 'error',
          message: 'Database error',
          metadata: { component: 'DatabaseService', errorCode: 'DB_001' },
        }),
        LogEntryModel.create({
          level: 'debug',
          message: 'Cache miss',
          metadata: { component: 'CacheService' },
        }),
      ]
    })

    it('should match by log level', () => {
      const infoEntry = entries[0]!
      const errorEntry = entries[1]!

      expect(infoEntry.matches({ level: ['info'] })).toBe(true)
      expect(infoEntry.matches({ level: ['error'] })).toBe(false)
      expect(errorEntry.matches({ level: ['info', 'error'] })).toBe(true)
    })

    it('should match by message pattern', () => {
      const userEntry = entries[0]!
      const dbEntry = entries[1]!

      expect(userEntry.matches({ messagePattern: 'login' })).toBe(true)
      expect(userEntry.matches({ messagePattern: 'database' })).toBe(false)
      expect(dbEntry.matches({ messagePattern: 'error' })).toBe(true)
    })

    it('should match by metadata fields', () => {
      const authEntry = entries[0]!
      const dbEntry = entries[1]!

      expect(authEntry.matches({ metadata: { component: 'AuthService' } })).toBe(true)
      expect(authEntry.matches({ metadata: { component: 'DatabaseService' } })).toBe(false)
      expect(dbEntry.matches({ metadata: { errorCode: 'DB_001' } })).toBe(true)
    })

    it('should match by time range', () => {
      const entry = entries[0]!
      const entryTime = entry.timestamp
      const before = new Date(entryTime.getTime() - 1000)
      const after = new Date(entryTime.getTime() + 1000)

      expect(entry.matches({ timeRange: { start: before } })).toBe(true)
      expect(entry.matches({ timeRange: { end: after } })).toBe(true)
      expect(entry.matches({ timeRange: { start: before, end: after } })).toBe(true)
      expect(entry.matches({ timeRange: { start: after } })).toBe(false)
      expect(entry.matches({ timeRange: { end: before } })).toBe(false)
    })

    it('should match by trace context', () => {
      const entryWithTrace = LogEntryModel.create({
        level: 'info',
        message: 'Test with trace',
        metadata: {
          traceId: 'trace-123',
          spanId: 'span-456',
          sampled: true,
        },
      })

      expect(entryWithTrace.traceContext).toEqual({
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: undefined,
        sampled: true,
      })
    })
  })

  describe('LogEntryUtils', () => {
    describe('parseFromJson', () => {
      it('should parse valid JSON log entry', () => {
        const json = JSON.stringify({
          id: 'log-123',
          level: 'info',
          message: 'Test message',
          timestamp: '2025-01-01T10:00:00.000Z',
          metadata: { component: 'TestService' },
        })

        const entry = LogEntryUtils.parseFromJson(json)

        expect(entry).toBeInstanceOf(LogEntryModel)
        expect(entry.id).toBe('log-123')
        expect(entry.level).toBe('info')
        expect(entry.message).toBe('Test message')
        expect(entry.timestamp).toEqual(new Date('2025-01-01T10:00:00.000Z'))
      })

      it('should throw error for invalid JSON', () => {
        const invalidJson = '{ invalid json }'

        expect(() => LogEntryUtils.parseFromJson(invalidJson)).toThrow(ValidationError)
        expect(() => LogEntryUtils.parseFromJson(invalidJson)).toThrow(
          'Failed to parse log entry from JSON'
        )
      })
    })

    describe('createBatch', () => {
      it('should create multiple log entries', () => {
        const paramsArray = [
          { level: 'info' as LogLevel, message: 'First entry' },
          { level: 'warn' as LogLevel, message: 'Second entry' },
          { level: 'error' as LogLevel, message: 'Third entry' },
        ]

        const entries = LogEntryUtils.createBatch(paramsArray)

        expect(entries).toHaveLength(3)
        expect(entries[0]!.message).toBe('First entry')
        expect(entries[1]!.level).toBe('warn')
        expect(entries[2]!.level).toBe('error')
      })
    })

    describe('sortByTimestamp', () => {
      it('should sort entries by timestamp descending by default', () => {
        const entries = [
          LogEntryModel.create({
            level: 'info',
            message: 'Third',
            timestamp: new Date('2025-01-01T12:00:00Z'),
          }),
          LogEntryModel.create({
            level: 'info',
            message: 'First',
            timestamp: new Date('2025-01-01T10:00:00Z'),
          }),
          LogEntryModel.create({
            level: 'info',
            message: 'Second',
            timestamp: new Date('2025-01-01T11:00:00Z'),
          }),
        ]

        const sorted = LogEntryUtils.sortByTimestamp(entries)

        expect(sorted[0]!.message).toBe('Third') // Latest first
        expect(sorted[1]!.message).toBe('Second')
        expect(sorted[2]!.message).toBe('First') // Oldest last
      })

      it('should sort entries by timestamp ascending when specified', () => {
        const entries = [
          LogEntryModel.create({
            level: 'info',
            message: 'Third',
            timestamp: new Date('2025-01-01T12:00:00Z'),
          }),
          LogEntryModel.create({
            level: 'info',
            message: 'First',
            timestamp: new Date('2025-01-01T10:00:00Z'),
          }),
        ]

        const sorted = LogEntryUtils.sortByTimestamp(entries, true)

        expect(sorted[0]!.message).toBe('First') // Oldest first
        expect(sorted[1]!.message).toBe('Third') // Latest last
      })
    })

    describe('groupBy', () => {
      it('should group entries by log level', () => {
        const entries = [
          LogEntryModel.create({ level: 'info', message: 'Info 1' }),
          LogEntryModel.create({ level: 'error', message: 'Error 1' }),
          LogEntryModel.create({ level: 'info', message: 'Info 2' }),
        ]

        const grouped = LogEntryUtils.groupBy(entries, 'level')

        expect(grouped.info).toHaveLength(2)
        expect(grouped.error).toHaveLength(1)
        expect(grouped.info![0]!.message).toBe('Info 1')
        expect(grouped.info![1]!.message).toBe('Info 2')
      })

      it('should group entries by metadata field', () => {
        const entries = [
          LogEntryModel.create({
            level: 'info',
            message: 'Auth 1',
            metadata: { component: 'AuthService' },
          }),
          LogEntryModel.create({
            level: 'info',
            message: 'DB 1',
            metadata: { component: 'DatabaseService' },
          }),
          LogEntryModel.create({
            level: 'info',
            message: 'Auth 2',
            metadata: { component: 'AuthService' },
          }),
        ]

        const grouped = LogEntryUtils.groupBy(entries, 'component')

        expect(grouped.AuthService).toHaveLength(2)
        expect(grouped.DatabaseService).toHaveLength(1)
      })

      it('should handle entries with missing field', () => {
        const entries = [
          LogEntryModel.create({
            level: 'info',
            message: 'With component',
            metadata: { component: 'Service' },
          }),
          LogEntryModel.create({ level: 'info', message: 'Without component' }),
        ]

        const grouped = LogEntryUtils.groupBy(entries, 'component')

        expect(grouped.Service).toHaveLength(1)
        expect(grouped.unknown).toHaveLength(1)
      })
    })
  })

  describe('Boundary Value Tests', () => {
    it('should handle minimum valid log entry', () => {
      const minimalParams: CreateLogEntryParams = {
        level: 'info',
        message: 'x', // Single character message
      }

      const entry = LogEntryModel.create(minimalParams)

      expect(entry.message).toBe('x')
      expect(entry.level).toBe('info')
      expect(entry.id).toMatch(/^log-\d+-[a-z0-9]+$/)
    })

    it('should handle maximum size log entry', () => {
      const longMessage = `Very long message: ${'x'.repeat(10000)}`
      const largeMetadata: LogMetadata = {
        traceId: `trace-${'x'.repeat(100)}`,
        operation: `operation-${'x'.repeat(200)}`,
        component: `component-${'x'.repeat(100)}`,
        customField: 'x'.repeat(5000),
      }

      const entry = LogEntryModel.create({
        level: 'debug',
        message: longMessage,
        metadata: largeMetadata,
      })

      expect(entry.message.length).toBeGreaterThan(10000)
      expect((entry.metadata as any)?.customField?.length).toBe(5000)
    })

    it('should handle empty metadata object', () => {
      const entry = LogEntryModel.create({
        level: 'info',
        message: 'Test message',
        metadata: {},
      })

      expect(entry.metadata).toEqual({})
      expect(Object.keys(entry.metadata!)).toHaveLength(0)
    })

    it('should handle null and undefined metadata', () => {
      const entryWithoutMetadata = LogEntryModel.create({
        level: 'info',
        message: 'Test message',
        metadata: undefined,
      })

      expect(entryWithoutMetadata.metadata).toBeUndefined()
    })

    it('should handle deeply nested metadata', () => {
      const deepMetadata: LogMetadata = {
        level1: {
          level2: {
            level3: {
              level4: {
                deepValue: 'found',
              },
            },
          },
        },
        array: [1, 2, { nested: 'value' }],
        mixedTypes: {
          string: 'text',
          number: 42,
          boolean: true,
          null: null,
          undefined: undefined,
          date: new Date(),
          array: ['a', 'b', 'c'],
        },
      }

      const entry = LogEntryModel.create({
        level: 'info',
        message: 'Complex metadata test',
        metadata: deepMetadata,
      })

      expect((entry.metadata as any)?.level1?.level2?.level3?.level4?.deepValue).toBe('found')
      expect(((entry.metadata as any)?.array?.[2] as any)?.nested).toBe('value')
      expect((entry.metadata as any)?.mixedTypes?.number).toBe(42)
    })

    it('should handle special characters and Unicode', () => {
      const unicodeEntry = LogEntryModel.create({
        level: 'info',
        message: 'Unicode test: こんにちは 🎉 émoji test',
        metadata: {
          unicodeField: 'Тест с кириллицей and العربية',
          emoji: '🚀🎯💡',
          quotes: 'Text with "quotes" and \'apostrophes\'',
          specialChars: 'Line 1\nLine 2\tTabbed\rCarriage Return',
        },
      })

      expect(unicodeEntry.message).toContain('こんにちは')
      expect(unicodeEntry.message).toContain('🎉')
      expect((unicodeEntry.metadata as any)?.emoji).toBe('🚀🎯💡')
      expect((unicodeEntry.metadata as any)?.quotes).toContain('"quotes"')
    })

    it('should handle very large metadata objects', () => {
      const largeMetadata: Record<string, unknown> = {}

      // Create 1000 metadata fields
      for (let i = 0; i < 1000; i++) {
        largeMetadata[`field${i}`] = `value${i}`
      }

      const entry = LogEntryModel.create({
        level: 'info',
        message: 'Large metadata test',
        metadata: largeMetadata,
      })

      expect(Object.keys(entry.metadata!)).toHaveLength(1000)
      expect((entry.metadata as any).field0).toBe('value0')
      expect((entry.metadata as any).field999).toBe('value999')
    })
  })
})
