import { describe, expect, it } from 'vitest'
import { TicketPriority } from './ticket-priority.ts'

describe('TicketPriority', () => {
  describe('create', () => {
    it('should create priority with valid values', () => {
      const validPriorities = ['high', 'medium', 'low'] as const

      for (const priority of validPriorities) {
        const ticketPriority = TicketPriority.create(priority)
        expect(ticketPriority.value).toBe(priority)
      }
    })

    it('should throw error for invalid priority', () => {
      expect(() => TicketPriority.create('invalid' as any)).toThrow(
        'Invalid ticket priority: invalid'
      )
    })
  })

  describe('factory methods', () => {
    it('should create high priority', () => {
      const priority = TicketPriority.high()
      expect(priority.value).toBe('high')
    })

    it('should create medium priority', () => {
      const priority = TicketPriority.medium()
      expect(priority.value).toBe('medium')
    })

    it('should create low priority', () => {
      const priority = TicketPriority.low()
      expect(priority.value).toBe('low')
    })
  })

  describe('compareTo', () => {
    it('should return positive when this priority is higher', () => {
      const high = TicketPriority.high()
      const medium = TicketPriority.medium()
      const low = TicketPriority.low()

      expect(high.compareTo(medium)).toBeGreaterThan(0)
      expect(high.compareTo(low)).toBeGreaterThan(0)
      expect(medium.compareTo(low)).toBeGreaterThan(0)
    })

    it('should return negative when this priority is lower', () => {
      const high = TicketPriority.high()
      const medium = TicketPriority.medium()
      const low = TicketPriority.low()

      expect(medium.compareTo(high)).toBeLessThan(0)
      expect(low.compareTo(high)).toBeLessThan(0)
      expect(low.compareTo(medium)).toBeLessThan(0)
    })

    it('should return zero when priorities are equal', () => {
      const high1 = TicketPriority.high()
      const high2 = TicketPriority.high()

      expect(high1.compareTo(high2)).toBe(0)
    })
  })

  describe('isHigherThan', () => {
    it('should return true when this priority is higher', () => {
      const high = TicketPriority.high()
      const medium = TicketPriority.medium()
      const low = TicketPriority.low()

      expect(high.isHigherThan(medium)).toBe(true)
      expect(high.isHigherThan(low)).toBe(true)
      expect(medium.isHigherThan(low)).toBe(true)
    })

    it('should return false when this priority is lower or equal', () => {
      const high = TicketPriority.high()
      const medium = TicketPriority.medium()
      const low = TicketPriority.low()

      expect(medium.isHigherThan(high)).toBe(false)
      expect(low.isHigherThan(high)).toBe(false)
      expect(low.isHigherThan(medium)).toBe(false)
      expect(high.isHigherThan(high)).toBe(false)
    })
  })

  describe('isLowerThan', () => {
    it('should return true when this priority is lower', () => {
      const high = TicketPriority.high()
      const medium = TicketPriority.medium()
      const low = TicketPriority.low()

      expect(medium.isLowerThan(high)).toBe(true)
      expect(low.isLowerThan(high)).toBe(true)
      expect(low.isLowerThan(medium)).toBe(true)
    })

    it('should return false when this priority is higher or equal', () => {
      const high = TicketPriority.high()
      const medium = TicketPriority.medium()
      const low = TicketPriority.low()

      expect(high.isLowerThan(medium)).toBe(false)
      expect(high.isLowerThan(low)).toBe(false)
      expect(medium.isLowerThan(low)).toBe(false)
      expect(high.isLowerThan(high)).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for equal priorities', () => {
      const priority1 = TicketPriority.high()
      const priority2 = TicketPriority.high()

      expect(priority1.equals(priority2)).toBe(true)
    })

    it('should return false for different priorities', () => {
      const priority1 = TicketPriority.high()
      const priority2 = TicketPriority.low()

      expect(priority1.equals(priority2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the priority value as string', () => {
      expect(TicketPriority.high().toString()).toBe('high')
      expect(TicketPriority.medium().toString()).toBe('medium')
      expect(TicketPriority.low().toString()).toBe('low')
    })
  })
})
