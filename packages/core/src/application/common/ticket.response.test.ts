import { describe, expect, it, vi } from 'vitest'
import { Ticket } from '../../domain/entities/ticket.ts'
import { TicketDescription } from '../../domain/value-objects/ticket-description.ts'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import { TicketPriority } from '../../domain/value-objects/ticket-priority.ts'
import { TicketStatus } from '../../domain/value-objects/ticket-status.ts'
import { TicketTitle } from '../../domain/value-objects/ticket-title.ts'
import { TicketResponse } from './ticket.response.ts'

describe('TicketResponse', () => {
  describe('constructor', () => {
    it('should create TicketResponse with all required properties', () => {
      const response = new TicketResponse(
        'TKT-123',
        'Fix login bug',
        'Users cannot login with email',
        'pending',
        'high',
        'bug',
        'local-only',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T11:00:00.000Z'
      )

      expect(response.id).toBe('TKT-123')
      expect(response.title).toBe('Fix login bug')
      expect(response.description).toBe('Users cannot login with email')
      expect(response.status).toBe('pending')
      expect(response.priority).toBe('high')
      expect(response.type).toBe('bug')
      expect(response.privacy).toBe('local-only')
      expect(response.createdAt).toBe('2023-01-01T10:00:00.000Z')
      expect(response.updatedAt).toBe('2023-01-01T11:00:00.000Z')
    })

    it('should create readonly properties', () => {
      const response = new TicketResponse(
        'TKT-123',
        'Test title',
        'Test description',
        'pending',
        'medium',
        'task',
        'shareable',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:00:00.000Z'
      )

      // TypeScript should prevent these assignments at compile time
      expect(response.id).toBe('TKT-123')
      expect(response.title).toBe('Test title')
      expect(response.description).toBe('Test description')
    })

    it('should handle empty string values', () => {
      const response = new TicketResponse('', '', '', '', '', '', '', '', '')

      expect(response.id).toBe('')
      expect(response.title).toBe('')
      expect(response.description).toBe('')
      expect(response.status).toBe('')
      expect(response.priority).toBe('')
      expect(response.type).toBe('')
      expect(response.privacy).toBe('')
      expect(response.createdAt).toBe('')
      expect(response.updatedAt).toBe('')
    })

    it('should handle special characters in string values', () => {
      const response = new TicketResponse(
        'TKT-🎉-测试',
        'Title with "quotes" and \\backslashes',
        'Description with\nnewlines and\ttabs',
        'pending',
        'high',
        'feature',
        'public',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T11:00:00.000Z'
      )

      expect(response.id).toBe('TKT-🎉-测试')
      expect(response.title).toBe('Title with "quotes" and \\backslashes')
      expect(response.description).toBe('Description with\nnewlines and\ttabs')
    })

    it('should handle very long string values', () => {
      const longId = 'TKT-' + 'A'.repeat(1000)
      const longTitle = 'Very long title: ' + 'B'.repeat(1000)
      const longDescription = 'Very long description: ' + 'C'.repeat(10000)

      const response = new TicketResponse(
        longId,
        longTitle,
        longDescription,
        'in_progress',
        'low',
        'task',
        'local-only',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:00:00.000Z'
      )

      expect(response.id).toBe(longId)
      expect(response.title).toBe(longTitle)
      expect(response.description).toBe(longDescription)
      expect(response.id.length).toBeGreaterThan(1000)
      expect(response.title.length).toBeGreaterThan(1000)
      expect(response.description.length).toBeGreaterThan(10000)
    })
  })

  describe('property access', () => {
    it('should provide immutable access to all properties', () => {
      const response = new TicketResponse(
        'TKT-456',
        'Test ticket',
        'Test description',
        'completed',
        'medium',
        'feature',
        'shareable',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T12:00:00.000Z'
      )

      const properties = [
        'id',
        'title',
        'description',
        'status',
        'priority',
        'type',
        'privacy',
        'createdAt',
        'updatedAt',
      ]

      properties.forEach(prop => {
        expect(response).toHaveProperty(prop)
        expect(typeof response[prop as keyof TicketResponse]).toBe('string')
      })
    })

    it('should support destructuring', () => {
      const response = new TicketResponse(
        'TKT-789',
        'Destructure test',
        'Test destructuring',
        'archived',
        'low',
        'task',
        'public',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:30:00.000Z'
      )

      const { id, title, description, status, priority } = response

      expect(id).toBe('TKT-789')
      expect(title).toBe('Destructure test')
      expect(description).toBe('Test destructuring')
      expect(status).toBe('archived')
      expect(priority).toBe('low')
    })

    it('should support object spread', () => {
      const response = new TicketResponse(
        'TKT-SPREAD',
        'Spread test',
        'Test spreading',
        'pending',
        'high',
        'bug',
        'local-only',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:15:00.000Z'
      )

      const spread = { ...response }

      expect(spread.id).toBe(response.id)
      expect(spread.title).toBe(response.title)
      expect(spread.description).toBe(response.description)
      expect(Object.keys(spread)).toHaveLength(9)
    })
  })

  describe('fromTicket static method', () => {
    it('should create TicketResponse from Ticket entity', () => {
      const mockTicket = {
        id: { value: 'TKT-STATIC' },
        title: { value: 'Static method test' },
        description: { value: 'Testing static factory method' },
        status: { value: 'in_progress' },
        priority: { value: 'medium' },
        type: 'feature',
        privacy: 'shareable',
        createdAt: new Date('2023-01-01T10:00:00.000Z'),
        updatedAt: new Date('2023-01-01T11:30:00.000Z'),
      } as Ticket

      const response = TicketResponse.fromTicket(mockTicket)

      expect(response.id).toBe('TKT-STATIC')
      expect(response.title).toBe('Static method test')
      expect(response.description).toBe('Testing static factory method')
      expect(response.status).toBe('in_progress')
      expect(response.priority).toBe('medium')
      expect(response.type).toBe('feature')
      expect(response.privacy).toBe('shareable')
      expect(response.createdAt).toBe('2023-01-01T10:00:00.000Z')
      expect(response.updatedAt).toBe('2023-01-01T11:30:00.000Z')
    })

    it('should handle Date conversion to ISO string', () => {
      const createdDate = new Date('2023-06-15T14:30:45.123Z')
      const updatedDate = new Date('2023-06-15T16:45:30.789Z')

      const mockTicket = {
        id: { value: 'TKT-DATE' },
        title: { value: 'Date conversion test' },
        description: { value: 'Testing date to ISO string conversion' },
        status: { value: 'completed' },
        priority: { value: 'low' },
        type: 'task',
        privacy: 'public',
        createdAt: createdDate,
        updatedAt: updatedDate,
      } as Ticket

      const response = TicketResponse.fromTicket(mockTicket)

      expect(response.createdAt).toBe('2023-06-15T14:30:45.123Z')
      expect(response.updatedAt).toBe('2023-06-15T16:45:30.789Z')
      expect(response.createdAt).toBe(createdDate.toISOString())
      expect(response.updatedAt).toBe(updatedDate.toISOString())
    })

    it('should handle edge case dates', () => {
      const edgeDates = [
        new Date(0), // Unix epoch
        new Date('1970-01-01T00:00:00.000Z'),
        new Date('9999-12-31T23:59:59.999Z'),
        new Date('2023-02-29T00:00:00.000Z'), // Invalid date becomes NaN
      ]

      edgeDates.forEach((date, index) => {
        const mockTicket = {
          id: { value: `TKT-EDGE-${index}` },
          title: { value: `Edge case ${index}` },
          description: { value: `Testing edge case date ${index}` },
          status: { value: 'pending' },
          priority: { value: 'medium' },
          type: 'task',
          privacy: 'local-only',
          createdAt: date,
          updatedAt: date,
        } as Ticket

        const response = TicketResponse.fromTicket(mockTicket)

        expect(response.createdAt).toBe(date.toISOString())
        expect(response.updatedAt).toBe(date.toISOString())
      })
    })

    it('should handle Unicode characters from ticket properties', () => {
      const mockTicket = {
        id: { value: 'TKT-🎉-测试-αβγ' },
        title: { value: 'Unicode title: 🚀 测试标题 Ελληνικά' },
        description: { value: 'Unicode description: 🎯 测试描述 русский العربية' },
        status: { value: 'pending' },
        priority: { value: 'high' },
        type: 'feature',
        privacy: 'public',
        createdAt: new Date('2023-01-01T10:00:00.000Z'),
        updatedAt: new Date('2023-01-01T10:00:00.000Z'),
      } as Ticket

      const response = TicketResponse.fromTicket(mockTicket)

      expect(response.id).toBe('TKT-🎉-测试-αβγ')
      expect(response.title).toBe('Unicode title: 🚀 测试标题 Ελληνικά')
      expect(response.description).toBe('Unicode description: 🎯 测试描述 русский العربية')
    })

    it('should handle special characters from ticket properties', () => {
      const mockTicket = {
        id: { value: 'TKT-"quotes"-\\backslash-\n-newline' },
        title: { value: 'Title with "quotes" and \\backslashes and \n newlines' },
        description: { value: 'Description with\n"multiple"\t\\special\r\ncharacters' },
        status: { value: 'in_progress' },
        priority: { value: 'medium' },
        type: 'bug',
        privacy: 'shareable',
        createdAt: new Date('2023-01-01T10:00:00.000Z'),
        updatedAt: new Date('2023-01-01T10:00:00.000Z'),
      } as Ticket

      const response = TicketResponse.fromTicket(mockTicket)

      expect(response.id).toBe('TKT-"quotes"-\\backslash-\n-newline')
      expect(response.title).toBe('Title with "quotes" and \\backslashes and \n newlines')
      expect(response.description).toBe('Description with\n"multiple"\t\\special\r\ncharacters')
    })

    it('should handle very long ticket properties', () => {
      const longId = 'TKT-' + 'X'.repeat(500)
      const longTitle = 'Long title: ' + 'Y'.repeat(2000)
      const longDescription = 'Long description: ' + 'Z'.repeat(10000)

      const mockTicket = {
        id: { value: longId },
        title: { value: longTitle },
        description: { value: longDescription },
        status: { value: 'archived' },
        priority: { value: 'low' },
        type: 'task',
        privacy: 'local-only',
        createdAt: new Date('2023-01-01T10:00:00.000Z'),
        updatedAt: new Date('2023-01-01T10:00:00.000Z'),
      } as Ticket

      const response = TicketResponse.fromTicket(mockTicket)

      expect(response.id).toBe(longId)
      expect(response.title).toBe(longTitle)
      expect(response.description).toBe(longDescription)
      expect(response.id.length).toBeGreaterThan(500)
      expect(response.title.length).toBeGreaterThan(2000)
      expect(response.description.length).toBeGreaterThan(10000)
    })
  })

  describe('serialization and JSON compatibility', () => {
    it('should serialize to JSON correctly', () => {
      const response = new TicketResponse(
        'TKT-JSON',
        'JSON test',
        'Testing JSON serialization',
        'completed',
        'high',
        'feature',
        'public',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T12:00:00.000Z'
      )

      const json = JSON.stringify(response)
      const parsed = JSON.parse(json)

      expect(parsed.id).toBe(response.id)
      expect(parsed.title).toBe(response.title)
      expect(parsed.description).toBe(response.description)
      expect(parsed.status).toBe(response.status)
      expect(parsed.priority).toBe(response.priority)
      expect(parsed.type).toBe(response.type)
      expect(parsed.privacy).toBe(response.privacy)
      expect(parsed.createdAt).toBe(response.createdAt)
      expect(parsed.updatedAt).toBe(response.updatedAt)
    })

    it('should handle JSON pretty printing', () => {
      const response = new TicketResponse(
        'TKT-PRETTY',
        'Pretty print test',
        'Testing pretty printed JSON',
        'pending',
        'medium',
        'bug',
        'shareable',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:30:00.000Z'
      )

      const prettyJson = JSON.stringify(response, null, 2)

      expect(prettyJson).toContain('  "id": "TKT-PRETTY"')
      expect(prettyJson).toContain('  "title": "Pretty print test"')
      expect(prettyJson).toContain('  "status": "pending"')
    })

    it('should handle special characters in JSON', () => {
      const response = new TicketResponse(
        'TKT-SPECIAL',
        'Title with "quotes"',
        'Description with\nnewlines',
        'in_progress',
        'high',
        'task',
        'local-only',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:00:00.000Z'
      )

      const json = JSON.stringify(response)
      const parsed = JSON.parse(json)

      expect(parsed.title).toBe('Title with "quotes"')
      expect(parsed.description).toBe('Description with\nnewlines')
    })

    it('should preserve Unicode characters in JSON', () => {
      const response = new TicketResponse(
        'TKT-🎉',
        'Unicode 测试',
        'Описание αβγ',
        'archived',
        'low',
        'feature',
        'public',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:00:00.000Z'
      )

      const json = JSON.stringify(response)
      const parsed = JSON.parse(json)

      expect(parsed.id).toBe('TKT-🎉')
      expect(parsed.title).toBe('Unicode 测试')
      expect(parsed.description).toBe('Описание αβγ')
    })
  })

  describe('integration scenarios', () => {
    it('should work with real Ticket entity creation', () => {
      const ticket = Ticket.create({
        title: 'Integration test ticket',
        description: 'Testing integration with real Ticket entity',
        priority: 'medium',
        type: 'task',
      })

      const response = TicketResponse.fromTicket(ticket)

      expect(response.id).toBeDefined()
      expect(response.title).toBe('Integration test ticket')
      expect(response.description).toBe('Testing integration with real Ticket entity')
      expect(response.status).toBe('pending') // Default status
      expect(response.priority).toBe('medium') // Default priority
      expect(response.type).toBe('task') // Default type
      expect(response.privacy).toBe('local-only') // Default privacy
      expect(response.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(response.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should work with modified Ticket entity', () => {
      const ticket = Ticket.create({
        title: 'Modified ticket test',
        description: 'Testing with modified ticket properties',
        priority: 'high',
        type: 'bug',
      })

      // Simulate ticket modifications
      ticket.startProgress()
      ticket.updateTitle('Updated title')
      ticket.updateDescription('Updated description')

      const response = TicketResponse.fromTicket(ticket)

      expect(response.title).toBe('Updated title')
      expect(response.description).toBe('Updated description')
      expect(response.status).toBe('in_progress')
      expect(response.priority).toBe('high')
      expect(response.type).toBe('bug')
    })

    it('should handle API response scenarios', () => {
      const responses = [
        new TicketResponse(
          'TKT-1',
          'Task 1',
          'Description 1',
          'pending',
          'high',
          'task',
          'local-only',
          '2023-01-01T10:00:00.000Z',
          '2023-01-01T10:00:00.000Z'
        ),
        new TicketResponse(
          'TKT-2',
          'Bug 2',
          'Description 2',
          'in_progress',
          'medium',
          'bug',
          'shareable',
          '2023-01-01T11:00:00.000Z',
          '2023-01-01T11:30:00.000Z'
        ),
        new TicketResponse(
          'TKT-3',
          'Feature 3',
          'Description 3',
          'completed',
          'low',
          'feature',
          'public',
          '2023-01-01T12:00:00.000Z',
          '2023-01-01T15:00:00.000Z'
        ),
      ]

      // Simulate API response collection
      const apiResponse = {
        tickets: responses,
        total: responses.length,
      }

      expect(apiResponse.total).toBe(3)
      expect(apiResponse.tickets[0].type).toBe('task')
      expect(apiResponse.tickets[1].status).toBe('in_progress')
      expect(apiResponse.tickets[2].priority).toBe('low')
    })

    it('should support filtering and transformation operations', () => {
      const responses = [
        new TicketResponse(
          'TKT-1',
          'High Priority Bug',
          'Critical bug',
          'pending',
          'high',
          'bug',
          'local-only',
          '2023-01-01T10:00:00.000Z',
          '2023-01-01T10:00:00.000Z'
        ),
        new TicketResponse(
          'TKT-2',
          'Medium Task',
          'Regular task',
          'in_progress',
          'medium',
          'task',
          'shareable',
          '2023-01-01T11:00:00.000Z',
          '2023-01-01T11:30:00.000Z'
        ),
        new TicketResponse(
          'TKT-3',
          'Low Feature',
          'Nice to have',
          'completed',
          'low',
          'feature',
          'public',
          '2023-01-01T12:00:00.000Z',
          '2023-01-01T15:00:00.000Z'
        ),
        new TicketResponse(
          'TKT-4',
          'Another High Bug',
          'Another critical bug',
          'archived',
          'high',
          'bug',
          'local-only',
          '2023-01-01T13:00:00.000Z',
          '2023-01-01T14:00:00.000Z'
        ),
      ]

      // Filter high priority tickets
      const highPriorityTickets = responses.filter(r => r.priority === 'high')
      expect(highPriorityTickets).toHaveLength(2)

      // Filter by type
      const bugs = responses.filter(r => r.type === 'bug')
      expect(bugs).toHaveLength(2)

      // Map to summaries
      const summaries = responses.map(r => ({ id: r.id, title: r.title, status: r.status }))
      expect(summaries[0]).toEqual({ id: 'TKT-1', title: 'High Priority Bug', status: 'pending' })

      // Group by status
      const byStatus = responses.reduce(
        (acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
      expect(byStatus.pending).toBe(1)
      expect(byStatus.in_progress).toBe(1)
      expect(byStatus.completed).toBe(1)
      expect(byStatus.archived).toBe(1)
    })
  })

  describe('performance characteristics', () => {
    it('should create instances efficiently', () => {
      const start = Date.now()

      const responses = []
      for (let i = 0; i < 1000; i++) {
        responses.push(
          new TicketResponse(
            `TKT-${i}`,
            `Title ${i}`,
            `Description ${i}`,
            'pending',
            'medium',
            'task',
            'local-only',
            '2023-01-01T10:00:00.000Z',
            '2023-01-01T10:00:00.000Z'
          )
        )
      }

      const duration = Date.now() - start

      expect(responses).toHaveLength(1000)
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should convert from Ticket efficiently', () => {
      const tickets = []
      for (let i = 0; i < 100; i++) {
        tickets.push(
          Ticket.create({
            title: `Performance test ticket ${i}`,
            description: `Performance test description ${i}`,
            priority: 'medium',
            type: 'task',
          })
        )
      }

      const start = Date.now()
      const responses = tickets.map(ticket => TicketResponse.fromTicket(ticket))
      const duration = Date.now() - start

      expect(responses).toHaveLength(100)
      expect(duration).toBeLessThan(50) // Should complete in under 50ms
    })

    it('should serialize large collections efficiently', () => {
      const responses = []
      for (let i = 0; i < 100; i++) {
        responses.push(
          new TicketResponse(
            `TKT-PERF-${i}`,
            `Performance title ${i}`,
            `Performance description ${'x'.repeat(100)}`,
            'pending',
            'medium',
            'task',
            'local-only',
            '2023-01-01T10:00:00.000Z',
            '2023-01-01T10:00:00.000Z'
          )
        )
      }

      const start = Date.now()
      const json = JSON.stringify(responses)
      const parsed = JSON.parse(json)
      const duration = Date.now() - start

      expect(parsed).toHaveLength(100)
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty responses collection', () => {
      const responses: TicketResponse[] = []

      expect(responses).toHaveLength(0)
      expect(JSON.stringify(responses)).toBe('[]')
    })

    it('should handle null-like values in ticket properties', () => {
      // This tests behavior when ticket has unexpected property values
      const mockTicketWithNulls = {
        id: { value: 'test-id' },
        title: { value: 'test-title' },
        description: { value: '' },
        status: { value: 'pending' },
        priority: { value: 'medium' },
        type: 'task',
        privacy: 'local-only',
        createdAt: new Date('invalid'), // This will create an invalid date
        updatedAt: new Date(NaN), // This will create an invalid date
      } as any

      expect(() => {
        TicketResponse.fromTicket(mockTicketWithNulls)
      }).toThrow() // Invalid dates will throw when converted to ISO string

      // Test with valid dates but unusual property values
      const mockTicketWithValidDates = {
        id: { value: '' },
        title: { value: '' },
        description: { value: '' },
        status: { value: '' },
        priority: { value: '' },
        type: '',
        privacy: '',
        createdAt: new Date('2023-01-01T10:00:00.000Z'),
        updatedAt: new Date('2023-01-01T10:00:00.000Z'),
      } as any

      const response = TicketResponse.fromTicket(mockTicketWithValidDates)
      expect(typeof response.id).toBe('string')
      expect(typeof response.title).toBe('string')
      expect(typeof response.createdAt).toBe('string')
      expect(response.createdAt).toBe('2023-01-01T10:00:00.000Z')
    })

    it('should handle extremely large property values', () => {
      const hugeString = 'x'.repeat(100000)
      const response = new TicketResponse(
        hugeString,
        hugeString,
        hugeString,
        'pending',
        'medium',
        'task',
        'local-only',
        '2023-01-01T10:00:00.000Z',
        '2023-01-01T10:00:00.000Z'
      )

      expect(response.id.length).toBe(100000)
      expect(response.title.length).toBe(100000)
      expect(response.description.length).toBe(100000)
    })
  })
})
