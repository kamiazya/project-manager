import { describe, expect, it } from 'vitest'
import {
  isValidTicketPriority,
  isValidTicketPrivacy,
  isValidTicketStatus,
  isValidTicketType,
  TICKET_DEFAULTS,
  type TicketPriority,
  type TicketPrivacy,
  type TicketStatus,
  type TicketType,
  TicketValidationError,
} from './ticket-types.ts'

describe('TicketStatus type', () => {
  describe('type definition', () => {
    it('should accept valid status values', () => {
      const statuses: TicketStatus[] = ['pending', 'in_progress', 'completed', 'archived']

      expect(statuses).toHaveLength(4)
      expect(statuses).toContain('pending')
      expect(statuses).toContain('in_progress')
      expect(statuses).toContain('completed')
      expect(statuses).toContain('archived')
    })

    it('should enforce type safety at compile time', () => {
      // These should compile successfully
      const pending: TicketStatus = 'pending'
      const inProgress: TicketStatus = 'in_progress'
      const completed: TicketStatus = 'completed'
      const archived: TicketStatus = 'archived'

      expect(pending).toBe('pending')
      expect(inProgress).toBe('in_progress')
      expect(completed).toBe('completed')
      expect(archived).toBe('archived')
    })

    it('should work with arrays and collections', () => {
      const statusCollection: TicketStatus[] = []
      statusCollection.push('pending')
      statusCollection.push('in_progress')

      expect(statusCollection).toHaveLength(2)
      expect(statusCollection[0]).toBe('pending')
      expect(statusCollection[1]).toBe('in_progress')
    })
  })

  describe('business logic compatibility', () => {
    it('should support status transition logic', () => {
      const transitions: Array<{ from: TicketStatus; to: TicketStatus; valid: boolean }> = [
        { from: 'pending', to: 'in_progress', valid: true },
        { from: 'in_progress', to: 'completed', valid: true },
        { from: 'pending', to: 'archived', valid: true },
        { from: 'completed', to: 'archived', valid: true },
        { from: 'completed', to: 'pending', valid: false },
        { from: 'archived', to: 'pending', valid: false },
      ]

      transitions.forEach(transition => {
        expect(typeof transition.from).toBe('string')
        expect(typeof transition.to).toBe('string')
        expect(typeof transition.valid).toBe('boolean')
      })
    })

    it('should support status grouping operations', () => {
      const activeStatuses: TicketStatus[] = ['pending', 'in_progress']
      const inactiveStatuses: TicketStatus[] = ['completed', 'archived']

      expect(activeStatuses).toHaveLength(2)
      expect(inactiveStatuses).toHaveLength(2)
      expect([...activeStatuses, ...inactiveStatuses]).toHaveLength(4)
    })
  })
})

describe('TicketPriority type', () => {
  describe('type definition', () => {
    it('should accept valid priority values', () => {
      const priorities: TicketPriority[] = ['high', 'medium', 'low']

      expect(priorities).toHaveLength(3)
      expect(priorities).toContain('high')
      expect(priorities).toContain('medium')
      expect(priorities).toContain('low')
    })

    it('should enforce type safety at compile time', () => {
      const high: TicketPriority = 'high'
      const medium: TicketPriority = 'medium'
      const low: TicketPriority = 'low'

      expect(high).toBe('high')
      expect(medium).toBe('medium')
      expect(low).toBe('low')
    })

    it('should support priority ordering logic', () => {
      const priorityOrder: TicketPriority[] = ['high', 'medium', 'low']
      const priorities = ['low', 'high', 'medium'] as TicketPriority[]

      const sorted = priorities.sort((a, b) => {
        return priorityOrder.indexOf(a) - priorityOrder.indexOf(b)
      })

      expect(sorted).toEqual(['high', 'medium', 'low'])
    })
  })

  describe('business logic compatibility', () => {
    it('should support priority-based filtering', () => {
      const tickets = [
        { id: '1', priority: 'high' as TicketPriority },
        { id: '2', priority: 'low' as TicketPriority },
        { id: '3', priority: 'medium' as TicketPriority },
        { id: '4', priority: 'high' as TicketPriority },
      ]

      const highPriorityTickets = tickets.filter(t => t.priority === 'high')
      expect(highPriorityTickets).toHaveLength(2)
    })

    it('should support priority escalation logic', () => {
      const escalationMap: Record<TicketPriority, TicketPriority | null> = {
        low: 'medium',
        medium: 'high',
        high: null, // Cannot escalate further
      }

      expect(escalationMap.low).toBe('medium')
      expect(escalationMap.medium).toBe('high')
      expect(escalationMap.high).toBeNull()
    })
  })
})

