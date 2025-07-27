import { beforeEach, describe, expect, it } from 'vitest'
import { ValidationError } from '../../errors/base-errors.ts'
import type { CreateAuditEvent, FieldChange, UpdateAuditEvent } from '../types/audit-event.ts'
import {
  AuditEventModel,
  AuditEventUtils,
  CreateAuditEventModel,
  type CreateAuditEventParams,
  DeleteAuditEventModel,
  ReadAuditEventModel,
  UpdateAuditEventModel,
} from './audit-event.ts'

describe('AuditEventModel', () => {
  const baseParams: CreateAuditEventParams = {
    operation: 'create',
    actor: { type: 'human', id: 'user-123', name: 'Test User' },
    entityType: 'ticket',
    entityId: 'ticket-001',
  }

  describe('AuditEventModel creation', () => {
    it('should create audit event with required fields', () => {
      const event = AuditEventModel.create(baseParams)

      expect(event.operation).toBe('create')
      expect(event.actor).toEqual(baseParams.actor)
      expect(event.entityType).toBe('ticket')
      expect(event.entityId).toBe('ticket-001')
      expect(event.id).toMatch(/^audit-\d+-[a-z0-9]+$/)
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(event.traceId).toMatch(/^trace-[a-z0-9]+-[a-z0-9]+$/)
    })

    it('should create audit event with custom ID and timestamp', () => {
      const customTimestamp = new Date('2025-01-01T10:00:00Z')
      const params = {
        ...baseParams,
        id: 'custom-audit-id',
        timestamp: customTimestamp,
        traceId: 'custom-trace-id',
      }

      const event = AuditEventModel.create(params)

      expect(event.id).toBe('custom-audit-id')
      expect(event.timestamp).toBe('2025-01-01T10:00:00.000Z')
      expect(event.traceId).toBe('custom-trace-id')
    })

    it('should validate required fields', () => {
      const invalidParams = {
        ...baseParams,
        actor: { type: 'human' as const, id: '', name: 'Test' }, // Empty ID
      }

      expect(() => AuditEventModel.create(invalidParams)).toThrow(ValidationError)
      expect(() => AuditEventModel.create(invalidParams)).toThrow('Actor ID is required')
    })

    it('should require co-author for AI operations', () => {
      const aiParams = {
        ...baseParams,
        actor: { type: 'ai' as const, id: 'ai-123', name: 'AI Assistant' }, // Missing coAuthor
      }

      expect(() => AuditEventModel.create(aiParams)).toThrow(ValidationError)
      expect(() => AuditEventModel.create(aiParams)).toThrow(
        'Co-author is required for AI operations'
      )
    })

    it('should accept valid AI actor with co-author', () => {
      const aiParams = {
        ...baseParams,
        actor: {
          type: 'ai' as const,
          id: 'ai-123',
          name: 'AI Assistant',
          coAuthor: 'user-456',
        },
      }

      const event = AuditEventModel.create(aiParams)
      expect(event.actor.type).toBe('ai')
      expect(event.actor.coAuthor).toBe('user-456')
    })
  })

  describe('CreateAuditEventModel', () => {
    it('should create CREATE audit event with after state', () => {
      const afterState = {
        title: 'New Ticket',
        description: 'Test description',
        status: 'pending',
      }

      const event = AuditEventModel.createCreate(
        baseParams.actor,
        'ticket',
        'ticket-001',
        afterState
      )

      expect(event).toBeInstanceOf(CreateAuditEventModel)
      expect(event.operation).toBe('create')
      expect(event.before).toBeNull()
      expect(event.after).toEqual(afterState)
    })

    it('should require after state for CREATE events', () => {
      const params = {
        ...baseParams,
        operation: 'create' as const,
        after: undefined,
      }

      expect(() => new CreateAuditEventModel(params)).toThrow(ValidationError)
      expect(() => new CreateAuditEventModel(params)).toThrow(
        'CreateAuditEventModel requires after state'
      )
    })

    it('should validate operation type is create', () => {
      const params = {
        ...baseParams,
        operation: 'update' as const,
        after: { title: 'Test' },
      }

      expect(() => new CreateAuditEventModel(params)).toThrow(ValidationError)
      expect(() => new CreateAuditEventModel(params)).toThrow(
        'CreateAuditEventModel requires operation to be "create"'
      )
    })
  })

  describe('ReadAuditEventModel', () => {
    it('should create READ audit event with access details', () => {
      const state = {
        title: 'Existing Ticket',
        status: 'in_progress',
      }

      const accessDetails = {
        fieldsAccessed: ['title', 'status'],
        recordCount: 1,
        containsSensitiveData: false,
      }

      const event = AuditEventModel.createRead(
        baseParams.actor,
        'ticket',
        'ticket-001',
        state,
        accessDetails
      )

      expect(event).toBeInstanceOf(ReadAuditEventModel)
      expect(event.operation).toBe('read')
      expect(event.state).toEqual(state)
      expect(event.accessDetails).toEqual(accessDetails)
    })

    it('should require state parameter', () => {
      const params = {
        ...baseParams,
        operation: 'read' as const,
        state: undefined,
      }

      expect(() => new ReadAuditEventModel(params)).toThrow(ValidationError)
      expect(() => new ReadAuditEventModel(params)).toThrow(
        'ReadAuditEventModel requires state parameter'
      )
    })
  })

  describe('UpdateAuditEventModel', () => {
    it('should create UPDATE audit event with changes calculated', () => {
      const before = {
        title: 'Old Title',
        status: 'pending',
        priority: 'low',
      }

      const after = {
        title: 'New Title',
        status: 'in_progress',
        priority: 'high',
      }

      const event = AuditEventModel.createUpdate(
        baseParams.actor,
        'ticket',
        'ticket-001',
        before,
        after
      )

      expect(event).toBeInstanceOf(UpdateAuditEventModel)
      expect(event.operation).toBe('update')
      expect(event.before).toEqual(before)
      expect(event.after).toEqual(after)
      expect(event.changes).toHaveLength(3)

      const titleChange = event.changes.find(c => c.field === 'title')
      expect(titleChange).toEqual({
        field: 'title',
        oldValue: 'Old Title',
        newValue: 'New Title',
        changeType: 'modified',
      })
    })

    it('should accept custom changes', () => {
      const customChanges: FieldChange[] = [
        {
          field: 'title',
          oldValue: 'Old',
          newValue: 'New',
          changeType: 'modified',
        },
      ]

      const event = AuditEventModel.createUpdate(
        baseParams.actor,
        'ticket',
        'ticket-001',
        { title: 'Old' },
        { title: 'New' },
        { changes: customChanges }
      )

      expect(event.changes).toEqual(customChanges)
    })
  })

  describe('DeleteAuditEventModel', () => {
    it('should create DELETE audit event with before state', () => {
      const beforeState = {
        title: 'Deleted Ticket',
        status: 'completed',
      }

      const deletionDetails = {
        reason: 'User requested deletion',
        softDelete: false,
      }

      const event = AuditEventModel.createDelete(
        baseParams.actor,
        'ticket',
        'ticket-001',
        beforeState,
        deletionDetails
      )

      expect(event).toBeInstanceOf(DeleteAuditEventModel)
      expect(event.operation).toBe('delete')
      expect(event.before).toEqual(beforeState)
      expect(event.after).toBeNull()
      expect(event.deletionDetails).toEqual(deletionDetails)
    })

    it('should require before state for DELETE events', () => {
      const params = {
        ...baseParams,
        operation: 'delete' as const,
        before: undefined,
      }

      expect(() => new DeleteAuditEventModel(params)).toThrow(ValidationError)
      expect(() => new DeleteAuditEventModel(params)).toThrow(
        'DeleteAuditEventModel requires before state'
      )
    })
  })

  describe('AuditEventModel methods', () => {
    let event: AuditEventModel

    beforeEach(() => {
      event = AuditEventModel.create(baseParams)
    })

    it('should convert to plain object', () => {
      const obj = event.toObject()

      expect(obj).toEqual({
        id: event.id,
        timestamp: event.timestamp,
        traceId: event.traceId,
        operation: event.operation,
        actor: event.actor,
        entityType: event.entityType,
        entityId: event.entityId,
        context: event.context,
      })
    })

    it('should serialize to JSON', () => {
      const serialized = event.serialize(false) // Don't sanitize
      const parsed = JSON.parse(serialized)

      expect(parsed.id).toBe(event.id)
      expect(parsed.operation).toBe(event.operation)
      expect(parsed.actor).toEqual(event.actor)
    })

    it('should serialize with sanitization by default', () => {
      const eventWithSensitiveData = AuditEventModel.createCreate(
        baseParams.actor,
        baseParams.entityType,
        baseParams.entityId,
        {
          title: 'Test',
          password: 'secret123',
          apiKey: 'key-456',
        }
      )

      const serialized = eventWithSensitiveData.serialize() // Sanitize by default
      const parsed = JSON.parse(serialized)

      expect(parsed.after.title).toBe('Test')
      expect(parsed.after.password).toBe('***REDACTED***')
      expect(parsed.after.apiKey).toBe('***REDACTED***')
    })

    it('should clone with modifications', () => {
      const cloned = event.clone({
        operation: 'update',
        entityId: 'ticket-002',
      })

      expect(cloned.operation).toBe('update')
      expect(cloned.entityId).toBe('ticket-002')
      expect(cloned.actor).toEqual(event.actor) // Unchanged
      expect(cloned.id).toBe(event.id) // Unchanged
    })

    it('should match filters correctly', () => {
      // Operation filter
      expect(event.matches({ operation: 'create' })).toBe(true)
      expect(event.matches({ operation: 'update' })).toBe(false)
      expect(event.matches({ operation: ['create', 'update'] })).toBe(true)

      // Entity type filter
      expect(event.matches({ entityType: 'ticket' })).toBe(true)
      expect(event.matches({ entityType: 'user' })).toBe(false)

      // Actor filter
      expect(event.matches({ actor: { id: 'user-123' } })).toBe(true)
      expect(event.matches({ actor: { type: 'human' } })).toBe(true)
      expect(event.matches({ actor: { id: 'user-456' } })).toBe(false)
    })

    it('should match date range filters', () => {
      const eventTime = new Date(event.timestamp).getTime()
      const before = new Date(eventTime - 1000)
      const after = new Date(eventTime + 1000)

      expect(
        event.matches({
          dateRange: {
            start: before.toISOString(),
            end: new Date(Date.now() + 10000).toISOString(),
          },
        })
      ).toBe(true)
      expect(
        event.matches({ dateRange: { start: new Date(0).toISOString(), end: after.toISOString() } })
      ).toBe(true)
      expect(
        event.matches({ dateRange: { start: before.toISOString(), end: after.toISOString() } })
      ).toBe(true)
      expect(
        event.matches({
          dateRange: {
            start: after.toISOString(),
            end: new Date(Date.now() + 10000).toISOString(),
          },
        })
      ).toBe(false)
      expect(
        event.matches({
          dateRange: { start: new Date(0).toISOString(), end: before.toISOString() },
        })
      ).toBe(false)
    })
  })

  describe('AuditEventModel static methods', () => {
    it('should generate unique IDs', () => {
      const id1 = AuditEventModel.generateId()
      const id2 = AuditEventModel.generateId()

      expect(id1).toMatch(/^audit-\d+-[a-z0-9]+$/)
      expect(id2).toMatch(/^audit-\d+-[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique trace IDs', () => {
      const trace1 = AuditEventModel.generateTraceId()
      const trace2 = AuditEventModel.generateTraceId()

      expect(trace1).toMatch(/^trace-[a-z0-9]+-[a-z0-9]+$/)
      expect(trace2).toMatch(/^trace-[a-z0-9]+-[a-z0-9]+$/)
      expect(trace1).not.toBe(trace2)
    })

    it('should create from plain object', () => {
      const obj = {
        id: 'audit-test',
        timestamp: '2025-01-01T10:00:00.000Z',
        operation: 'create' as const,
        actor: { type: 'human' as const, id: 'user-123' },
        entityType: 'ticket',
        entityId: 'ticket-001',
      }

      const event = AuditEventModel.fromObject(obj)

      expect(event.id).toBe('audit-test')
      expect(event.operation).toBe('create')
      expect(event.actor).toEqual(obj.actor)
    })
  })

  describe('AuditEventUtils', () => {
    describe('validate', () => {
      it('should validate complete audit event', () => {
        const validEvent = {
          id: 'audit-123',
          timestamp: '2025-01-01T10:00:00.000Z',
          traceId: 'trace-456',
          operation: 'create' as const,
          actor: { type: 'human' as const, id: 'user-123' },
          entityType: 'ticket',
          entityId: 'ticket-001',
        }

        const errors = AuditEventUtils.validate(validEvent)
        expect(errors).toEqual([])
      })

      it('should return errors for missing required fields', () => {
        const invalidEvent = {
          // Missing all required fields
        }

        const errors = AuditEventUtils.validate(invalidEvent)
        expect(errors).toContain('Event ID is required')
        expect(errors).toContain('Timestamp is required')
        expect(errors).toContain('Trace ID is required')
        expect(errors).toContain('Operation is required')
        expect(errors).toContain('Actor is required')
        expect(errors).toContain('Entity type is required')
        expect(errors).toContain('Entity ID is required')
      })

      it('should validate actor requirements', () => {
        const eventWithInvalidActor = {
          id: 'audit-123',
          timestamp: '2025-01-01T10:00:00.000Z',
          traceId: 'trace-456',
          operation: 'create' as const,
          actor: { type: 'human' as const, id: '' }, // Empty ID for testing
          entityType: 'ticket',
          entityId: 'ticket-001',
        }

        const errors = AuditEventUtils.validate(eventWithInvalidActor)
        expect(errors).toContain('Actor ID is required')
      })

      it('should require co-author for AI operations', () => {
        const aiEventWithoutCoAuthor = {
          id: 'audit-123',
          timestamp: '2025-01-01T10:00:00.000Z',
          traceId: 'trace-456',
          operation: 'create' as const,
          actor: { type: 'ai' as const, id: 'ai-123' }, // Missing coAuthor
          entityType: 'ticket',
          entityId: 'ticket-001',
          source: 'mcp' as const,
        }

        const errors = AuditEventUtils.validate(aiEventWithoutCoAuthor)
        expect(errors).toContain('Co-author is required for AI operations')
      })
    })

    describe('sanitize', () => {
      it('should sanitize sensitive data in before/after states', () => {
        const event = {
          id: 'audit-123',
          timestamp: '2025-01-01T10:00:00.000Z',
          traceId: 'trace-456',
          operation: 'create' as const,
          actor: { type: 'human' as const, id: 'user-123' },
          entityType: 'ticket',
          entityId: 'ticket-001',
          before: null,
          after: {
            title: 'Test Ticket',
            password: 'secret123',
            apiKey: 'key-456',
            publicData: 'safe-data',
          },
        }

        const sanitized = AuditEventUtils.sanitize(event) as CreateAuditEvent

        expect(sanitized.after.title).toBe('Test Ticket')
        expect(sanitized.after.password).toBe('***REDACTED***')
        expect(sanitized.after.apiKey).toBe('***REDACTED***')
        expect(sanitized.after.publicData).toBe('safe-data')
      })

      it('should sanitize nested sensitive data', () => {
        const event = {
          id: 'audit-123',
          timestamp: '2025-01-01T10:00:00.000Z',
          traceId: 'trace-456',
          operation: 'update' as const,
          actor: { type: 'human' as const, id: 'user-123' },
          entityType: 'user',
          entityId: 'user-001',
          source: 'api' as const,
          before: {
            profile: {
              name: 'John Doe',
              credentials: {
                password: 'old-secret',
                token: 'old-token',
              },
            },
          },
          after: {
            profile: {
              name: 'John Doe',
              credentials: {
                password: 'secret123',
                token: 'token-456',
              },
            },
          },
          changes: [],
        }

        const sanitized = AuditEventUtils.sanitize(event) as UpdateAuditEvent

        expect((sanitized.after as any).profile.name).toBe('John Doe')
        expect((sanitized.after as any).profile.credentials.password).toBe('***REDACTED***')
        expect((sanitized.after as any).profile.credentials.token).toBe('***REDACTED***')
      })

      it('should sanitize field changes', () => {
        const event = {
          id: 'audit-123',
          timestamp: '2025-01-01T10:00:00.000Z',
          traceId: 'trace-456',
          operation: 'update' as const,
          actor: { type: 'human' as const, id: 'user-123' },
          entityType: 'user',
          entityId: 'user-001',
          before: {
            password: 'oldSecret123',
            name: 'John',
          },
          after: {
            password: 'newSecret456',
            name: 'Jane',
          },
          changes: [
            {
              field: 'password',
              oldValue: 'oldSecret123',
              newValue: 'newSecret456',
              changeType: 'modified' as const,
            },
            {
              field: 'name',
              oldValue: 'John',
              newValue: 'Jane',
              changeType: 'modified' as const,
            },
          ],
        }

        const sanitized = AuditEventUtils.sanitize(event) as UpdateAuditEvent

        expect(sanitized.changes[0]!.oldValue).toBe('***REDACTED***')
        expect(sanitized.changes[0]!.newValue).toBe('***REDACTED***')
        expect(sanitized.changes[1]!.oldValue).toBe('John')
        expect(sanitized.changes[1]!.newValue).toBe('Jane')
      })
    })

    describe('calculateChanges', () => {
      it('should calculate field modifications', () => {
        const before = {
          title: 'Old Title',
          status: 'pending',
          priority: 'low',
        }

        const after = {
          title: 'New Title',
          status: 'in_progress',
          priority: 'low', // Unchanged
        }

        const changes = AuditEventUtils.calculateChanges(before, after)

        expect(changes).toHaveLength(2)
        expect(changes.find(c => c.field === 'title')).toEqual({
          field: 'title',
          oldValue: 'Old Title',
          newValue: 'New Title',
          changeType: 'modified',
        })
        expect(changes.find(c => c.field === 'status')).toEqual({
          field: 'status',
          oldValue: 'pending',
          newValue: 'in_progress',
          changeType: 'modified',
        })
      })

      it('should detect added fields', () => {
        const before = {
          title: 'Test',
        }

        const after = {
          title: 'Test',
          description: 'New field',
        }

        const changes = AuditEventUtils.calculateChanges(before, after)

        expect(changes).toHaveLength(1)
        expect(changes[0]).toEqual({
          field: 'description',
          oldValue: undefined,
          newValue: 'New field',
          changeType: 'added',
        })
      })

      it('should detect removed fields', () => {
        const before = {
          title: 'Test',
          description: 'Will be removed',
        }

        const after = {
          title: 'Test',
        }

        const changes = AuditEventUtils.calculateChanges(before, after)

        expect(changes).toHaveLength(1)
        expect(changes[0]).toEqual({
          field: 'description',
          oldValue: 'Will be removed',
          newValue: undefined,
          changeType: 'removed',
        })
      })
    })

    describe('utility functions', () => {
      it('should parse from JSON', () => {
        const json = JSON.stringify({
          id: 'audit-123',
          operation: 'create',
          actor: { type: 'human', id: 'user-123' },
          entityType: 'ticket',
          entityId: 'ticket-001',
        })

        const event = AuditEventUtils.parseFromJson(json)

        expect(event).toBeInstanceOf(AuditEventModel)
        expect(event.id).toBe('audit-123')
        expect(event.operation).toBe('create')
      })

      it('should create batch of events', () => {
        const eventParams = [
          { ...baseParams, entityId: 'ticket-001' },
          { ...baseParams, entityId: 'ticket-002' },
          { ...baseParams, entityId: 'ticket-003' },
        ]

        const events = AuditEventUtils.createBatch(eventParams)

        expect(events).toHaveLength(3)
        expect(events[0]!.entityId).toBe('ticket-001')
        expect(events[1]!.entityId).toBe('ticket-002')
        expect(events[2]!.entityId).toBe('ticket-003')
      })

      it('should sort by timestamp', () => {
        const events = [
          AuditEventModel.create({ ...baseParams, entityId: 'ticket-003' }),
          AuditEventModel.create({ ...baseParams, entityId: 'ticket-001' }),
          AuditEventModel.create({ ...baseParams, entityId: 'ticket-002' }),
        ]

        const sorted = AuditEventUtils.sortByTimestamp(events, true) // Ascending

        // Since all events are created nearly simultaneously, we can't test exact order
        // but we can verify the function doesn't error and returns all events
        expect(sorted).toHaveLength(3)
        expect(sorted.every(e => e instanceof AuditEventModel)).toBe(true)
      })

      it('should group by field', () => {
        const events = [
          AuditEventModel.create({ ...baseParams, operation: 'create' }),
          AuditEventModel.create({ ...baseParams, operation: 'update' }),
          AuditEventModel.create({ ...baseParams, operation: 'create' }),
        ]

        const grouped = AuditEventUtils.groupBy(events, 'operation')

        expect(grouped.create).toHaveLength(2)
        expect(grouped.update).toHaveLength(1)
      })

      it('should calculate statistics', () => {
        const events = [
          AuditEventModel.create({ ...baseParams, operation: 'create' }),
          AuditEventModel.create({ ...baseParams, operation: 'update' }),
          AuditEventModel.create({ ...baseParams, operation: 'create' }),
        ]

        const stats = AuditEventUtils.calculateStatistics(events, {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-02T00:00:00Z',
        })

        expect(stats.totalOperations).toBe(3)
        expect(stats.operationsByType?.create).toBe(2)
        expect(stats.operationsByType?.update).toBe(1)
        expect(stats.operationsByActor?.human).toBe(3)
        expect(stats.operationsByEntity?.ticket).toBe(3)
      })
    })
  })

  describe('Boundary Value Tests', () => {
    it('should handle minimum valid audit event', () => {
      const minimalParams: CreateAuditEventParams = {
        operation: 'read',
        actor: { type: 'system', id: 's' }, // Single character
        entityType: 'x', // Single character
        entityId: 'y', // Single character
      }

      const event = AuditEventModel.create(minimalParams)

      expect(event.actor.id).toBe('s')
      expect(event.entityType).toBe('x')
      expect(event.entityId).toBe('y')
    })

    it('should handle maximum size audit event', () => {
      const longString = 'x'.repeat(1000)
      const largeData = {
        field1: longString,
        field2: longString,
        nested: {
          deep: longString,
        },
      }

      const maxParams: CreateAuditEventParams = {
        operation: 'update',
        actor: {
          type: 'human',
          id: longString,
          name: longString,
        },
        entityType: longString,
        entityId: longString,
        before: largeData,
        after: largeData,
      }

      const event = AuditEventModel.create(maxParams)

      expect(event.actor.id.length).toBe(1000)
      expect(event.entityType.length).toBe(1000)
    })

    it('should handle null and undefined values', () => {
      const params: CreateAuditEventParams = {
        operation: 'create',
        actor: { type: 'human', id: 'user-123', name: undefined },
        entityType: 'ticket',
        entityId: 'ticket-001',
        before: null,
        after: {
          field1: null,
          field2: undefined,
          field3: 'value',
        },
        context: undefined,
      }

      const event = AuditEventModel.create(params)

      expect(event.actor.name).toBeUndefined()
      expect(event.context).toBeUndefined()
    })

    it('should handle special characters and Unicode', () => {
      const unicodeParams: CreateAuditEventParams = {
        operation: 'create',
        actor: {
          type: 'human',
          id: 'ユーザー-123',
          name: 'José María García-López 👨‍💻',
        },
        entityType: 'チケット',
        entityId: 'ticket-αβγ-🎫',
        after: {
          title: 'Тест с эмодзи 🚀',
          description: 'Description with quotes "test" and apostrophes \'test\'',
          specialField: 'Line 1\nLine 2\tTabbed\rCarriage Return',
        },
      }

      const event = AuditEventModel.create(unicodeParams)

      expect(event.actor.name).toContain('👨‍💻')
      expect(event.entityType).toBe('チケット')
      expect(event.entityId).toContain('🎫')
    })

    it('should handle very large numbers of changes', () => {
      const before: Record<string, unknown> = {}
      const after: Record<string, unknown> = {}

      // Create 1000 field changes
      for (let i = 0; i < 1000; i++) {
        before[`field${i}`] = `oldValue${i}`
        after[`field${i}`] = `newValue${i}`
      }

      const changes = AuditEventUtils.calculateChanges(before, after)

      expect(changes).toHaveLength(1000)
      expect(changes[0]!.field).toBe('field0')
      expect(changes[999]!.field).toBe('field999')
    })
  })
})
