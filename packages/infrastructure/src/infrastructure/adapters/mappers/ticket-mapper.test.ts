import { PersistenceError } from '@project-manager/application'
import {
  createTicketPriority,
  createTicketStatus,
  createTicketType,
  Ticket,
  TicketDescription,
  TicketId,
  TicketTitle,
} from '@project-manager/domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TicketJSON } from '../../types/persistence-types.ts'
import {
  InfrastructureError,
  toDomain,
  toDomainList,
  toPersistence,
  toPersistenceList,
} from './ticket-mapper.ts'

describe('TicketMapper', () => {
  let sampleTicket: Ticket
  let sampleTicketJSON: TicketJSON

  beforeEach(() => {
    // Create a sample domain ticket for testing
    const ticketId = TicketId.create('a1b2c3d4')
    sampleTicket = Ticket.create(ticketId, {
      title: 'Test Ticket',
      description: 'Test Description',
      status: 'pending',
      priority: 'high',
      type: 'feature',
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
      const ticketId = TicketId.create('1234abcd')
      const ticketWithoutDescription = Ticket.create(ticketId, {
        title: 'No Description Ticket',
        status: 'pending',
        priority: 'medium',
        type: 'task',
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

    describe('error handling', () => {
      it('should throw PersistenceError for null/undefined data', () => {
        expect(() => toDomain(null as any)).toThrow(PersistenceError)
        expect(() => toDomain(undefined as any)).toThrow(PersistenceError)
        expect(() => toDomain('not-an-object' as any)).toThrow(PersistenceError)
      })

      it('should throw PersistenceError for missing required fields', () => {
        const invalidData = {
          ...sampleTicketJSON,
          id: undefined,
        }

        expect(() => toDomain(invalidData as any)).toThrow(PersistenceError)
        expect(() => toDomain(invalidData as any)).toThrow('Missing or invalid required field: id')
      })

      it('should throw PersistenceError for invalid field types', () => {
        const invalidData = {
          ...sampleTicketJSON,
          title: 123, // Should be string
        }

        expect(() => toDomain(invalidData as any)).toThrow(PersistenceError)
        expect(() => toDomain(invalidData as any)).toThrow(
          'Missing or invalid required field: title'
        )
      })

      it('should throw PersistenceError for invalid description type', () => {
        const invalidData = {
          ...sampleTicketJSON,
          description: 123, // Should be string or undefined
        }

        expect(() => toDomain(invalidData as any)).toThrow(PersistenceError)
        expect(() => toDomain(invalidData as any)).toThrow(
          'Description field must be a string when present'
        )
      })

      it('should throw PersistenceError for invalid date formats', () => {
        const invalidData = {
          ...sampleTicketJSON,
          createdAt: 'not-a-date',
        }

        expect(() => toDomain(invalidData as any)).toThrow(PersistenceError)
        expect(() => toDomain(invalidData as any)).toThrow(
          'Invalid date format in field: createdAt'
        )
      })

      it('should wrap domain validation errors in InfrastructureError', () => {
        const invalidData = {
          ...sampleTicketJSON,
          status: 'INVALID_STATUS', // Will fail domain validation
        }

        expect(() => toDomain(invalidData as any)).toThrow(InfrastructureError)
        expect(() => toDomain(invalidData as any)).toThrow(
          'Failed to reconstitute ticket from persistence data'
        )
      })

      it('should include contextual information in infrastructure errors', () => {
        const invalidData = {
          ...sampleTicketJSON,
          priority: 'INVALID_PRIORITY',
        }

        try {
          toDomain(invalidData as any)
          expect.fail('Expected error to be thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(InfrastructureError)
          const infraError = error as InfrastructureError
          expect(infraError.context?.ticketId).toBe(sampleTicketJSON.id)
          expect(infraError.context?.operation).toBe('toDomain')
          expect(infraError.context?.persistenceData).toBeDefined()
        }
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

    describe('error handling', () => {
      let consoleWarnSpy: any

      beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      })

      afterEach(() => {
        consoleWarnSpy.mockRestore()
      })

      it('should handle partial failures gracefully by skipping invalid tickets', () => {
        // Arrange
        const validTicket = sampleTicketJSON
        const invalidTicket = { ...sampleTicketJSON, id: undefined } as any
        const anotherValidTicket = {
          ...sampleTicketJSON,
          id: 'valid-id-2',
          title: 'Valid Ticket 2',
        }

        const jsonList = [validTicket, invalidTicket, anotherValidTicket]

        // Act
        const result = toDomainList(jsonList)

        // Assert
        expect(result).toHaveLength(2) // Should skip the invalid one
        expect(result[0].title.value).toBe('Test Ticket')
        expect(result[1].title.value).toBe('Valid Ticket 2')

        // Should log warning for invalid ticket
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Skipping invalid ticket during bulk reconstitution'),
          expect.objectContaining({ ticketId: 'unknown' })
        )
      })

      it('should throw InfrastructureError when all tickets are invalid', () => {
        // Arrange
        const invalidTicket1 = { ...sampleTicketJSON, id: undefined } as any
        const invalidTicket2 = { ...sampleTicketJSON, title: undefined } as any
        const jsonList = [invalidTicket1, invalidTicket2]

        // Act & Assert
        expect(() => toDomainList(jsonList)).toThrow(InfrastructureError)
        expect(() => toDomainList(jsonList)).toThrow(
          'All 2 tickets failed validation during reconstitution'
        )
      })

      it('should log summary when there are partial failures', () => {
        // Arrange
        const validTicket = sampleTicketJSON
        const invalidTicket = { ...sampleTicketJSON, status: 'INVALID_STATUS' } as any
        const jsonList = [validTicket, invalidTicket]

        // Act
        const result = toDomainList(jsonList)

        // Assert
        expect(result).toHaveLength(1) // One valid ticket

        // Should log both individual failure and summary
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Skipping invalid ticket during bulk reconstitution'),
          expect.any(Object)
        )
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Partial failure during bulk ticket reconstitution: 1/2 tickets failed'
          ),
          expect.objectContaining({
            successCount: 1,
            errorCount: 1,
            totalCount: 2,
          })
        )
      })

      it('should handle empty list without errors', () => {
        // Act
        const result = toDomainList([])

        // Assert
        expect(result).toEqual([])
        expect(consoleWarnSpy).not.toHaveBeenCalled()
      })

      it('should preserve ticket IDs in error context when available', () => {
        // Arrange
        const invalidTicket = {
          ...sampleTicketJSON,
          id: 'error-ticket-id',
          title: undefined,
        } as any
        const jsonList = [invalidTicket]

        // Act & Assert
        expect(() => toDomainList(jsonList)).toThrow(InfrastructureError)

        // Should log with correct ticket ID
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Skipping invalid ticket during bulk reconstitution'),
          expect.objectContaining({ ticketId: 'error-ticket-id' })
        )
      })
    })
  })

  describe('toPersistenceList', () => {
    it('should convert array of domain objects to array of JSON', () => {
      // Arrange
      const secondTicketId = TicketId.create('b2c3d4e5')
      const secondTicket = Ticket.create(secondTicketId, {
        title: 'Second Ticket',
        description: 'Second Description',
        status: 'in_progress',
        priority: 'low',
        type: 'bug',
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
      const ticketId = TicketId.create('12345678')
      const ticketWithoutDescription = Ticket.create(ticketId, {
        title: 'No Description',
        status: 'completed',
        priority: 'high',
        type: 'task',
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
      const ticketId = TicketId.create('abcdabcd')

      const ticketWithLongContent = Ticket.create(ticketId, {
        title: longTitle,
        description: longDescription,
        status: 'pending',
        priority: 'medium',
        type: 'feature',
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

      statusValues.forEach((status, si) => {
        priorityValues.forEach((priority, pi) => {
          typeValues.forEach((type, ti) => {
            // Arrange - Generate valid 8-char hex ID (pad with zeros)
            const hexId = `${si.toString(16)}${pi.toString(16)}${ti.toString(16)}abcd0`
              .padStart(8, '0')
              .slice(0, 8)
            const ticketId = TicketId.create(hexId)
            const ticket = Ticket.create(ticketId, {
              title: `Ticket ${status}-${priority}-${type}`,
              status: status,
              priority: priority,
              type: type,
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
