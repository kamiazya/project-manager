import { describe, expect, it } from 'vitest'
import { isValidTicketPriority, isValidTicketStatus } from './types.js'

describe('Type Validation Functions', () => {
  describe('isValidTicketStatus', () => {
    it('should return true for valid ticket statuses', () => {
      expect(isValidTicketStatus('pending')).toBe(true)
      expect(isValidTicketStatus('in_progress')).toBe(true)
      expect(isValidTicketStatus('completed')).toBe(true)
      expect(isValidTicketStatus('archived')).toBe(true)
    })

    it('should return false for invalid ticket statuses', () => {
      expect(isValidTicketStatus('invalid')).toBe(false)
      expect(isValidTicketStatus('draft')).toBe(false)
      expect(isValidTicketStatus('closed')).toBe(false)
      expect(isValidTicketStatus('')).toBe(false)
      expect(isValidTicketStatus('PENDING')).toBe(false) // case sensitive
    })

    it('should handle edge cases', () => {
      expect(isValidTicketStatus(' pending ')).toBe(false) // whitespace
      expect(isValidTicketStatus('pending ')).toBe(false) // trailing space
      expect(isValidTicketStatus(' pending')).toBe(false) // leading space
    })
  })

  describe('isValidTicketPriority', () => {
    it('should return true for valid ticket priorities', () => {
      expect(isValidTicketPriority('high')).toBe(true)
      expect(isValidTicketPriority('medium')).toBe(true)
      expect(isValidTicketPriority('low')).toBe(true)
    })

    it('should return false for invalid ticket priorities', () => {
      expect(isValidTicketPriority('critical')).toBe(false)
      expect(isValidTicketPriority('urgent')).toBe(false)
      expect(isValidTicketPriority('normal')).toBe(false)
      expect(isValidTicketPriority('')).toBe(false)
      expect(isValidTicketPriority('HIGH')).toBe(false) // case sensitive
    })

    it('should handle edge cases', () => {
      expect(isValidTicketPriority(' high ')).toBe(false) // whitespace
      expect(isValidTicketPriority('high ')).toBe(false) // trailing space
      expect(isValidTicketPriority(' high')).toBe(false) // leading space
    })
  })
})
