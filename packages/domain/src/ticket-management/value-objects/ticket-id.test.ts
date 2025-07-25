import { describe, expect, it } from 'vitest'
import {
  INVALID_ID_CONTAINS_INVALID_CHARS,
  INVALID_ID_CONTAINS_LOWERCASE,
  INVALID_ID_CONTAINS_SPECIAL,
  INVALID_ID_TOO_LONG,
  INVALID_ID_TOO_SHORT,
  VALID_ULID_1,
  VALID_ULID_2,
} from '../test-helpers.ts'
import { TicketId } from './ticket-id.ts'

describe('TicketId', () => {
  describe('create', () => {
    it('should create a TicketId with provided valid id', () => {
      const validId = VALID_ULID_1
      const ticketId = TicketId.create(validId)

      expect(ticketId.value).toBe(validId)
      expect(ticketId.value.length).toBe(26)
    })

    it('should throw error when id has invalid format', () => {
      const testCases = [
        { id: INVALID_ID_TOO_SHORT, desc: 'Too short' },
        { id: INVALID_ID_TOO_LONG, desc: 'Too long' },
        { id: INVALID_ID_CONTAINS_LOWERCASE, desc: 'Contains lowercase' },
        { id: INVALID_ID_CONTAINS_INVALID_CHARS, desc: 'Contains invalid chars' },
        { id: INVALID_ID_CONTAINS_SPECIAL, desc: 'Contains special chars' },
      ]

      testCases.forEach(({ id, desc }) => {
        expect(() => TicketId.create(id)).toThrow(
          'Ticket ID must be a valid ULID (26 characters, Base32 encoded)'
        )
      })
    })
  })

  describe('fromValue', () => {
    it('should reconstitute a TicketId without validation', () => {
      const shortId = INVALID_ID_TOO_SHORT // Would fail validation in create()
      const ticketId = TicketId.fromValue(shortId)

      expect(ticketId.value).toBe(shortId)
    })
  })

  describe('equals', () => {
    it('should return true for equal TicketIds', () => {
      const id = VALID_ULID_1
      const ticketId1 = TicketId.create(id)
      const ticketId2 = TicketId.create(id)

      expect(ticketId1.equals(ticketId2)).toBe(true)
    })

    it('should return false for different TicketIds', () => {
      const ticketId1 = TicketId.create(VALID_ULID_1)
      const ticketId2 = TicketId.create(VALID_ULID_2)

      expect(ticketId1.equals(ticketId2)).toBe(false)
    })

    it('should return false when comparing with null', () => {
      const validId = VALID_ULID_1
      const ticketId = TicketId.create(validId)

      expect(ticketId.equals(null as any)).toBe(false)
    })

    it('should return false when comparing with undefined', () => {
      const validId = VALID_ULID_1
      const ticketId = TicketId.create(validId)

      expect(ticketId.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the id value as string', () => {
      const id = VALID_ULID_1
      const ticketId = TicketId.create(id)

      expect(ticketId.toString()).toBe(id)
    })
  })
})