describe('TicketType type', () => {
  describe('type definition', () => {
    it('should accept valid type values', () => {
      const types: TicketType[] = ['feature', 'bug', 'task']

      expect(types).toHaveLength(3)
      expect(types).toContain('feature')
      expect(types).toContain('bug')
      expect(types).toContain('task')
    })

    it('should enforce type safety at compile time', () => {
      const feature: TicketType = 'feature'
      const bug: TicketType = 'bug'
      const task: TicketType = 'task'

      expect(feature).toBe('feature')
      expect(bug).toBe('bug')
      expect(task).toBe('task')
    })

    it('should support type-based categorization', () => {
      const developmentTypes: TicketType[] = ['feature', 'bug']
      const operationalTypes: TicketType[] = ['task']

      expect(developmentTypes).toHaveLength(2)
      expect(operationalTypes).toHaveLength(1)
      expect([...developmentTypes, ...operationalTypes]).toHaveLength(3)
    })
  })

  describe('business logic compatibility', () => {
    it('should support type-based workflow rules', () => {
      const typeWorkflows: Record<TicketType, string[]> = {
        feature: ['planning', 'development', 'testing', 'release'],
        bug: ['investigation', 'fix', 'testing', 'verification'],
        task: ['planning', 'execution', 'review'],
      }

      expect(typeWorkflows.feature).toHaveLength(4)
      expect(typeWorkflows.bug).toHaveLength(4)
      expect(typeWorkflows.task).toHaveLength(3)
    })

    it('should support type-based reporting', () => {
      const tickets = [
        { id: '1', type: 'feature' as TicketType },
        { id: '2', type: 'bug' as TicketType },
        { id: '3', type: 'task' as TicketType },
        { id: '4', type: 'bug' as TicketType },
      ]

      const typeStats = tickets.reduce(
        (acc, ticket) => {
          acc[ticket.type] = (acc[ticket.type] || 0) + 1
          return acc
        },
        {} as Record<TicketType, number>
      )

      expect(typeStats.feature).toBe(1)
      expect(typeStats.bug).toBe(2)
      expect(typeStats.task).toBe(1)
    })
  })
})

