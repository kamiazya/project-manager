import { describe, expect, it, test } from 'vitest'
import { createTicketStatus } from '../types/ticket-types.ts'
import { TicketStatus } from './ticket-status.ts'

describe('TicketStatus', () => {
  describe('create', () => {
    it('should create a valid TicketStatus with valid status key', () => {
      // Arrange
      const validStatus = createTicketStatus('pending')

      // Act
      const status = TicketStatus.create(validStatus)

      // Assert
      expect(status).toBeInstanceOf(TicketStatus)
      expect(status.value).toBe('pending')
    })

    it('should create different valid status values', () => {
      // Arrange & Act
      const pendingStatus = TicketStatus.create(createTicketStatus('pending'))
      const inProgressStatus = TicketStatus.create(createTicketStatus('in_progress'))
      const completedStatus = TicketStatus.create(createTicketStatus('completed'))
      const archivedStatus = TicketStatus.create(createTicketStatus('archived'))

      // Assert
      expect(pendingStatus.value).toBe('pending')
      expect(inProgressStatus.value).toBe('in_progress')
      expect(completedStatus.value).toBe('completed')
      expect(archivedStatus.value).toBe('archived')
    })
  })

  describe('toString', () => {
    it('should return string representation of status', () => {
      // Arrange
      const status = TicketStatus.create(createTicketStatus('pending'))

      // Act
      const result = status.toString()

      // Assert
      expect(result).toBe('pending')
    })
  })

  describe('equality', () => {
    it('should be equal when status values are the same', () => {
      // Arrange
      const status1 = TicketStatus.create(createTicketStatus('pending'))
      const status2 = TicketStatus.create(createTicketStatus('pending'))

      // Act & Assert
      expect(status1.equals(status2)).toBe(true)
    })

    it('should not be equal when status values are different', () => {
      // Arrange
      const pendingStatus = TicketStatus.create(createTicketStatus('pending'))
      const completedStatus = TicketStatus.create(createTicketStatus('completed'))

      // Act & Assert
      expect(pendingStatus.equals(completedStatus)).toBe(false)
    })
  })
})

describe('createTicketStatus (boundary value tests)', () => {
  describe('valid values', () => {
    test.each([
      'pending',
      'in_progress',
      'completed',
      'archived',
      'a', // minimum length (1 character)
      'very_long_status_name', // long status name
      'status_with_multiple_underscores',
      'z', // boundary letter
    ])('should accept valid status: %s', status => {
      expect(() => createTicketStatus(status)).not.toThrow()
      expect(createTicketStatus(status)).toBe(status)
    })
  })

  describe('invalid values', () => {
    test.each([
      ['', 'empty string'],
      ['  ', 'whitespace only'],
      ['Pending', 'uppercase letters'],
      ['PENDING', 'all uppercase'],
      ['pending-status', 'hyphen instead of underscore'],
      ['pending status', 'space in status'],
      ['pending123', 'numbers'],
      ['pending!', 'special characters'],
      ['pending@status', 'special characters'],
      ['ペンディング', 'non-ASCII characters'],
      ['pending.status', 'dot character'],
      ['pending/status', 'slash character'],
      ['pending\\status', 'backslash character'],
      ['pending\nstatus', 'newline character'],
      ['pending\tstatus', 'tab character'],
    ])('should reject invalid status: %s (%s)', (status, description) => {
      expect(() => createTicketStatus(status)).toThrow()
      expect(() => createTicketStatus(status)).toThrow(/Invalid ticket status/)
    })
  })

  describe('null and undefined values', () => {
    it('should reject null value', () => {
      expect(() => createTicketStatus(null as any)).toThrow()
      expect(() => createTicketStatus(null as any)).toThrow(/Invalid ticket status/)
    })

    it('should reject undefined value', () => {
      expect(() => createTicketStatus(undefined as any)).toThrow()
      expect(() => createTicketStatus(undefined as any)).toThrow(/Invalid ticket status/)
    })
  })

  describe('error message validation', () => {
    it('should provide descriptive error message with invalid value', () => {
      const invalidStatus = 'INVALID-STATUS'

      expect(() => createTicketStatus(invalidStatus)).toThrow(
        `Invalid ticket status: ${invalidStatus}. Must contain only lowercase letters and underscores.`
      )
    })
  })
})
