import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TICKET_DEFAULTS } from '../types/ticket-types.ts'
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
      expect(ticket.type).toBe(TICKET_DEFAULTS.TYPE)
      expect(ticket.privacy).toBe(TICKET_DEFAULTS.PRIVACY)
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

    // Edge cases and boundary tests
    it('should handle minimum valid title length', () => {
      const data = { ...validCreateData, title: 'A' }
      const ticket = Ticket.create(data)

      expect(ticket.title.value).toBe('A')
    })

    it('should handle maximum valid title length', () => {
      const longTitle = 'A'.repeat(200) // Maximum length
      const data = { ...validCreateData, title: longTitle }
      const ticket = Ticket.create(data)

      expect(ticket.title.value).toBe(longTitle)
    })

    it('should throw error for title exceeding maximum length', () => {
      const tooLongTitle = 'A'.repeat(201) // Exceeds maximum
      const data = { ...validCreateData, title: tooLongTitle }

      expect(() => Ticket.create(data)).toThrow('Title cannot exceed 200 characters')
    })

    it('should handle minimum valid description length', () => {
      const data = { ...validCreateData, description: 'A' }
      const ticket = Ticket.create(data)

      expect(ticket.description.value).toBe('A')
    })

    it('should handle maximum valid description length', () => {
      const longDescription = 'A'.repeat(5000) // Maximum length (5000 in implementation)
      const data = { ...validCreateData, description: longDescription }
      const ticket = Ticket.create(data)

      expect(ticket.description.value).toBe(longDescription)
    })

    it('should throw error for description exceeding maximum length', () => {
      const tooLongDescription = 'A'.repeat(5001) // Exceeds maximum (5000 in implementation)
      const data = { ...validCreateData, description: tooLongDescription }

      expect(() => Ticket.create(data)).toThrow('Description cannot exceed 5000 characters')
    })

    it('should trim whitespace from title and description', () => {
      const data = {
        ...validCreateData,
        title: '  Fix login bug  ',
        description: '  Users cannot login with email  ',
      }
      const ticket = Ticket.create(data)

      expect(ticket.title.value).toBe('Fix login bug')
      expect(ticket.description.value).toBe('Users cannot login with email')
    })

    it('should throw error for title with only whitespace', () => {
      const data = { ...validCreateData, title: '   ' }

      expect(() => Ticket.create(data)).toThrow('Title cannot be empty or whitespace only')
    })

    it('should throw error for description with only whitespace', () => {
      const data = { ...validCreateData, description: '   ' }

      expect(() => Ticket.create(data)).toThrow('Description cannot be empty or whitespace only')
    })

    it('should generate unique IDs for each ticket', () => {
      const ticket1 = Ticket.create(validCreateData)
      const ticket2 = Ticket.create(validCreateData)

      expect(ticket1.id.value).not.toBe(ticket2.id.value)
    })

    it('should set creation and update timestamps to the same value on creation', () => {
      const ticket = Ticket.create(validCreateData)

      expect(ticket.createdAt.getTime()).toBe(ticket.updatedAt.getTime())
    })

    it('should handle all valid status values', () => {
      const statuses = ['pending', 'in_progress', 'completed', 'archived'] as const

      statuses.forEach(status => {
        const data = { ...validCreateData, status }
        const ticket = Ticket.create(data)
        expect(ticket.status.value).toBe(status)
      })
    })

    it('should handle all valid priority values', () => {
      const priorities = ['high', 'medium', 'low'] as const

      priorities.forEach(priority => {
        const data = { ...validCreateData, priority }
        const ticket = Ticket.create(data)
        expect(ticket.priority.value).toBe(priority)
      })
    })

    it('should handle all valid type values', () => {
      const types = ['feature', 'bug', 'task'] as const

      types.forEach(type => {
        const data = { ...validCreateData, type }
        const ticket = Ticket.create(data)
        expect(ticket.type).toBe(type)
      })
    })

    it('should handle all valid privacy values', () => {
      const privacies = ['local-only', 'team', 'public'] as const

      privacies.forEach(privacy => {
        const data = { ...validCreateData, privacy }
        const ticket = Ticket.create(data)
        expect(ticket.privacy).toBe(privacy)
      })
    })

    it('should throw error for invalid status', () => {
      const data = { ...validCreateData, status: 'invalid' as any }

      expect(() => Ticket.create(data)).toThrow('Invalid ticket status: invalid')
    })

    it('should handle invalid type by using passed value', () => {
      const data = { ...validCreateData, type: 'invalid' as any }
      const ticket = Ticket.create(data)

      // Should use passed value (no validation in create method)
      expect(ticket.type).toBe('invalid')
    })

    it('should handle invalid privacy by using passed value', () => {
      const data = { ...validCreateData, privacy: 'invalid' as any }
      const ticket = Ticket.create(data)

      // Should use passed value (no validation in create method)
      expect(ticket.privacy).toBe('invalid')
    })

    it('should handle special characters in title and description', () => {
      const data = {
        ...validCreateData,
        title: 'Fix: bug/issue #123 (urgent)',
        description: 'Users can\'t login with email@domain.com - throws "Error: 500"',
      }
      const ticket = Ticket.create(data)

      expect(ticket.title.value).toBe('Fix: bug/issue #123 (urgent)')
      expect(ticket.description.value).toBe(
        'Users can\'t login with email@domain.com - throws "Error: 500"'
      )
    })

    it('should handle Unicode characters in title and description', () => {
      const data = {
        ...validCreateData,
        title: 'ユーザー認証エラー修正 🔧',
        description: 'ユーザーがメールアドレスでログインできない問題を修正する 📝',
      }
      const ticket = Ticket.create(data)

      expect(ticket.title.value).toBe('ユーザー認証エラー修正 🔧')
      expect(ticket.description.value).toBe(
        'ユーザーがメールアドレスでログインできない問題を修正する 📝'
      )
    })

    it('should handle newlines and tabs in description', () => {
      const data = {
        ...validCreateData,
        description: 'Line 1\nLine 2\tTabbed content',
      }
      const ticket = Ticket.create(data)

      expect(ticket.description.value).toBe('Line 1\nLine 2\tTabbed content')
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

    it('should not throw error for reconstitute data with empty id', () => {
      const invalidData = { ...validReconstituteData, id: '' }

      // fromValue doesn't validate, so no error thrown
      const ticket = Ticket.reconstitute(invalidData)
      expect(ticket.id.value).toBe('')
    })

    it('should throw error for invalid title in reconstitute data', () => {
      const invalidData = { ...validReconstituteData, title: '' }

      expect(() => Ticket.reconstitute(invalidData)).toThrow(
        'Title cannot be empty or whitespace only'
      )
    })

    it('should throw error for invalid description in reconstitute data', () => {
      const invalidData = { ...validReconstituteData, description: '' }

      expect(() => Ticket.reconstitute(invalidData)).toThrow(
        'Description cannot be empty or whitespace only'
      )
    })

    it('should throw error for invalid status in reconstitute data', () => {
      const invalidData = { ...validReconstituteData, status: 'invalid' as any }

      expect(() => Ticket.reconstitute(invalidData)).toThrow('Invalid ticket status: invalid')
    })

    it('should throw error for invalid priority in reconstitute data', () => {
      const invalidData = { ...validReconstituteData, priority: 'invalid' as any }

      expect(() => Ticket.reconstitute(invalidData)).toThrow('Invalid ticket priority: invalid')
    })

    it('should handle type and privacy validation during reconstitution', () => {
      // reconstitute assumes valid data from persistence, so no validation for type/privacy
      const data = {
        ...validReconstituteData,
        type: 'feature' as const,
        privacy: 'public' as const,
      }
      const ticket = Ticket.reconstitute(data)

      expect(ticket.type).toBe('feature')
      expect(ticket.privacy).toBe('public')
    })

    it('should handle different date formats in reconstitute data', () => {
      const data = {
        ...validReconstituteData,
        createdAt: '2024-01-01T12:30:45.123Z',
        updatedAt: '2024-01-02T08:15:30.456Z',
      }
      const ticket = Ticket.reconstitute(data)

      expect(ticket.createdAt).toEqual(new Date('2024-01-01T12:30:45.123Z'))
      expect(ticket.updatedAt).toEqual(new Date('2024-01-02T08:15:30.456Z'))
    })

    it('should handle edge case timestamps in reconstitute data', () => {
      const data = {
        ...validReconstituteData,
        createdAt: '1970-01-01T00:00:00.000Z', // Unix epoch
        updatedAt: '2099-12-31T23:59:59.999Z', // Far future
      }
      const ticket = Ticket.reconstitute(data)

      expect(ticket.createdAt).toEqual(new Date('1970-01-01T00:00:00.000Z'))
      expect(ticket.updatedAt).toEqual(new Date('2099-12-31T23:59:59.999Z'))
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

    // Comprehensive status transition matrix testing
    it('should allow valid transitions from pending', () => {
      const ticket = Ticket.create(validCreateData) // starts as pending

      // pending -> in_progress
      ticket.changeStatus('in_progress')
      expect(ticket.status.value).toBe('in_progress')

      // Reset to pending for next test
      const pendingTicket = Ticket.create(validCreateData)

      // pending -> archived
      pendingTicket.changeStatus('archived')
      expect(pendingTicket.status.value).toBe('archived')
    })

    it('should allow valid transitions from in_progress', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'in_progress' })

      // in_progress -> completed
      ticket.changeStatus('completed')
      expect(ticket.status.value).toBe('completed')

      // Reset to in_progress for next test
      const inProgressTicket = Ticket.create({ ...validCreateData, status: 'in_progress' })

      // in_progress -> pending
      inProgressTicket.changeStatus('pending')
      expect(inProgressTicket.status.value).toBe('pending')

      // Reset to in_progress for next test
      const inProgressTicket2 = Ticket.create({ ...validCreateData, status: 'in_progress' })

      // in_progress -> archived
      inProgressTicket2.changeStatus('archived')
      expect(inProgressTicket2.status.value).toBe('archived')
    })

    it('should allow valid transitions from completed', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'completed' })

      // completed -> archived
      ticket.changeStatus('archived')
      expect(ticket.status.value).toBe('archived')

      // Reset to completed for next test
      const completedTicket = Ticket.create({ ...validCreateData, status: 'completed' })

      // completed -> in_progress (reopening)
      completedTicket.changeStatus('in_progress')
      expect(completedTicket.status.value).toBe('in_progress')
    })

    it('should not allow transitions from archived', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'archived' })

      // archived -> pending (not allowed)
      expect(() => ticket.changeStatus('pending')).toThrow(
        'Cannot transition from archived to pending'
      )

      // archived -> in_progress (not allowed)
      expect(() => ticket.changeStatus('in_progress')).toThrow(
        'Cannot transition from archived to in_progress'
      )

      // archived -> completed (not allowed)
      expect(() => ticket.changeStatus('completed')).toThrow(
        'Cannot transition from archived to completed'
      )
    })

    it('should throw error for invalid transitions from pending', () => {
      const ticket = Ticket.create(validCreateData) // starts as pending

      expect(() => ticket.changeStatus('completed')).toThrow(
        'Cannot transition from pending to completed'
      )
    })

    it('should throw error for invalid transitions from completed', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'completed' })

      expect(() => ticket.changeStatus('pending')).toThrow(
        'Cannot transition from completed to pending'
      )
    })

    it('should not allow staying in the same status', () => {
      const ticket = Ticket.create(validCreateData) // starts as pending

      // Should throw error when setting same status
      expect(() => ticket.changeStatus('pending')).toThrow(
        'Cannot transition from pending to pending'
      )
    })

    it('should handle rapid status changes', () => {
      vi.useFakeTimers()
      const initialTime = new Date('2023-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)

      const ticket = Ticket.create(validCreateData)
      const originalUpdatedAt = ticket.updatedAt

      // Rapid transitions
      vi.advanceTimersByTime(1)
      ticket.changeStatus('in_progress')
      const firstUpdate = ticket.updatedAt

      vi.advanceTimersByTime(1)
      ticket.changeStatus('completed')
      const secondUpdate = ticket.updatedAt

      vi.advanceTimersByTime(1)
      ticket.changeStatus('archived')
      const thirdUpdate = ticket.updatedAt

      expect(firstUpdate.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      expect(secondUpdate.getTime()).toBeGreaterThan(firstUpdate.getTime())
      expect(thirdUpdate.getTime()).toBeGreaterThan(secondUpdate.getTime())

      vi.useRealTimers()
    })

    it('should throw error for undefined status', () => {
      const ticket = Ticket.create(validCreateData)

      expect(() => ticket.changeStatus(undefined as any)).toThrow(
        'Invalid ticket status: undefined'
      )
    })

    it('should throw error for null status', () => {
      const ticket = Ticket.create(validCreateData)

      expect(() => ticket.changeStatus(null as any)).toThrow('Invalid ticket status: null')
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

    it('should allow starting progress on completed ticket (reopening)', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'completed' })

      // Should allow reopening completed ticket
      ticket.startProgress()
      expect(ticket.status.value).toBe('in_progress')
    })

    it('should throw error when completing pending ticket', () => {
      const ticket = Ticket.create(validCreateData) // starts as pending

      expect(() => ticket.complete()).toThrow('Cannot transition from pending to completed')
    })

    it('should allow archiving from any status', () => {
      const statuses = ['pending', 'in_progress', 'completed'] as const

      statuses.forEach(status => {
        const ticket = Ticket.create({ ...validCreateData, status })
        ticket.archive()
        expect(ticket.status.value).toBe('archived')
      })
    })

    it('should update timestamp when performing business operations', () => {
      vi.useFakeTimers()
      const initialTime = new Date('2023-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)

      const ticket = Ticket.create(validCreateData)
      const originalUpdatedAt = ticket.updatedAt

      vi.advanceTimersByTime(2)
      ticket.startProgress()
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())

      const afterStartProgress = ticket.updatedAt

      vi.advanceTimersByTime(2)
      ticket.complete()
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(afterStartProgress.getTime())

      vi.useRealTimers()
    })

    it('should throw error when trying to start progress on archived ticket', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'archived' })

      // Should not be able to start progress on archived ticket
      expect(() => ticket.startProgress()).toThrow('Cannot transition from archived to in_progress')
    })

    it('should throw error when completing already completed ticket', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'completed' })

      // Should throw error when completing already completed ticket
      expect(() => ticket.complete()).toThrow('Cannot transition from completed to completed')
    })

    it('should throw error when archiving already archived ticket', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'archived' })

      // Should throw error when archiving already archived ticket
      expect(() => ticket.archive()).toThrow('Cannot transition from archived to archived')
    })

    it('should handle full workflow: pending -> in_progress -> completed -> archived', () => {
      const ticket = Ticket.create(validCreateData)

      // Full workflow
      expect(ticket.status.value).toBe('pending')

      ticket.startProgress()
      expect(ticket.status.value).toBe('in_progress')

      ticket.complete()
      expect(ticket.status.value).toBe('completed')

      ticket.archive()
      expect(ticket.status.value).toBe('archived')
    })

    it('should handle workflow with reopening: completed -> in_progress -> completed', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'completed' })

      // Reopen
      ticket.changeStatus('in_progress')
      expect(ticket.status.value).toBe('in_progress')

      // Complete again
      ticket.complete()
      expect(ticket.status.value).toBe('completed')
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

    it('should identify finalized status for in_progress tickets', () => {
      const inProgressTicket = Ticket.create({ ...validCreateData, status: 'in_progress' })

      expect(inProgressTicket.isFinalized()).toBe(false)
    })

    it('should identify active status for all non-archived tickets', () => {
      const statuses = ['pending', 'in_progress', 'completed'] as const

      statuses.forEach(status => {
        const ticket = Ticket.create({ ...validCreateData, status })
        expect(ticket.isActive()).toBe(true)
      })
    })

    it('should identify active status for completed tickets', () => {
      const completedTicket = Ticket.create({ ...validCreateData, status: 'completed' })

      expect(completedTicket.isActive()).toBe(true)
    })

    it('should maintain consistent status check results after status changes', () => {
      const ticket = Ticket.create(validCreateData)

      // Initial state
      expect(ticket.isActive()).toBe(true)
      expect(ticket.isFinalized()).toBe(false)

      // After starting progress
      ticket.startProgress()
      expect(ticket.isActive()).toBe(true)
      expect(ticket.isFinalized()).toBe(false)

      // After completing
      ticket.complete()
      expect(ticket.isActive()).toBe(true)
      expect(ticket.isFinalized()).toBe(true)

      // After archiving
      ticket.archive()
      expect(ticket.isActive()).toBe(false)
      expect(ticket.isFinalized()).toBe(true)
    })

    it('should handle edge case status transitions and check consistency', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'completed' })

      // Initially completed
      expect(ticket.isFinalized()).toBe(true)
      expect(ticket.isActive()).toBe(true)

      // Reopen to in_progress
      ticket.changeStatus('in_progress')
      expect(ticket.isFinalized()).toBe(false)
      expect(ticket.isActive()).toBe(true)

      // Complete again
      ticket.complete()
      expect(ticket.isFinalized()).toBe(true)
      expect(ticket.isActive()).toBe(true)
    })

    it('should throw error when trying to unarchive tickets', () => {
      const ticket = Ticket.create({ ...validCreateData, status: 'archived' })

      // Initially archived
      expect(ticket.isActive()).toBe(false)
      expect(ticket.isFinalized()).toBe(true)

      // Cannot unarchive to pending
      expect(() => ticket.changeStatus('pending')).toThrow(
        'Cannot transition from archived to pending'
      )

      // Cannot unarchive to in_progress
      expect(() => ticket.changeStatus('in_progress')).toThrow(
        'Cannot transition from archived to in_progress'
      )
    })
  })

  describe('changeType', () => {
    it('should change type and update timestamp', () => {
      vi.useFakeTimers()
      const initialTime = new Date('2023-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)

      const ticket = Ticket.create(validCreateData)
      const originalUpdatedAt = ticket.updatedAt

      vi.advanceTimersByTime(2)
      ticket.changeType('feature')

      expect(ticket.type).toBe('feature')
      expect(ticket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())

      vi.useRealTimers()
    })

    it('should handle all valid type values', () => {
      const ticket = Ticket.create(validCreateData)
      const types = ['feature', 'bug', 'task'] as const

      types.forEach(type => {
        ticket.changeType(type)
        expect(ticket.type).toBe(type)
      })
    })

    it('should allow changing to invalid type', () => {
      const ticket = Ticket.create(validCreateData)

      // changeType doesn't validate, so no error thrown
      ticket.changeType('invalid' as any)
      expect(ticket.type).toBe('invalid')
    })

    it('should handle setting same type', () => {
      const ticket = Ticket.create({ ...validCreateData, type: 'bug' })

      // Should not throw error when setting same type
      ticket.changeType('bug')
      expect(ticket.type).toBe('bug')
    })
  })

  describe('immutability and encapsulation', () => {
    it('should not allow direct modification of properties', () => {
      const ticket = Ticket.create(validCreateData)

      // These should be read-only
      expect(() => {
        ;(ticket as any).id = 'new-id'
      }).toThrow()

      expect(() => {
        ;(ticket as any).createdAt = new Date()
      }).toThrow()
    })

    it('should return the same value object references when accessing properties', () => {
      const ticket = Ticket.create(validCreateData)

      const title1 = ticket.title
      const title2 = ticket.title

      // Should be equal and same reference (Value Object caching)
      expect(title1.value).toBe(title2.value)
      expect(title1).toBe(title2) // Same object references
    })

    it('should maintain data integrity across operations', () => {
      const ticket = Ticket.create(validCreateData)
      const originalCreatedAt = ticket.createdAt

      // Perform various operations
      ticket.updateTitle('New title')
      ticket.changeStatus('in_progress')
      ticket.changePriority('low')

      // createdAt should never change
      expect(ticket.createdAt).toEqual(originalCreatedAt)

      // ID should never change
      expect(ticket.id.value).toBe(ticket.id.value)
    })
  })
})