describe('TicketPrivacy type', () => {
  describe('type definition', () => {
    it('should accept valid privacy values', () => {
      const privacyLevels: TicketPrivacy[] = ['local-only', 'team', 'public']

      expect(privacyLevels).toHaveLength(3)
      expect(privacyLevels).toContain('local-only')
      expect(privacyLevels).toContain('team')
      expect(privacyLevels).toContain('public')
    })

    it('should enforce type safety at compile time', () => {
      const localOnly: TicketPrivacy = 'local-only'
      const team: TicketPrivacy = 'team'
      const publicTicket: TicketPrivacy = 'public'

      expect(localOnly).toBe('local-only')
      expect(team).toBe('team')
      expect(publicTicket).toBe('public')
    })

    it('should support privacy hierarchy logic', () => {
      const privacyHierarchy: TicketPrivacy[] = ['local-only', 'team', 'public']

      const getPrivacyLevel = (privacy: TicketPrivacy): number => {
        return privacyHierarchy.indexOf(privacy)
      }

      expect(getPrivacyLevel('local-only')).toBe(0)
      expect(getPrivacyLevel('team')).toBe(1)
      expect(getPrivacyLevel('public')).toBe(2)
    })
  })

  describe('business logic compatibility', () => {
    it('should support privacy-based access control', () => {
      const tickets = [
        { id: '1', privacy: 'local-only' as TicketPrivacy },
        { id: '2', privacy: 'team' as TicketPrivacy },
        { id: '3', privacy: 'public' as TicketPrivacy },
      ]

      const publicTickets = tickets.filter(t => t.privacy === 'public')
      const teamTickets = tickets.filter(t => t.privacy !== 'local-only')

      expect(publicTickets).toHaveLength(1)
      expect(teamTickets).toHaveLength(2)
    })

    it('should support privacy upgrade/downgrade logic', () => {
      const privacyTransitions: Record<TicketPrivacy, TicketPrivacy[]> = {
        'local-only': ['team', 'public'],
        team: ['local-only', 'public'],
        public: ['local-only', 'team'],
      }

      expect(privacyTransitions['local-only']).toContain('team')
      expect(privacyTransitions['local-only']).toContain('public')
      expect(privacyTransitions['team']).toHaveLength(2)
      expect(privacyTransitions['public']).toHaveLength(2)
    })
  })
})

describe('TICKET_DEFAULTS', () => {
  describe('default values', () => {
    it('should provide sensible default values', () => {
      expect(TICKET_DEFAULTS.TYPE).toBe('task')
      expect(TICKET_DEFAULTS.PRIORITY).toBe('medium')
      expect(TICKET_DEFAULTS.PRIVACY).toBe('local-only')
      expect(TICKET_DEFAULTS.STATUS).toBe('pending')
    })

    it('should have immutable properties', () => {
      const defaults = TICKET_DEFAULTS

      // Should be readonly - TypeScript prevents these at compile time
      expect(defaults.TYPE).toBe('task')
      expect(defaults.PRIORITY).toBe('medium')
      expect(defaults.PRIVACY).toBe('local-only')
      expect(defaults.STATUS).toBe('pending')
    })

    it('should be compatible with type definitions', () => {
      const type: TicketType = TICKET_DEFAULTS.TYPE
      const priority: TicketPriority = TICKET_DEFAULTS.PRIORITY
      const privacy: TicketPrivacy = TICKET_DEFAULTS.PRIVACY
      const status: TicketStatus = TICKET_DEFAULTS.STATUS

      expect(type).toBe('task')
      expect(priority).toBe('medium')
      expect(privacy).toBe('local-only')
      expect(status).toBe('pending')
    })

    it('should support ticket creation with defaults', () => {
      const newTicket = {
        id: 'TKT-123',
        title: 'Test ticket',
        description: 'Test description',
        type: TICKET_DEFAULTS.TYPE,
        priority: TICKET_DEFAULTS.PRIORITY,
        privacy: TICKET_DEFAULTS.PRIVACY,
        status: TICKET_DEFAULTS.STATUS,
      }

      expect(newTicket.type).toBe('task')
      expect(newTicket.priority).toBe('medium')
      expect(newTicket.privacy).toBe('local-only')
      expect(newTicket.status).toBe('pending')
    })

    it('should handle default overrides', () => {
      const ticketWithOverrides = {
        ...TICKET_DEFAULTS,
        TYPE: 'feature' as TicketType,
        PRIORITY: 'high' as TicketPriority,
      }

      expect(ticketWithOverrides.TYPE).toBe('feature')
      expect(ticketWithOverrides.PRIORITY).toBe('high')
      expect(ticketWithOverrides.PRIVACY).toBe('local-only') // Should keep default
      expect(ticketWithOverrides.STATUS).toBe('pending') // Should keep default
    })
  })

  describe('const assertion', () => {
    it('should maintain const assertion properties', () => {
      // The 'as const' assertion should make the object deeply readonly
      const defaults = TICKET_DEFAULTS

      expect(typeof defaults).toBe('object')
      expect(Object.keys(defaults)).toEqual(['TYPE', 'PRIORITY', 'PRIVACY', 'STATUS'])
    })

    it('should support destructuring', () => {
      const { TYPE, PRIORITY, PRIVACY, STATUS } = TICKET_DEFAULTS

      expect(TYPE).toBe('task')
      expect(PRIORITY).toBe('medium')
      expect(PRIVACY).toBe('local-only')
      expect(STATUS).toBe('pending')
    })
  })
})

