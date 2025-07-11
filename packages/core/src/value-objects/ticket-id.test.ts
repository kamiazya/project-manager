import { VALIDATION } from '@project-manager/shared'
import { describe, expect, it } from 'vitest'
import { TicketId } from './ticket-id.js'

describe('TicketId', () => {
  describe('create', () => {
    it('should create a new TicketId with generated value when no id provided', () => {
      const ticketId = TicketId.create()

      expect(ticketId).toBeDefined()
      expect(ticketId.value).toBeDefined()
      expect(ticketId.value.length).toBeGreaterThanOrEqual(VALIDATION.TICKET_ID_MIN_LENGTH)
      expect(ticketId.value.length).toBeLessThanOrEqual(VALIDATION.TICKET_ID_MAX_LENGTH)
    })

    it('should create a TicketId with provided valid id', () => {
      const validId = 'valid-ticket-id-123'
      const ticketId = TicketId.create(validId)

      expect(ticketId.value).toBe(validId)
    })

    it('should throw error when id is too short', () => {
      const shortId = 'abc'

      expect(() => TicketId.create(shortId)).toThrow(
        `Ticket ID must be at least ${VALIDATION.TICKET_ID_MIN_LENGTH} characters long`
      )
    })

    it('should throw error when id is too long', () => {
      const longId = 'a'.repeat(VALIDATION.TICKET_ID_MAX_LENGTH + 1)

      expect(() => TicketId.create(longId)).toThrow(
        `Ticket ID cannot exceed ${VALIDATION.TICKET_ID_MAX_LENGTH} characters`
      )
    })
  })

  describe('fromValue', () => {
    it('should reconstitute a TicketId without validation', () => {
      const shortId = 'abc' // Would fail validation in create()
      const ticketId = TicketId.fromValue(shortId)

      expect(ticketId.value).toBe(shortId)
    })
  })

  describe('equals', () => {
    it('should return true for equal TicketIds', () => {
      const id = 'same-ticket-id-123'
      const ticketId1 = TicketId.create(id)
      const ticketId2 = TicketId.create(id)

      expect(ticketId1.equals(ticketId2)).toBe(true)
    })

    it('should return false for different TicketIds', () => {
      const ticketId1 = TicketId.create('ticket-id-123')
      const ticketId2 = TicketId.create('ticket-id-456')

      expect(ticketId1.equals(ticketId2)).toBe(false)
    })

    it('should return false when comparing with null', () => {
      const ticketId = TicketId.create()

      expect(ticketId.equals(null as any)).toBe(false)
    })

    it('should return false when comparing with undefined', () => {
      const ticketId = TicketId.create()

      expect(ticketId.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the id value as string', () => {
      const id = 'ticket-id-123'
      const ticketId = TicketId.create(id)

      expect(ticketId.toString()).toBe(id)
    })
  })
})
