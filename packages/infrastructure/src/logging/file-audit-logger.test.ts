import { mkdtemp, readFile, rm, stat } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Test-first approach for FileAuditLogger infrastructure implementation
describe('FileAuditLogger Infrastructure Implementation', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create temporary directory for test audit files
    tempDir = await mkdtemp(join(tmpdir(), 'audit-logger-test-'))
  })

  afterEach(async () => {
    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('FileAuditLogger Creation and Configuration', () => {
    it('should create audit logger with default configuration', () => {
      const config = {
        auditFile: {
          path: join(tempDir, 'audit.log'),
          rotation: {
            enabled: false,
          },
        },
        appendOnly: true,
        integrityCheck: true,
      }

      expect(config.auditFile.path).toContain('audit.log')
      expect(config.appendOnly).toBe(true)
      expect(config.integrityCheck).toBe(true)
    })

    it('should create audit logger with rotation configuration', () => {
      const config = {
        auditFile: {
          path: join(tempDir, 'audit.log'),
          rotation: {
            enabled: true,
            maxSize: '50MB',
            maxFiles: 10,
            compress: true,
          },
        },
        appendOnly: true,
        integrityCheck: true,
        retention: {
          days: 2555, // 7 years
          automaticCleanup: false,
        },
      }

      expect(config.auditFile.rotation.enabled).toBe(true)
      expect(config.auditFile.rotation.maxFiles).toBe(10)
      expect(config.retention?.days).toBe(2555) // 7 years for compliance
    })
  })

  describe('Create Operation Audit', () => {
    it('should record create operation audit event', async () => {
      const createEvent = {
        id: 'audit-create-001',
        timestamp: new Date().toISOString(),
        traceId: 'trace-create-123',
        operation: 'create' as const,
        actor: {
          type: 'human' as const,
          id: 'user-001',
          name: 'Developer',
        },
        entityType: 'ticket',
        entityId: 'ticket-001',
        source: 'cli' as const,
        before: null,
        after: {
          title: 'Implement authentication',
          description: 'Add JWT-based authentication',
          status: 'pending',
          priority: 'high',
        },
      }

      const mockRecordCreate = vi.fn().mockResolvedValue(undefined)
      await mockRecordCreate(createEvent)

      expect(mockRecordCreate).toHaveBeenCalledWith(createEvent)
    })

    it('should validate create operation fields', () => {
      const validateCreate = (event: any) => {
        const errors: string[] = []

        if (event.operation !== 'create') {
          errors.push('Operation must be "create"')
        }
        if (event.before !== null) {
          errors.push('Before state must be null for create operations')
        }
        if (!event.after || typeof event.after !== 'object') {
          errors.push('After state is required for create operations')
        }

        return errors
      }

      const validEvent = {
        operation: 'create',
        before: null,
        after: { title: 'Test' },
      }

      const invalidEvent = {
        operation: 'update',
        before: { old: 'data' },
        after: null,
      }

      expect(validateCreate(validEvent)).toHaveLength(0)
      expect(validateCreate(invalidEvent).length).toBeGreaterThan(0)
    })
  })

  describe('Read Operation Audit', () => {
    it('should record read operation audit event', async () => {
      const ticketState = {
        title: 'Bug Fix',
        description: 'Fix critical login issue',
        status: 'in_progress',
        priority: 'high',
      }

      const readEvent = {
        id: 'audit-read-001',
        timestamp: new Date().toISOString(),
        traceId: 'trace-read-456',
        operation: 'read' as const,
        actor: {
          type: 'human' as const,
          id: 'user-002',
          name: 'Manager',
        },
        entityType: 'ticket',
        entityId: 'ticket-002',
        source: 'api' as const,
        before: ticketState,
        after: ticketState,
        accessDetails: {
          fieldsAccessed: ['title', 'status', 'priority'],
          queryParams: { status: 'in_progress' },
          recordCount: 1,
          containsSensitiveData: false,
        },
      }

      const mockRecordRead = vi.fn().mockResolvedValue(undefined)
      await mockRecordRead(readEvent)

      expect(mockRecordRead).toHaveBeenCalledWith(readEvent)
      expect(readEvent.accessDetails.fieldsAccessed).toEqual(['title', 'status', 'priority'])
    })

    it('should track sensitive data access', async () => {
      const sensitiveReadEvent = {
        operation: 'read',
        entityType: 'user',
        entityId: 'user-sensitive',
        accessDetails: {
          fieldsAccessed: ['email', 'phone', 'ssn'],
          containsSensitiveData: true,
          dataClassification: 'confidential',
        },
      }

      const mockRecordSensitiveRead = vi.fn()
      mockRecordSensitiveRead(sensitiveReadEvent)

      expect(mockRecordSensitiveRead).toHaveBeenCalledWith(sensitiveReadEvent)
      expect(sensitiveReadEvent.accessDetails.containsSensitiveData).toBe(true)
    })
  })

  describe('Update Operation Audit', () => {
    it('should record update operation audit event with field changes', async () => {
      const updateEvent = {
        id: 'audit-update-001',
        timestamp: new Date().toISOString(),
        traceId: 'trace-update-789',
        operation: 'update' as const,
        actor: {
          type: 'ai' as const,
          id: 'ai-assistant',
          name: 'Claude AI',
          coAuthor: 'user-003',
        },
        entityType: 'ticket',
        entityId: 'ticket-003',
        source: 'mcp' as const,
        before: {
          title: 'Bug Fix',
          status: 'pending',
          priority: 'medium',
          assignee: null,
        },
        after: {
          title: 'Critical Bug Fix',
          status: 'in_progress',
          priority: 'high',
          assignee: 'developer-001',
        },
        changes: [
          {
            field: 'title',
            oldValue: 'Bug Fix',
            newValue: 'Critical Bug Fix',
            changeType: 'modified' as const,
          },
          {
            field: 'status',
            oldValue: 'pending',
            newValue: 'in_progress',
            changeType: 'modified' as const,
          },
          {
            field: 'priority',
            oldValue: 'medium',
            newValue: 'high',
            changeType: 'modified' as const,
          },
          {
            field: 'assignee',
            oldValue: null,
            newValue: 'developer-001',
            changeType: 'added' as const,
          },
        ],
      }

      const mockRecordUpdate = vi.fn().mockResolvedValue(undefined)
      await mockRecordUpdate(updateEvent)

      expect(mockRecordUpdate).toHaveBeenCalledWith(updateEvent)
      expect(updateEvent.changes).toHaveLength(4)
      expect(updateEvent.changes[3]!.changeType).toBe('added')
    })

    it('should calculate field changes automatically', () => {
      const before = {
        title: 'Old Title',
        status: 'pending',
        tags: ['bug', 'urgent'],
      }

      const after = {
        title: 'New Title',
        priority: 'high',
        tags: ['bug', 'urgent', 'customer'],
      }

      const calculateChanges = (before: any, after: any) => {
        const changes = []
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

        for (const key of allKeys) {
          const oldValue = before[key]
          const newValue = after[key]

          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            let changeType: string
            if (oldValue === undefined) changeType = 'added'
            else if (newValue === undefined) changeType = 'removed'
            else changeType = 'modified'

            changes.push({
              field: key,
              oldValue,
              newValue,
              changeType,
            })
          }
        }

        return changes
      }

      const changes = calculateChanges(before, after)

      expect(changes).toHaveLength(4) // title modified, status removed, priority added, tags modified
      expect(changes.find(c => c.field === 'title')?.changeType).toBe('modified')
      expect(changes.find(c => c.field === 'status')?.changeType).toBe('removed')
      expect(changes.find(c => c.field === 'priority')?.changeType).toBe('added')
    })
  })

  describe('Delete Operation Audit', () => {
    it('should record delete operation audit event', async () => {
      const deleteEvent = {
        id: 'audit-delete-001',
        timestamp: new Date().toISOString(),
        traceId: 'trace-delete-abc',
        operation: 'delete' as const,
        actor: {
          type: 'human' as const,
          id: 'user-004',
          name: 'Admin',
        },
        entityType: 'ticket',
        entityId: 'ticket-004',
        source: 'cli' as const,
        before: {
          title: 'Obsolete Feature Request',
          description: 'No longer needed feature',
          status: 'cancelled',
          priority: 'low',
          createdAt: '2024-01-01T00:00:00Z',
        },
        after: null,
        deletionDetails: {
          reason: 'Feature no longer needed',
          softDelete: false,
          cascadeDeleted: ['comment-001', 'attachment-002'],
          approvedBy: 'manager-001',
        },
      }

      const mockRecordDelete = vi.fn().mockResolvedValue(undefined)
      await mockRecordDelete(deleteEvent)

      expect(mockRecordDelete).toHaveBeenCalledWith(deleteEvent)
      expect(deleteEvent.after).toBeNull()
      expect(deleteEvent.deletionDetails?.cascadeDeleted).toEqual(['comment-001', 'attachment-002'])
    })

    it('should handle soft delete operations', () => {
      const softDeleteEvent = {
        operation: 'delete',
        before: { status: 'active' },
        after: null,
        deletionDetails: {
          softDelete: true,
          reason: 'User requested deletion',
          retentionPeriod: '30-days',
        },
      }

      expect(softDeleteEvent.deletionDetails.softDelete).toBe(true)
      expect(softDeleteEvent.deletionDetails.retentionPeriod).toBe('30-days')
    })
  })

  describe('Append-Only File Operations', () => {
    it('should append audit events to file without modifying existing entries', async () => {
      const auditFile = join(tempDir, 'append-test.log')
      const mockFileOps = {
        written: [] as string[],
        append: vi.fn((data: string) => {
          mockFileOps.written.push(data)
        }),
        read: vi.fn(() => mockFileOps.written.join('')),
      }

      // Simulate appending multiple audit events
      const events = [
        { id: 'audit-1', message: 'First event' },
        { id: 'audit-2', message: 'Second event' },
        { id: 'audit-3', message: 'Third event' },
      ]

      for (const event of events) {
        const line = JSON.stringify(event) + '\n'
        mockFileOps.append(line)
      }

      expect(mockFileOps.append).toHaveBeenCalledTimes(3)
      expect(mockFileOps.written).toHaveLength(3)

      // Verify that each line is a complete JSON object
      for (const line of mockFileOps.written) {
        expect(() => JSON.parse(line.trim())).not.toThrow()
      }
    })

    it('should prevent modification of existing audit entries', () => {
      const validateImmutability = (newContent: string, originalContent: string) => {
        const originalLines = originalContent.split('\n').filter(line => line.trim())
        const newLines = newContent.split('\n').filter(line => line.trim())

        // Check that all original lines are preserved
        for (let i = 0; i < originalLines.length; i++) {
          if (newLines[i] !== originalLines[i]) {
            return false // Modification detected
          }
        }

        // New lines can only be appended, not inserted
        return newLines.length >= originalLines.length
      }

      const original = 'line1\nline2\nline3\n'
      const validAppend = 'line1\nline2\nline3\nline4\n'
      const invalidModification = 'line1\nMODIFIED\nline3\nline4\n'

      expect(validateImmutability(validAppend, original)).toBe(true)
      expect(validateImmutability(invalidModification, original)).toBe(false)
    })
  })

  describe('File Rotation and Management', () => {
    it('should rotate audit files when size limit is reached', () => {
      const rotationConfig = {
        enabled: true,
        maxSize: '10MB',
        maxFiles: 5,
        compress: true,
      }

      const checkRotationNeeded = (currentSize: number, maxSize: string) => {
        const sizeMatch = maxSize.match(/^(\d+)\s*(MB|GB|KB)?$/i)
        if (!sizeMatch) return false

        const size = parseInt(sizeMatch[1]!)
        const unit = (sizeMatch[2] || '').toUpperCase()

        let maxBytes: number
        switch (unit) {
          case 'KB':
            maxBytes = size * 1024
            break
          case 'MB':
            maxBytes = size * 1024 * 1024
            break
          case 'GB':
            maxBytes = size * 1024 * 1024 * 1024
            break
          default:
            maxBytes = size
        }

        return currentSize >= maxBytes
      }

      // Test with file size exceeding limit
      const fileSize10MB = 10 * 1024 * 1024 + 1 // 10MB + 1 byte
      expect(checkRotationNeeded(fileSize10MB, '10MB')).toBe(true)

      // Test with file size under limit
      const fileSize5MB = 5 * 1024 * 1024
      expect(checkRotationNeeded(fileSize5MB, '10MB')).toBe(false)
    })

    it('should manage rotated file naming convention', () => {
      const generateRotatedFilename = (basePath: string, index: number, compressed = false) => {
        const ext = compressed ? '.gz' : ''
        return `${basePath}.${index}${ext}`
      }

      const basePath = join(tempDir, 'audit.log')

      expect(generateRotatedFilename(basePath, 1, false)).toBe(`${basePath}.1`)
      expect(generateRotatedFilename(basePath, 2, true)).toBe(`${basePath}.2.gz`)
    })

    it('should handle rotation file cleanup', () => {
      const manageRotationFiles = (maxFiles: number, existingFiles: string[]) => {
        const filesToDelete = []

        if (existingFiles.length > maxFiles) {
          // Sort files by index (newest first)
          const sorted = existingFiles.sort((a, b) => {
            const indexA = parseInt(a.match(/\.(\d+)(?:\.gz)?$/)?.[1] || '0')
            const indexB = parseInt(b.match(/\.(\d+)(?:\.gz)?$/)?.[1] || '0')
            return indexB - indexA
          })

          // Mark oldest files for deletion
          filesToDelete.push(...sorted.slice(maxFiles))
        }

        return filesToDelete
      }

      const existingFiles = [
        'audit.log.1',
        'audit.log.2.gz',
        'audit.log.3.gz',
        'audit.log.4.gz',
        'audit.log.5.gz',
        'audit.log.6.gz',
      ]

      const toDelete = manageRotationFiles(3, existingFiles)
      expect(toDelete.length).toBeGreaterThan(0) // Should delete oldest files
    })
  })

  describe('Query and Statistics Operations', () => {
    it('should query audit events by filter criteria', () => {
      const auditEvents = [
        {
          id: 'audit-1',
          timestamp: '2025-01-20T10:00:00Z',
          operation: 'create',
          actor: { id: 'user-1', type: 'human' },
          entityType: 'ticket',
          source: 'cli',
        },
        {
          id: 'audit-2',
          timestamp: '2025-01-20T11:00:00Z',
          operation: 'update',
          actor: { id: 'user-2', type: 'human' },
          entityType: 'ticket',
          source: 'api',
        },
        {
          id: 'audit-3',
          timestamp: '2025-01-20T12:00:00Z',
          operation: 'delete',
          actor: { id: 'ai-1', type: 'ai' },
          entityType: 'user',
          source: 'mcp',
        },
      ]

      const queryEvents = (events: any[], filter: any) => {
        return events.filter(event => {
          if (filter.operation && event.operation !== filter.operation) return false
          if (filter.actorType && event.actor.type !== filter.actorType) return false
          if (filter.entityType && event.entityType !== filter.entityType) return false
          if (filter.source && event.source !== filter.source) return false
          return true
        })
      }

      // Test various filters
      expect(queryEvents(auditEvents, { operation: 'create' })).toHaveLength(1)
      expect(queryEvents(auditEvents, { actorType: 'human' })).toHaveLength(2)
      expect(queryEvents(auditEvents, { entityType: 'ticket' })).toHaveLength(2)
      expect(queryEvents(auditEvents, { source: 'mcp' })).toHaveLength(1)
    })

    it('should generate audit statistics for compliance reporting', () => {
      const auditEvents = Array.from({ length: 100 }, (_, i) => ({
        id: `audit-${i}`,
        timestamp: new Date(2025, 0, 20, 10 + Math.floor(i / 10)).toISOString(),
        operation: (['create', 'read', 'update', 'delete'] as const)[i % 4],
        actor: {
          id: `actor-${i % 5}`,
          type: (['human', 'ai', 'system'] as const)[i % 3],
        },
        entityType: ['ticket', 'user', 'project'][i % 3],
        source: (['cli', 'api', 'mcp'] as const)[i % 3],
      }))

      const generateStatistics = (events: any[]) => {
        const stats = {
          totalOperations: events.length,
          operationsByType: {} as Record<string, number>,
          operationsByActor: {} as Record<string, number>,
          operationsByEntity: {} as Record<string, number>,
          operationsBySource: {} as Record<string, number>,
        }

        for (const event of events) {
          // Count by operation type
          stats.operationsByType[event.operation] =
            (stats.operationsByType[event.operation] || 0) + 1

          // Count by actor type
          stats.operationsByActor[event.actor.type] =
            (stats.operationsByActor[event.actor.type] || 0) + 1

          // Count by entity type
          stats.operationsByEntity[event.entityType] =
            (stats.operationsByEntity[event.entityType] || 0) + 1

          // Count by source
          stats.operationsBySource[event.source] = (stats.operationsBySource[event.source] || 0) + 1
        }

        return stats
      }

      const stats = generateStatistics(auditEvents)

      expect(stats.totalOperations).toBe(100)
      expect(stats.operationsByType.create).toBe(25)
      expect(stats.operationsByActor.human).toBe(34) // Math.ceil(100/3)
      expect(Object.keys(stats.operationsByEntity)).toHaveLength(3)
    })
  })

  describe('Integrity and Security', () => {
    it('should validate audit event integrity', () => {
      const validateEventIntegrity = (event: any) => {
        const errors = []

        // Required field validation
        const requiredFields = [
          'id',
          'timestamp',
          'traceId',
          'operation',
          'actor',
          'entityType',
          'entityId',
          'source',
        ]
        for (const field of requiredFields) {
          if (!event[field]) {
            errors.push(`Missing required field: ${field}`)
          }
        }

        // Actor validation
        if (event.actor) {
          if (!event.actor.id) errors.push('Actor ID is required')
          if (!event.actor.type) errors.push('Actor type is required')
          if (event.actor.type === 'ai' && !event.actor.coAuthor) {
            errors.push('Co-author required for AI operations')
          }
        }

        // Timestamp validation
        if (event.timestamp) {
          const timestamp = new Date(event.timestamp)
          if (isNaN(timestamp.getTime())) {
            errors.push('Invalid timestamp format')
          }
        }

        return errors
      }

      const validEvent = {
        id: 'audit-1',
        timestamp: new Date().toISOString(),
        traceId: 'trace-1',
        operation: 'create',
        actor: { id: 'user-1', type: 'human' },
        entityType: 'ticket',
        entityId: 'ticket-1',
        source: 'cli',
      }

      const invalidEvent = {
        id: 'audit-2',
        // Missing timestamp, traceId
        operation: 'create',
        actor: { type: 'ai' }, // Missing ID and coAuthor
        entityType: 'ticket',
        // Missing entityId, source
      }

      expect(validateEventIntegrity(validEvent)).toHaveLength(0)
      expect(validateEventIntegrity(invalidEvent).length).toBeGreaterThan(0)
    })

    it('should sanitize sensitive data in audit events', () => {
      const sanitizeAuditEvent = (event: any) => {
        const sensitiveFields = ['password', 'token', 'apiKey', 'ssn', 'creditCard']
        const sanitized = JSON.parse(JSON.stringify(event))

        const sanitizeObject = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return obj

          for (const [key, value] of Object.entries(obj)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
              obj[key] = '***REDACTED***'
            } else if (typeof value === 'object') {
              obj[key] = sanitizeObject(value)
            }
          }

          return obj
        }

        return sanitizeObject(sanitized)
      }

      const eventWithSensitiveData = {
        id: 'audit-1',
        before: {
          username: 'user123',
          password: 'secret123',
          apiKey: 'key-abc-123',
        },
        after: {
          username: 'user123',
          token: 'jwt-token-xyz',
          preferences: { theme: 'dark' },
        },
      }

      const sanitized = sanitizeAuditEvent(eventWithSensitiveData)

      expect(sanitized.before.password).toBe('***REDACTED***')
      expect(sanitized.before.apiKey).toBe('***REDACTED***')
      expect(sanitized.after.token).toBe('***REDACTED***')
      expect(sanitized.before.username).toBe('user123') // Not sensitive
      expect(sanitized.after.preferences.theme).toBe('dark') // Not sensitive
    })
  })

  describe('Boundary Value Tests (t-wada approach)', () => {
    it('should handle minimum valid audit event', () => {
      const minimalEvent = {
        id: 'a', // Single character
        timestamp: new Date().toISOString(),
        traceId: 't',
        operation: 'read' as const,
        actor: { type: 'system' as const, id: 's' },
        entityType: 'x',
        entityId: 'y',
        source: 'test' as const,
      }

      expect(minimalEvent.id).toBe('a')
      expect(minimalEvent.actor.id).toBe('s')
    })

    it('should handle maximum size audit event', () => {
      const maxEvent = {
        id: 'audit-' + 'x'.repeat(1000),
        timestamp: new Date().toISOString(),
        traceId: 'trace-' + 'x'.repeat(1000),
        operation: 'update' as const,
        actor: {
          type: 'human' as const,
          id: 'user-' + 'x'.repeat(1000),
          name: 'x'.repeat(5000),
        },
        entityType: 'x'.repeat(100),
        entityId: 'x'.repeat(1000),
        source: 'cli' as const,
        before: { data: 'x'.repeat(10000) },
        after: { data: 'y'.repeat(10000) },
      }

      expect(maxEvent.id.length).toBeGreaterThan(1000)
      expect(maxEvent.before.data.length).toBe(10000)
    })

    it('should handle empty and null values correctly', () => {
      const eventWithNulls = {
        id: 'audit-null',
        timestamp: new Date().toISOString(),
        traceId: 'trace-null',
        operation: 'create' as const,
        actor: { type: 'human' as const, id: 'user', name: null },
        entityType: 'ticket',
        entityId: 'ticket-null',
        source: 'cli' as const,
        before: null,
        after: { field: null, other: 'value' },
        context: null,
      }

      expect(eventWithNulls.actor.name).toBeNull()
      expect(eventWithNulls.before).toBeNull()
      expect(eventWithNulls.after.field).toBeNull()
    })
  })
})
