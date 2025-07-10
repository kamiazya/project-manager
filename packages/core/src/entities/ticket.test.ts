import { TicketValidationError } from '@project-manager/shared'
import { describe, expect, it } from 'vitest'
import { Ticket } from './ticket.js'

describe('Ticket', () => {
  describe('constructor', () => {
    it('should create a ticket with required fields', () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high' as const,
      }

      const ticket = new Ticket(ticketData)

      expect(ticket.title).toBe('Test Ticket')
      expect(ticket.description).toBe('Test Description')
      expect(ticket.priority).toBe('high')
      expect(ticket.status).toBe('pending')
      expect(ticket.type).toBe('task')
      expect(ticket.privacy).toBe('local-only')
      expect(ticket.id).toBeTruthy()
      expect(ticket.createdAt).toBeInstanceOf(Date)
      expect(ticket.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a ticket with custom status and type', () => {
      const ticketData = {
        title: 'Feature Request',
        description: 'Add new feature',
        priority: 'medium' as const,
        status: 'in_progress' as const,
        type: 'feature' as const,
        privacy: 'shareable' as const,
      }

      const ticket = new Ticket(ticketData)

      expect(ticket.status).toBe('in_progress')
      expect(ticket.type).toBe('feature')
      expect(ticket.privacy).toBe('shareable')
    })

    it('should generate unique IDs for different tickets', () => {
      const data = {
        title: 'Test',
        description: 'Test',
        priority: 'low' as const,
      }

      const ticket1 = new Ticket(data)
      const ticket2 = new Ticket(data)

      expect(ticket1.id).not.toBe(ticket2.id)
    })

    it('should throw validation error for empty title', () => {
      expect(() => {
        new Ticket({
          title: '',
          description: 'Test',
          priority: 'low' as const,
        })
      }).toThrow(TicketValidationError)
    })

    it('should throw validation error for whitespace-only title', () => {
      expect(() => {
        new Ticket({
          title: '   ',
          description: 'Test',
          priority: 'low' as const,
        })
      }).toThrow(TicketValidationError)
    })

    it('should throw validation error for title exceeding max length', () => {
      const longTitle = 'a'.repeat(201) // Assuming 200 is max length

      expect(() => {
        new Ticket({
          title: longTitle,
          description: 'Test',
          priority: 'low' as const,
        })
      }).toThrow(TicketValidationError)
    })

    it('should throw validation error for empty description', () => {
      expect(() => {
        new Ticket({
          title: 'Test',
          description: '',
          priority: 'low' as const,
        })
      }).toThrow(TicketValidationError)
    })

    it('should throw validation error for description exceeding max length', () => {
      const longDescription = 'a'.repeat(2001) // Assuming 2000 is max length

      expect(() => {
        new Ticket({
          title: 'Test',
          description: longDescription,
          priority: 'low' as const,
        })
      }).toThrow(TicketValidationError)
    })

    it('should throw validation error for whitespace-only description', () => {
      expect(() => {
        new Ticket({
          title: 'Test',
          description: '   \n\t  ',
          priority: 'low' as const,
        })
      }).toThrow(TicketValidationError)
    })

    it('should handle Unicode characters in title and description', () => {
      const ticket = new Ticket({
        title: '📋 Unicode タイトル with émojis',
        description: '🚀 Unicode description with émojis and 中文',
        priority: 'high' as const,
      })

      expect(ticket.title).toBe('📋 Unicode タイトル with émojis')
      expect(ticket.description).toBe('🚀 Unicode description with émojis and 中文')
    })

    it('should trim whitespace from title and description', () => {
      const ticket = new Ticket({
        title: '  Test Title  ',
        description: '  Test Description  ',
        priority: 'medium' as const,
      })

      expect(ticket.title).toBe('Test Title')
      expect(ticket.description).toBe('Test Description')
    })

    it('should handle boundary values for title length', () => {
      const maxTitle = 'a'.repeat(200) // Exactly max length

      const ticket = new Ticket({
        title: maxTitle,
        description: 'Test',
        priority: 'low' as const,
      })

      expect(ticket.title).toBe(maxTitle)
    })

    it('should handle boundary values for description length', () => {
      const maxDescription = 'a'.repeat(2000) // Exactly max length (2000 chars)

      const ticket = new Ticket({
        title: 'Test',
        description: maxDescription,
        priority: 'low' as const,
      })

      expect(ticket.description).toBe(maxDescription)
    })

    it('should accept predefined ID', () => {
      const customId = 'custom123'
      const ticket = new Ticket(
        {
          title: 'Test',
          description: 'Test',
          priority: 'low' as const,
        },
        customId
      )

      expect(ticket.id).toBe(customId)
    })
  })

  describe('updateStatus', () => {
    it('should update ticket status and updatedAt timestamp', () => {
      const ticket = new Ticket({
        title: 'Test',
        description: 'Test',
        priority: 'low' as const,
      })

      const originalUpdatedAt = ticket.updatedAt

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        ticket.updateStatus('completed')

        expect(ticket.status).toBe('completed')
        expect(ticket.updatedAt).not.toBe(originalUpdatedAt)
        expect(ticket.updatedAt > originalUpdatedAt).toBe(true)
      }, 1)
    })
  })

  describe('updatePriority', () => {
    it('should update ticket priority and updatedAt timestamp', () => {
      const ticket = new Ticket({
        title: 'Test',
        description: 'Test',
        priority: 'low' as const,
      })

      const originalUpdatedAt = ticket.updatedAt

      setTimeout(() => {
        ticket.updatePriority('high')

        expect(ticket.priority).toBe('high')
        expect(ticket.updatedAt).not.toBe(originalUpdatedAt)
        expect(ticket.updatedAt > originalUpdatedAt).toBe(true)
      }, 1)
    })
  })

  describe('toJSON', () => {
    it('should serialize ticket to JSON', () => {
      const ticket = new Ticket({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high' as const,
      })

      const json = ticket.toJSON()

      expect(json).toEqual({
        id: ticket.id,
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        type: 'task',
        privacy: 'local-only',
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      })
    })
  })

  describe('fromJSON', () => {
    it('should deserialize ticket from JSON', () => {
      const json = {
        id: 'test-id',
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'completed' as const,
        priority: 'high' as const,
        type: 'feature' as const,
        privacy: 'shareable' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T01:00:00.000Z',
      }

      const ticket = Ticket.fromJSON(json)

      expect(ticket.id).toBe('test-id')
      expect(ticket.title).toBe('Test Ticket')
      expect(ticket.description).toBe('Test Description')
      expect(ticket.status).toBe('completed')
      expect(ticket.priority).toBe('high')
      expect(ticket.type).toBe('feature')
      expect(ticket.privacy).toBe('shareable')
      expect(ticket.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'))
      expect(ticket.updatedAt).toEqual(new Date('2024-01-01T01:00:00.000Z'))
    })

    it('should handle invalid date strings in JSON', () => {
      const json = {
        id: 'test-id',
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'pending' as const,
        priority: 'medium' as const,
        type: 'task' as const,
        privacy: 'local-only' as const,
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
      }

      expect(() => Ticket.fromJSON(json)).toThrow()
    })

    it('should deserialize minimal valid JSON', () => {
      const json = {
        id: 'minimal-id',
        title: 'Minimal Ticket',
        description: 'Minimal Description',
        status: 'pending' as const,
        priority: 'low' as const,
        type: 'task' as const,
        privacy: 'local-only' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const ticket = Ticket.fromJSON(json)

      expect(ticket.id).toBe('minimal-id')
      expect(ticket.title).toBe('Minimal Ticket')
      expect(ticket.status).toBe('pending')
      expect(ticket.type).toBe('task')
      expect(ticket.privacy).toBe('local-only')
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent status updates', () => {
      const ticket = new Ticket({
        title: 'Concurrent Test',
        description: 'Test concurrent updates',
        priority: 'medium' as const,
      })

      const originalUpdatedAt = ticket.updatedAt

      // Simulate rapid updates
      ticket.updateStatus('in_progress')
      ticket.updateStatus('completed')
      ticket.updatePriority('high')

      expect(ticket.status).toBe('completed')
      expect(ticket.priority).toBe('high')
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should maintain immutability of creation date', () => {
      const ticket = new Ticket({
        title: 'Immutable Test',
        description: 'Test date immutability',
        priority: 'low' as const,
      })

      const originalCreatedAt = ticket.createdAt

      ticket.updateStatus('completed')
      ticket.updatePriority('high')

      expect(ticket.createdAt).toBe(originalCreatedAt)
      expect(ticket.createdAt).toEqual(originalCreatedAt)
    })

    it('should handle same status/priority updates', () => {
      const ticket = new Ticket({
        title: 'Same Update Test',
        description: 'Test same value updates',
        priority: 'medium' as const,
        status: 'in_progress' as const,
      })

      const originalUpdatedAt = ticket.updatedAt

      // Update to the same values
      ticket.updateStatus('in_progress')
      ticket.updatePriority('medium')

      // UpdatedAt should still change even for same values
      expect(ticket.status).toBe('in_progress')
      expect(ticket.priority).toBe('medium')
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })
})
