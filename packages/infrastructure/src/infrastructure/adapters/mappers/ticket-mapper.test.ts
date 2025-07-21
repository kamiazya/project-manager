import {
  createTicketPriority,
  createTicketStatus,
  createTicketType,
  Ticket,
  TicketDescription,
  TicketId,
  TicketTitle,
} from '@project-manager/domain'
import { beforeEach, describe, expect, it } from 'vitest'
import type { TicketJSON } from '../../types/persistence-types.ts'
import { toDomain, toDomainList, toPersistence, toPersistenceList } from './ticket-mapper.ts'

describe('TicketMapper', () => {
  let sampleTicket: Ticket
  let sampleTicketJSON: TicketJSON

  beforeEach(() => {
    // Create a sample domain ticket for testing
    sampleTicket = Ticket.create({
      title: 'Test Ticket',
      description: 'Test Description',
      status: createTicketStatus('pending'),
      priority: createTicketPriority('high'),
      type: createTicketType('feature'),
    })

    // Create a sample JSON representation
    sampleTicketJSON = {
      id: sampleTicket.id.value,
      title: 'Test Ticket',
      description: 'Test Description',
      status: createTicketStatus('pending'),
      priority: createTicketPriority('high'),
      type: createTicketType('feature'),
      createdAt: sampleTicket.createdAt.toISOString(),
      updatedAt: sampleTicket.updatedAt.toISOString(),
    }
  })

  describe('toPersistence', () => {
    it('should convert domain ticket to JSON format correctly', () => {
      // Act
      const result = toPersistence(sampleTicket)

      // Assert
      expect(result).toEqual({
        id: sampleTicket.id.value,
        title: sampleTicket.title.value,
        description: sampleTicket.description?.value,
        status: sampleTicket.status,
        priority: sampleTicket.priority,
        type: sampleTicket.type,
        createdAt: sampleTicket.createdAt.toISOString(),
        updatedAt: sampleTicket.updatedAt.toISOString(),
      })
    })

    it('should handle ticket without description', () => {
      // Arrange
      const ticketWithoutDescription = Ticket.create({
        title: 'No Description Ticket',
        status: createTicketStatus('pending'),
        priority: createTicketPriority('medium'),
        type: createTicketType('task'),
      })

      // Act
      const result = toPersistence(ticketWithoutDescription)

      // Assert
      expect(result.description).toBeUndefined()
      expect(result.title).toBe('No Description Ticket')
    })

    it('should preserve all ticket properties', () => {
      // Act
      const result = toPersistence(sampleTicket)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('priority')
      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
    })

    it('should convert dates to ISO string format', () => {
      // Act
      const result = toPersistence(sampleTicket)

      // Assert
      expect(typeof result.createdAt).toBe('string')
      expect(typeof result.updatedAt).toBe('string')
      expect(() => new Date(result.createdAt)).not.toThrow()
      expect(() => new Date(result.updatedAt)).not.toThrow()
    })
  })

  describe('toDomain', () => {
    it('should convert JSON to domain ticket correctly', () => {
      // Act
      const result = toDomain(sampleTicketJSON)

      // Assert
      expect(result).toBeInstanceOf(Ticket)
      expect(result.id.value).toBe(sampleTicketJSON.id)
      expect(result.title.value).toBe(sampleTicketJSON.title)
      expect(result.description?.value).toBe(sampleTicketJSON.description)
      expect(result.status).toBe(sampleTicketJSON.status)
      expect(result.priority).toBe(sampleTicketJSON.priority)
      expect(result.type).toBe(sampleTicketJSON.type)
    })

    it('should handle JSON without description', () => {
      // Arrange
      const jsonWithoutDescription: TicketJSON = {
        ...sampleTicketJSON,
        description: undefined,
      }

      // Act
      const result = toDomain(jsonWithoutDescription)

      // Assert
      expect(result).toBeInstanceOf(Ticket)
      expect(result.description).toBeUndefined()
    })

    it('should properly reconstruct dates', () => {
      // Act
      const result = toDomain(sampleTicketJSON)

      // Assert
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.createdAt.toISOString()).toBe(sampleTicketJSON.createdAt)
      expect(result.updatedAt.toISOString()).toBe(sampleTicketJSON.updatedAt)
    })

    describe('error cases', () => {
      it('should handle invalid date formats gracefully', () => {
        // Arrange
        const invalidJSON: TicketJSON = {
          ...sampleTicketJSON,
          createdAt: 'invalid-date',
          updatedAt: 'invalid-date',
        }

        // Act & Assert
        // Note: This tests the current behavior - the Ticket.reconstitute method should handle this
        expect(() => toDomain(invalidJSON)).not.toThrow()
      })

      it('should handle missing required fields', () => {
        // Arrange
        const incompleteJSON = {
          ...sampleTicketJSON,
          title: undefined as any,
        }

        // Act & Assert
        // This should throw or handle gracefully depending on Ticket.reconstitute implementation
        expect(() => toDomain(incompleteJSON)).toThrow()
      })
    })
  })

  describe('toDomainList', () => {
    it('should convert array of JSON to array of domain objects', () => {
      // Arrange
      const secondTicketJSON: TicketJSON = {
        ...sampleTicketJSON,
        id: 'ticket-2',
        title: 'Second Ticket',
      }
      const jsonList = [sampleTicketJSON, secondTicketJSON]

      // Act
      const result = toDomainList(jsonList)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Ticket)
      expect(result[1]).toBeInstanceOf(Ticket)
      expect(result[0].title.value).toBe('Test Ticket')
      expect(result[1].title.value).toBe('Second Ticket')
    })

    it('should handle empty array', () => {
      // Act
      const result = toDomainList([])

      // Assert
      expect(result).toEqual([])
    })

    it('should propagate conversion errors', () => {
      // Arrange
      const invalidJSON = { ...sampleTicketJSON, title: undefined as any }
      const jsonList = [sampleTicketJSON, invalidJSON]

      // Act & Assert
      expect(() => toDomainList(jsonList)).toThrow()
    })
  })

  describe('toPersistenceList', () => {
    it('should convert array of domain objects to array of JSON', () => {
      // Arrange
      const secondTicket = Ticket.create({
        title: 'Second Ticket',
        description: 'Second Description',
        status: createTicketStatus('in_progress'),
        priority: createTicketPriority('low'),
        type: createTicketType('bug'),
      })
      const ticketList = [sampleTicket, secondTicket]

      // Act
      const result = toPersistenceList(ticketList)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Test Ticket')
      expect(result[1].title).toBe('Second Ticket')
      expect(result[0].status).toBe(createTicketStatus('pending'))
      expect(result[1].status).toBe(createTicketStatus('in_progress'))
    })

    it('should handle empty array', () => {
      // Act
      const result = toPersistenceList([])

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('round-trip conversion', () => {
    it('should maintain data integrity through persistence and back', () => {
      // Act
      const persistenceFormat = toPersistence(sampleTicket)
      const reconstructedTicket = toDomain(persistenceFormat)

      // Assert
      expect(reconstructedTicket.id.value).toBe(sampleTicket.id.value)
      expect(reconstructedTicket.title.value).toBe(sampleTicket.title.value)
      expect(reconstructedTicket.description?.value).toBe(sampleTicket.description?.value)
      expect(reconstructedTicket.status).toBe(sampleTicket.status)
      expect(reconstructedTicket.priority).toBe(sampleTicket.priority)
      expect(reconstructedTicket.type).toBe(sampleTicket.type)
      expect(reconstructedTicket.createdAt.getTime()).toBe(sampleTicket.createdAt.getTime())
      expect(reconstructedTicket.updatedAt.getTime()).toBe(sampleTicket.updatedAt.getTime())
    })

    it('should handle round-trip for tickets without description', () => {
      // Arrange
      const ticketWithoutDescription = Ticket.create({
        title: 'No Description',
        status: createTicketStatus('completed'),
        priority: createTicketPriority('high'),
        type: createTicketType('task'),
      })

      // Act
      const persistenceFormat = toPersistence(ticketWithoutDescription)
      const reconstructedTicket = toDomain(persistenceFormat)

      // Assert
      expect(reconstructedTicket.description).toBeUndefined()
      expect(reconstructedTicket.title.value).toBe('No Description')
    })
  })

  describe('boundary value tests', () => {
    it('should handle very long titles and descriptions', () => {
      // Arrange
      const longTitle = 'A'.repeat(200) // Maximum title length
      const longDescription = 'B'.repeat(2000) // Long description

      const ticketWithLongContent = Ticket.create({
        title: longTitle,
        description: longDescription,
        status: createTicketStatus('pending'),
        priority: createTicketPriority('medium'),
        type: createTicketType('feature'),
      })

      // Act
      const persistenceFormat = toPersistence(ticketWithLongContent)
      const reconstructedTicket = toDomain(persistenceFormat)

      // Assert
      expect(reconstructedTicket.title.value).toBe(longTitle)
      expect(reconstructedTicket.description?.value).toBe(longDescription)
    })

    it('should handle all valid status, priority, and type combinations', () => {
      const statusValues = ['pending', 'in_progress', 'completed', 'archived']
      const priorityValues = ['high', 'medium', 'low']
      const typeValues = ['feature', 'bug', 'task']

      statusValues.forEach(status => {
        priorityValues.forEach(priority => {
          typeValues.forEach(type => {
            // Arrange
            const ticket = Ticket.create({
              title: `Ticket ${status}-${priority}-${type}`,
              status: createTicketStatus(status),
              priority: createTicketPriority(priority),
              type: createTicketType(type),
            })

            // Act
            const persistenceFormat = toPersistence(ticket)
            const reconstructedTicket = toDomain(persistenceFormat)

            // Assert
            expect(reconstructedTicket.status).toBe(createTicketStatus(status))
            expect(reconstructedTicket.priority).toBe(createTicketPriority(priority))
            expect(reconstructedTicket.type).toBe(createTicketType(type))
          })
        })
      })
    })
  })
})
