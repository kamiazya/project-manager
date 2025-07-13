import { DEFAULTS } from '@project-manager/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type CreateTicketData, type ReconstituteTicketData, Ticket } from './ticket.ts'

describe('Ticket', () => {
  let validCreateData: CreateTicketData
  let validReconstituteData: ReconstituteTicketData

  beforeEach(() => {
    validCreateData = {
      title: 'Fix login bug',
      description: 'Users cannot login with email',
      priority: 'high',
    }

    validReconstituteData = {
      id: 'test-ticket-id-123',
      title: 'Fix login bug',
      description: 'Users cannot login with email',
      status: 'pending',
      priority: 'high',
      type: 'bug',
      privacy: 'local-only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
  })

  describe('create', () => {
    it('should create a new ticket with valid data', () => {
      const ticket = Ticket.create(validCreateData)

      expect(ticket.id).toBeDefined()
      expect(ticket.title.value).toBe('Fix login bug')
      expect(ticket.description.value).toBe('Users cannot login with email')
      expect(ticket.priority.value).toBe('high')
      expect(ticket.status.value).toBe('pending')
      expect(ticket.type).toBe(DEFAULTS.TYPE)
      expect(ticket.privacy).toBe(DEFAULTS.PRIVACY)
      expect(ticket.createdAt).toBeInstanceOf(Date)
      expect(ticket.updatedAt).toBeInstanceOf(Date)
    })

    it('should create ticket with custom status', () => {
      const data = { ...validCreateData, status: 'in_progress' as const }
      const ticket = Ticket.create(data)

      expect(ticket.status.value).toBe('in_progress')
    })

    it('should create ticket with custom type and privacy', () => {
      const data = {
        ...validCreateData,
        type: 'feature' as const,
        privacy: 'public' as const,
      }
      const ticket = Ticket.create(data)

      expect(ticket.type).toBe('feature')
      expect(ticket.privacy).toBe('public')
    })

    it('should throw error for invalid title', () => {
      const data = { ...validCreateData, title: '' }

      expect(() => Ticket.create(data)).toThrow('Title cannot be empty or whitespace only')
    })

    it('should throw error for invalid description', () => {
      const data = { ...validCreateData, description: '' }

      expect(() => Ticket.create(data)).toThrow('Description cannot be empty or whitespace only')
    })

    it('should throw error for invalid priority', () => {
      const data = { ...validCreateData, priority: 'invalid' as any }

      expect(() => Ticket.create(data)).toThrow('Invalid ticket priority: invalid')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute ticket from persistence data', () => {
      const ticket = Ticket.reconstitute(validReconstituteData)

      expect(ticket.id.value).toBe('test-ticket-id-123')
      expect(ticket.title.value).toBe('Fix login bug')
      expect(ticket.description.value).toBe('Users cannot login with email')
      expect(ticket.status.value).toBe('pending')
      expect(ticket.priority.value).toBe('high')
      expect(ticket.type).toBe('bug')
      expect(ticket.privacy).toBe('local-only')
      expect(ticket.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'))
      expect(ticket.updatedAt).toEqual(new Date('2024-01-01T00:00:00.000Z'))
    })
  })

  describe('updateTitle', () => {
    it('should update title and timestamp', () => {
      vi.useFakeTimers()
      const initialTime = new Date('2023-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)

      const ticket = Ticket.create(validCreateData)
      const originalUpdatedAt = ticket.updatedAt

      // Advance time by 2ms to ensure timestamp difference
      vi.advanceTimersByTime(2)

      ticket.updateTitle('New title')

      expect(ticket.title.value).toBe('New title')
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())

      vi.useRealTimers()
    })

    it('should throw error for invalid title', () => {
      const ticket = Ticket.create(validCreateData)

      expect(() => ticket.updateTitle('')).toThrow('Title cannot be empty or whitespace only')
    })
  })

  describe('updateDescription', () => {
    it('should update description and timestamp', () => {
      vi.useFakeTimers()
      const initialTime = new Date('2023-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)

      const ticket = Ticket.create(validCreateData)
      const originalUpdatedAt = ticket.updatedAt

      // Advance time by 2ms to ensure timestamp difference
      vi.advanceTimersByTime(2)

      ticket.updateDescription('New description')

      expect(ticket.description.value).toBe('New description')
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())

      vi.useRealTimers()
    })

    it('should throw error for invalid description', () => {
      const ticket = Ticket.create(validCreateData)

      expect(() => ticket.updateDescription('')).toThrow(
        'Description cannot be empty or whitespace only'
      )
    })
  })

  describe('changeStatus', () => {
    it('should change status when transition is valid', () => {
      const ticket = Ticket.create(validCreateData) // starts as pending

      ticket.changeStatus('in_progress')
      expect(ticket.status.value).toBe('in_progress')
    })

    it('should throw error when transition is invalid', () => {
      const ticket = Ticket.create(validCreateData) // starts as pending

      expect(() => ticket.changeStatus('completed')).toThrow(
        'Cannot transition from pending to completed'
      )
    })

    it('should update timestamp when status changes', () => {
      vi.useFakeTimers()
      const initialTime = new Date('2023-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)

      const ticket = Ticket.create(validCreateData)
      const originalUpdatedAt = ticket.updatedAt

      // Advance time by 2ms to ensure timestamp difference
      vi.advanceTimersByTime(2)

      ticket.changeStatus('in_progress')
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())

      vi.useRealTimers()
    })
  })

  describe('changePriority', () => {
    it('should change priority and update timestamp', () => {
      vi.useFakeTimers()
      const initialTime = new Date('2023-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)

      const ticket = Ticket.create(validCreateData)
      const originalUpdatedAt = ticket.updatedAt

      // Advance time by 2ms to ensure timestamp difference
      vi.advanceTimersByTime(2)

      ticket.changePriority('low')

      expect(ticket.priority.value).toBe('low')
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())

      vi.useRealTimers()
    })

    it('should throw error for invalid priority', () => {
      const ticket = Ticket.create(validCreateData)

      expect(() => ticket.changePriority('invalid' as any)).toThrow(
        'Invalid ticket priority: invalid'
      )
    })
  })

  describe('business operations', () => {
    it('should start progress', () => {
      const ticket = Ticket.create(validCreateData)

      ticket.startProgress()
      expect(ticket.status.value).toBe('in_progress')
    })

    it('should complete ticket', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'in_progress' })

      ticket.complete()
      expect(ticket.status.value).toBe('completed')
    })

    it('should archive ticket', () => {
      const ticket = Ticket.create(validCreateData)

      ticket.archive()
      expect(ticket.status.value).toBe('archived')
    })
  })

  describe('status checks', () => {
    it('should identify finalized tickets', () => {
      const pendingTicket = Ticket.create(validCreateData)
      const completedTicket = Ticket.create({ ...validCreateData, status: 'completed' })
      const archivedTicket = Ticket.create({ ...validCreateData, status: 'archived' })

      expect(pendingTicket.isFinalized()).toBe(false)
      expect(completedTicket.isFinalized()).toBe(true)
      expect(archivedTicket.isFinalized()).toBe(true)
    })

    it('should identify active tickets', () => {
      const pendingTicket = Ticket.create(validCreateData)
      const archivedTicket = Ticket.create({ ...validCreateData, status: 'archived' })

      expect(pendingTicket.isActive()).toBe(true)
      expect(archivedTicket.isActive()).toBe(false)
    })
  })
})
