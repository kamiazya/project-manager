import { describe, expect, it } from 'vitest'
import { TicketStatus } from './ticket-status.ts'

describe('TicketStatus', () => {
  describe('create', () => {
    it('should create status with valid values', () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'archived'] as const

      for (const status of validStatuses) {
        const ticketStatus = TicketStatus.create(status)
        expect(ticketStatus.value).toBe(status)
      }
    })

    it('should throw error for invalid status', () => {
      expect(() => TicketStatus.create('invalid' as any)).toThrow('Invalid ticket status: invalid')
    })
  })

  describe('factory methods', () => {
    it('should create pending status', () => {
      const status = TicketStatus.pending()
      expect(status.value).toBe('pending')
    })

    it('should create in_progress status', () => {
      const status = TicketStatus.inProgress()
      expect(status.value).toBe('in_progress')
    })

    it('should create completed status', () => {
      const status = TicketStatus.completed()
      expect(status.value).toBe('completed')
    })

    it('should create archived status', () => {
      const status = TicketStatus.archived()
      expect(status.value).toBe('archived')
    })
  })

  describe('canTransitionTo', () => {
    it('should allow valid transitions from pending', () => {
      const pending = TicketStatus.pending()

      expect(pending.canTransitionTo('in_progress')).toBe(true)
      expect(pending.canTransitionTo('archived')).toBe(true)
      expect(pending.canTransitionTo('completed')).toBe(false)
      expect(pending.canTransitionTo('pending')).toBe(false)
    })

    it('should allow valid transitions from in_progress', () => {
      const inProgress = TicketStatus.inProgress()

      expect(inProgress.canTransitionTo('pending')).toBe(true)
      expect(inProgress.canTransitionTo('completed')).toBe(true)
      expect(inProgress.canTransitionTo('archived')).toBe(true)
      expect(inProgress.canTransitionTo('in_progress')).toBe(false)
    })

    it('should allow valid transitions from completed', () => {
      const completed = TicketStatus.completed()

      expect(completed.canTransitionTo('in_progress')).toBe(true)
      expect(completed.canTransitionTo('archived')).toBe(true)
      expect(completed.canTransitionTo('pending')).toBe(false)
      expect(completed.canTransitionTo('completed')).toBe(false)
    })

    it('should not allow any transitions from archived', () => {
      const archived = TicketStatus.archived()

      expect(archived.canTransitionTo('pending')).toBe(false)
      expect(archived.canTransitionTo('in_progress')).toBe(false)
      expect(archived.canTransitionTo('completed')).toBe(false)
      expect(archived.canTransitionTo('archived')).toBe(false)
    })
  })

  describe('isFinal', () => {
    it('should return true for completed and archived', () => {
      expect(TicketStatus.completed().isFinal()).toBe(true)
      expect(TicketStatus.archived().isFinal()).toBe(true)
    })

    it('should return false for pending and in_progress', () => {
      expect(TicketStatus.pending().isFinal()).toBe(false)
      expect(TicketStatus.inProgress().isFinal()).toBe(false)
    })
  })

  describe('isActive', () => {
    it('should return true for all statuses except archived', () => {
      expect(TicketStatus.pending().isActive()).toBe(true)
      expect(TicketStatus.inProgress().isActive()).toBe(true)
      expect(TicketStatus.completed().isActive()).toBe(true)
    })

    it('should return false for archived', () => {
      expect(TicketStatus.archived().isActive()).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for equal statuses', () => {
      const status1 = TicketStatus.pending()
      const status2 = TicketStatus.pending()

      expect(status1.equals(status2)).toBe(true)
    })

    it('should return false for different statuses', () => {
      const status1 = TicketStatus.pending()
      const status2 = TicketStatus.completed()

      expect(status1.equals(status2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the status value as string', () => {
      expect(TicketStatus.pending().toString()).toBe('pending')
      expect(TicketStatus.inProgress().toString()).toBe('in_progress')
      expect(TicketStatus.completed().toString()).toBe('completed')
      expect(TicketStatus.archived().toString()).toBe('archived')
    })
  })
})