describe('isValidTicketStatus', () => {
  describe('valid status validation', () => {
    it('should return true for valid status values', () => {
      expect(isValidTicketStatus('pending')).toBe(true)
      expect(isValidTicketStatus('in_progress')).toBe(true)
      expect(isValidTicketStatus('completed')).toBe(true)
      expect(isValidTicketStatus('archived')).toBe(true)
    })

    it('should return false for invalid status values', () => {
      expect(isValidTicketStatus('invalid')).toBe(false)
      expect(isValidTicketStatus('done')).toBe(false)
      expect(isValidTicketStatus('open')).toBe(false)
      expect(isValidTicketStatus('closed')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(isValidTicketStatus('PENDING')).toBe(false)
      expect(isValidTicketStatus('Pending')).toBe(false)
      expect(isValidTicketStatus('In_Progress')).toBe(false)
      expect(isValidTicketStatus('COMPLETED')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidTicketStatus('')).toBe(false)
      expect(isValidTicketStatus(' pending ')).toBe(false)
      expect(isValidTicketStatus('pending ')).toBe(false)
      expect(isValidTicketStatus(' pending')).toBe(false)
    })

    it('should handle non-string inputs', () => {
      expect(isValidTicketStatus(null as any)).toBe(false)
      expect(isValidTicketStatus(undefined as any)).toBe(false)
      expect(isValidTicketStatus(123 as any)).toBe(false)
      expect(isValidTicketStatus({} as any)).toBe(false)
      expect(isValidTicketStatus([] as any)).toBe(false)
    })

    it('should provide type narrowing', () => {
      const userInput = 'pending'

      if (isValidTicketStatus(userInput)) {
        // TypeScript should narrow the type to TicketStatus
        const status: TicketStatus = userInput
        expect(status).toBe('pending')
      }
    })
  })

  describe('performance characteristics', () => {
    it('should validate efficiently', () => {
      const testValues = [
        'pending',
        'in_progress',
        'completed',
        'archived',
        'invalid',
        'done',
        'open',
        'closed',
        '',
        'PENDING',
        'Pending',
        'random',
      ]

      const start = Date.now()
      testValues.forEach(value => {
        isValidTicketStatus(value)
      })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(10) // Should complete very quickly
    })
  })
})

describe('isValidTicketPriority', () => {
  describe('valid priority validation', () => {
    it('should return true for valid priority values', () => {
      expect(isValidTicketPriority('high')).toBe(true)
      expect(isValidTicketPriority('medium')).toBe(true)
      expect(isValidTicketPriority('low')).toBe(true)
    })

    it('should return false for invalid priority values', () => {
      expect(isValidTicketPriority('critical')).toBe(false)
      expect(isValidTicketPriority('urgent')).toBe(false)
      expect(isValidTicketPriority('normal')).toBe(false)
      expect(isValidTicketPriority('1')).toBe(false)
      expect(isValidTicketPriority('2')).toBe(false)
      expect(isValidTicketPriority('3')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(isValidTicketPriority('HIGH')).toBe(false)
      expect(isValidTicketPriority('High')).toBe(false)
      expect(isValidTicketPriority('MEDIUM')).toBe(false)
      expect(isValidTicketPriority('Medium')).toBe(false)
      expect(isValidTicketPriority('LOW')).toBe(false)
      expect(isValidTicketPriority('Low')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidTicketPriority('')).toBe(false)
      expect(isValidTicketPriority(' high ')).toBe(false)
      expect(isValidTicketPriority('high ')).toBe(false)
      expect(isValidTicketPriority(' high')).toBe(false)
    })

    it('should handle non-string inputs', () => {
      expect(isValidTicketPriority(null as any)).toBe(false)
      expect(isValidTicketPriority(undefined as any)).toBe(false)
      expect(isValidTicketPriority(1 as any)).toBe(false)
      expect(isValidTicketPriority(true as any)).toBe(false)
    })

    it('should provide type narrowing', () => {
      const userInput = 'high'

      if (isValidTicketPriority(userInput)) {
        // TypeScript should narrow the type to TicketPriority
        const priority: TicketPriority = userInput
        expect(priority).toBe('high')
      }
    })
  })
})

describe('isValidTicketType', () => {
  describe('valid type validation', () => {
    it('should return true for valid type values', () => {
      expect(isValidTicketType('feature')).toBe(true)
      expect(isValidTicketType('bug')).toBe(true)
      expect(isValidTicketType('task')).toBe(true)
    })

    it('should return false for invalid type values', () => {
      expect(isValidTicketType('enhancement')).toBe(false)
      expect(isValidTicketType('defect')).toBe(false)
      expect(isValidTicketType('story')).toBe(false)
      expect(isValidTicketType('epic')).toBe(false)
      expect(isValidTicketType('improvement')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(isValidTicketType('FEATURE')).toBe(false)
      expect(isValidTicketType('Feature')).toBe(false)
      expect(isValidTicketType('BUG')).toBe(false)
      expect(isValidTicketType('Bug')).toBe(false)
      expect(isValidTicketType('TASK')).toBe(false)
      expect(isValidTicketType('Task')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidTicketType('')).toBe(false)
      expect(isValidTicketType(' feature ')).toBe(false)
      expect(isValidTicketType('feature ')).toBe(false)
      expect(isValidTicketType(' feature')).toBe(false)
    })

    it('should handle non-string inputs', () => {
      expect(isValidTicketType(null as any)).toBe(false)
      expect(isValidTicketType(undefined as any)).toBe(false)
      expect(isValidTicketType(0 as any)).toBe(false)
      expect(isValidTicketType(false as any)).toBe(false)
    })

    it('should provide type narrowing', () => {
      const userInput = 'bug'

      if (isValidTicketType(userInput)) {
        // TypeScript should narrow the type to TicketType
        const type: TicketType = userInput
        expect(type).toBe('bug')
      }
    })
  })
})

describe('isValidTicketPrivacy', () => {
  describe('valid privacy validation', () => {
    it('should return true for valid privacy values', () => {
      expect(isValidTicketPrivacy('local-only')).toBe(true)
      expect(isValidTicketPrivacy('team')).toBe(true)
      expect(isValidTicketPrivacy('public')).toBe(true)
    })

    it('should return false for invalid privacy values', () => {
      expect(isValidTicketPrivacy('private')).toBe(false)
      expect(isValidTicketPrivacy('internal')).toBe(false)
      expect(isValidTicketPrivacy('external')).toBe(false)
      expect(isValidTicketPrivacy('restricted')).toBe(false)
      expect(isValidTicketPrivacy('confidential')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(isValidTicketPrivacy('LOCAL-ONLY')).toBe(false)
      expect(isValidTicketPrivacy('Local-Only')).toBe(false)
      expect(isValidTicketPrivacy('SHAREABLE')).toBe(false)
      expect(isValidTicketPrivacy('Shareable')).toBe(false)
      expect(isValidTicketPrivacy('PUBLIC')).toBe(false)
      expect(isValidTicketPrivacy('Public')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidTicketPrivacy('')).toBe(false)
      expect(isValidTicketPrivacy(' public ')).toBe(false)
      expect(isValidTicketPrivacy('public ')).toBe(false)
      expect(isValidTicketPrivacy(' public')).toBe(false)
    })

    it('should handle non-string inputs', () => {
      expect(isValidTicketPrivacy(null as any)).toBe(false)
      expect(isValidTicketPrivacy(undefined as any)).toBe(false)
      expect(isValidTicketPrivacy(true as any)).toBe(false)
      expect(isValidTicketPrivacy({} as any)).toBe(false)
    })

    it('should provide type narrowing', () => {
      const userInput = 'team'

      if (isValidTicketPrivacy(userInput)) {
        // TypeScript should narrow the type to TicketPrivacy
        const privacy: TicketPrivacy = userInput
        expect(privacy).toBe('team')
      }
    })
  })
})

describe('TicketValidationError', () => {
  describe('error construction', () => {
    it('should create error with message only', () => {
      const error = new TicketValidationError('Validation failed')

      expect(error.message).toBe('Validation failed')
      expect(error.name).toBe('TicketValidationError')
      expect(error.field).toBeUndefined()
      expect(error instanceof Error).toBe(true)
      expect(error instanceof TicketValidationError).toBe(true)
    })

    it('should create error with message and field', () => {
      const error = new TicketValidationError('Invalid status', 'status')

      expect(error.message).toBe('Invalid status')
      expect(error.name).toBe('TicketValidationError')
      expect(error.field).toBe('status')
    })

    it('should create error with empty message', () => {
      const error = new TicketValidationError('')

      expect(error.message).toBe('')
      expect(error.name).toBe('TicketValidationError')
      expect(error.field).toBeUndefined()
    })

    it('should create error with undefined field explicitly', () => {
      const error = new TicketValidationError('Test error', undefined)

      expect(error.message).toBe('Test error')
      expect(error.field).toBeUndefined()
    })

    it('should create error with null field', () => {
      const error = new TicketValidationError('Test error', null as any)

      expect(error.message).toBe('Test error')
      expect(error.field).toBeNull()
    })
  })

  describe('error properties', () => {
    it('should have correct error name', () => {
      const error = new TicketValidationError('Test')

      expect(error.name).toBe('TicketValidationError')
      expect(error.constructor.name).toBe('TicketValidationError')
    })

    it('should maintain Error prototype chain', () => {
      const error = new TicketValidationError('Test')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof TicketValidationError).toBe(true)
      expect(Object.getPrototypeOf(error).constructor).toBe(TicketValidationError)
    })

    it('should have stack trace', () => {
      const error = new TicketValidationError('Test with stack')

      expect(error.stack).toBeDefined()
      expect(typeof error.stack).toBe('string')
      expect(error.stack).toContain('TicketValidationError')
    })

    it('should support error serialization', () => {
      const error = new TicketValidationError('Serialization test', 'testField')

      const serialized = {
        name: error.name,
        message: error.message,
        field: error.field,
      }

      expect(serialized.name).toBe('TicketValidationError')
      expect(serialized.message).toBe('Serialization test')
      expect(serialized.field).toBe('testField')
    })
  })

  describe('field property behavior', () => {
    it('should support different field names', () => {
      const fields = ['title', 'description', 'status', 'priority', 'type', 'privacy']

      fields.forEach(field => {
        const error = new TicketValidationError(`Invalid ${field}`, field)
        expect(error.field).toBe(field)
      })
    })

    it('should handle special characters in field names', () => {
      const specialField = 'field_with-special.characters'
      const error = new TicketValidationError('Test', specialField)

      expect(error.field).toBe(specialField)
    })

    it('should handle Unicode characters in field names', () => {
      const unicodeField = 'field_🎉_测试_αβγ'
      const error = new TicketValidationError('Test', unicodeField)

      expect(error.field).toBe(unicodeField)
    })

    it('should handle very long field names', () => {
      const longField = 'very_long_field_name_' + 'a'.repeat(100)
      const error = new TicketValidationError('Test', longField)

      expect(error.field).toBe(longField)
      expect(error.field?.length).toBeGreaterThan(100)
    })

    it('should handle empty string field', () => {
      const error = new TicketValidationError('Test', '')

      expect(error.field).toBe('')
      expect(error.field?.length).toBe(0)
    })
  })

  describe('integration with validation functions', () => {
    it('should work with status validation', () => {
      const validateStatus = (status: string): TicketStatus => {
        if (!isValidTicketStatus(status)) {
          throw new TicketValidationError(`Invalid status: ${status}`, 'status')
        }
        return status
      }

      expect(() => validateStatus('invalid')).toThrow(TicketValidationError)
      expect(() => validateStatus('invalid')).toThrow('Invalid status: invalid')

      try {
        validateStatus('invalid')
      } catch (error) {
        expect(error).toBeInstanceOf(TicketValidationError)
        expect((error as TicketValidationError).field).toBe('status')
      }

      expect(validateStatus('pending')).toBe('pending')
    })

    it('should work with priority validation', () => {
      const validatePriority = (priority: string): TicketPriority => {
        if (!isValidTicketPriority(priority)) {
          throw new TicketValidationError(`Invalid priority: ${priority}`, 'priority')
        }
        return priority
      }

      expect(() => validatePriority('critical')).toThrow(TicketValidationError)
      expect(validatePriority('high')).toBe('high')
    })

    it('should work with comprehensive validation', () => {
      const validateTicketData = (data: {
        status?: string
        priority?: string
        type?: string
        privacy?: string
      }) => {
        if (data.status && !isValidTicketStatus(data.status)) {
          throw new TicketValidationError(`Invalid status: ${data.status}`, 'status')
        }
        if (data.priority && !isValidTicketPriority(data.priority)) {
          throw new TicketValidationError(`Invalid priority: ${data.priority}`, 'priority')
        }
        if (data.type && !isValidTicketType(data.type)) {
          throw new TicketValidationError(`Invalid type: ${data.type}`, 'type')
        }
        if (data.privacy && !isValidTicketPrivacy(data.privacy)) {
          throw new TicketValidationError(`Invalid privacy: ${data.privacy}`, 'privacy')
        }
      }

      expect(() => validateTicketData({ status: 'invalid' })).toThrow(TicketValidationError)
      expect(() => validateTicketData({ priority: 'critical' })).toThrow(TicketValidationError)
      expect(() => validateTicketData({ type: 'story' })).toThrow(TicketValidationError)
      expect(() => validateTicketData({ privacy: 'private' })).toThrow(TicketValidationError)

      expect(() =>
        validateTicketData({
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'public',
        })
      ).not.toThrow()
    })
  })

  describe('error handling patterns', () => {
    it('should support error catching and field inspection', () => {
      const errors: Array<{ field?: string; message: string }> = []

      const collectError = (fn: () => void) => {
        try {
          fn()
        } catch (error) {
          if (error instanceof TicketValidationError) {
            errors.push({ field: error.field, message: error.message })
          }
        }
      }

      collectError(() => {
        throw new TicketValidationError('Error 1', 'field1')
      })
      collectError(() => {
        throw new TicketValidationError('Error 2', 'field2')
      })
      collectError(() => {
        throw new TicketValidationError('Error 3')
      })

      expect(errors).toHaveLength(3)
      expect(errors[0]!.field).toBe('field1')
      expect(errors[1]!.field).toBe('field2')
      expect(errors[2]!.field).toBeUndefined()
    })

    it('should support error aggregation', () => {
      const validationErrors: TicketValidationError[] = []

      try {
        throw new TicketValidationError('Invalid status', 'status')
      } catch (error) {
        if (error instanceof TicketValidationError) {
          validationErrors.push(error)
        }
      }

      try {
        throw new TicketValidationError('Invalid priority', 'priority')
      } catch (error) {
        if (error instanceof TicketValidationError) {
          validationErrors.push(error)
        }
      }

      expect(validationErrors).toHaveLength(2)
      expect(validationErrors[0]!.field).toBe('status')
      expect(validationErrors[1]!.field).toBe('priority')
    })
  })
})
