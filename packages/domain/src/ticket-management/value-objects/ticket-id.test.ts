// Test constants (previously from shared package)
const _VALIDATION = {
  TICKET_ID_MIN_LENGTH: 8,
  TICKET_ID_MAX_LENGTH: 8,
}

import { describe, expect, it } from 'vitest'
import { TicketId } from './ticket-id.ts'

describe('TicketId', () => {
  describe('create', () => {
    it('should create a TicketId with provided valid id', () => {
      const validId = 'a1b2c3d4' // 8 hex characters
      const ticketId = TicketId.create(validId)

      expect(ticketId.value).toBe(validId)
      expect(ticketId.value.length).toBe(8)
    })

    it('should throw error when id has invalid format', () => {
      const invalidId1 = 'abc' // Too short
      const invalidId2 = 'abcd12345' // Too long
      const invalidId3 = 'abcd123g' // Contains non-hex character
      const invalidId4 = 'ABCD1234' // Contains uppercase (not allowed)

      expect(() => TicketId.create(invalidId1)).toThrow(
        'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
      )
      expect(() => TicketId.create(invalidId2)).toThrow(
        'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
      )
      expect(() => TicketId.create(invalidId3)).toThrow(
        'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
      )
      expect(() => TicketId.create(invalidId4)).toThrow(
        'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
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
      const id = '12345678' // 8 hex characters
      const ticketId1 = TicketId.create(id)
      const ticketId2 = TicketId.create(id)

      expect(ticketId1.equals(ticketId2)).toBe(true)
    })

    it('should return false for different TicketIds', () => {
      const ticketId1 = TicketId.create('12345678')
      const ticketId2 = TicketId.create('87654321')

      expect(ticketId1.equals(ticketId2)).toBe(false)
    })

    it('should return false when comparing with null', () => {
      const validId = 'a1b2c3d4' // 8 hex characters
      const ticketId = TicketId.create(validId)

      expect(ticketId.equals(null as any)).toBe(false)
    })

    it('should return false when comparing with undefined', () => {
      const validId = 'a1b2c3d4' // 8 hex characters
      const ticketId = TicketId.create(validId)

      expect(ticketId.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the id value as string', () => {
      const id = 'abc12345' // 8 hex characters
      const ticketId = TicketId.create(id)

      expect(ticketId.toString()).toBe(id)
    })
  })
})
