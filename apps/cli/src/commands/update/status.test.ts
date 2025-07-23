import type { ProjectManagerSDK } from '@project-manager/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateStatusCommand } from './status.ts'

// Mock the SDK
const mockSDK = {
  tickets: {
    updateStatus: vi.fn(),
  },
} as unknown as ProjectManagerSDK

// Mock the BaseCommand SDK property
vi.mock('../../lib/base-command.ts', () => ({
  BaseCommand: class {
    sdk = mockSDK
    log = vi.fn()
    error = vi.fn()
    warn = vi.fn()
  },
}))

describe('UpdateStatusCommand', () => {
  let command: UpdateStatusCommand
  let mockUpdatedTicket: any

  beforeEach(() => {
    const mockConfig = {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any
    command = new UpdateStatusCommand([], mockConfig)
    mockUpdatedTicket = {
      id: 'ticket-123',
      title: 'Test Ticket',
      description: 'Test Description',
      status: 'in_progress',
      priority: 'medium',
      type: 'task',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    // Reset mocks
    vi.clearAllMocks()

    // Setup default successful response
    vi.mocked(mockSDK.tickets.updateStatus).mockResolvedValue(mockUpdatedTicket)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('execute', () => {
    it('should update ticket status to in_progress successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123', status: 'in_progress' }
      const flags = {}

      // Act
      const result = await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('ticket-123', 'in_progress')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-123 status updated to: in_progress')
      expect(result).toBeUndefined()
    })

    it('should update ticket status to completed successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-456', status: 'completed' }
      const flags = {}

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('ticket-456', 'completed')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-456 status updated to: completed')
    })

    it('should update ticket status to archived successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-789', status: 'archived' }
      const flags = {}

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('ticket-789', 'archived')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-789 status updated to: archived')
    })

    it('should update ticket status to pending successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-abc', status: 'pending' }
      const flags = {}

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('ticket-abc', 'pending')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-abc status updated to: pending')
    })

    it('should return JSON when json flag is set', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123', status: 'completed' }
      const flags = { json: true }

      // Act
      const result = await command.execute(args, flags)

      // Assert
      expect(result).toEqual(mockUpdatedTicket)
      expect(command.log).not.toHaveBeenCalled() // No log message in JSON mode
    })

    it('should call error when ticketId is empty', async () => {
      // Arrange
      const args = { ticketId: '', status: 'pending' }
      const flags = {}

      // Mock error method to throw to simulate oclif behavior
      vi.mocked(command.error).mockImplementation(() => {
        throw new Error('Command error')
      })

      // Act & Assert
      await expect(command.execute(args, flags)).rejects.toThrow('Command error')
      expect(command.error).toHaveBeenCalledWith('Ticket ID is required')
    })

    it('should call error when status is empty', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123', status: '' }
      const flags = {}

      // Mock error method to throw to simulate oclif behavior
      vi.mocked(command.error).mockImplementation(() => {
        throw new Error('Command error')
      })

      // Act & Assert
      await expect(command.execute(args, flags)).rejects.toThrow('Command error')
      expect(command.error).toHaveBeenCalledWith('Status is required')
    })

    describe('input validation boundary tests', () => {
      it('should handle very long ticket ID', async () => {
        // Arrange
        const longTicketId = `ticket-${'a'.repeat(100)}`
        const args = { ticketId: longTicketId, status: 'pending' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith(longTicketId, 'pending')
      })

      it('should handle special characters in ticket ID', async () => {
        // Arrange
        const specialTicketId = 'ticket-@#$%^&*()'
        const args = { ticketId: specialTicketId, status: 'in_progress' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith(specialTicketId, 'in_progress')
      })

      it('should handle Unicode characters in ticket ID', async () => {
        // Arrange
        const args = { ticketId: 'チケット-123', status: 'completed' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('チケット-123', 'completed')
      })

      it('should handle minimum valid ticket ID', async () => {
        // Arrange
        const args = { ticketId: '1', status: 'pending' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('1', 'pending')
      })
    })

    describe('error handling scenarios', () => {
      it('should handle ticket not found errors', async () => {
        // Arrange
        const args = { ticketId: 'nonexistent-ticket', status: 'pending' }
        const flags = {}
        // Create a mock TicketNotFoundError using proper prototype chain
        class MockTicketNotFoundError extends Error {
          constructor(ticketId: string) {
            super(`Ticket with ID '${ticketId}' not found`)
            this.name = 'TicketNotFoundError'
          }
        }
        const notFoundError = new MockTicketNotFoundError('nonexistent-ticket')
        vi.mocked(mockSDK.tickets.updateStatus).mockRejectedValue(notFoundError)
        vi.mocked(command.error).mockImplementation(() => {
          throw new Error('Command error')
        })

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow(
          "Ticket with ID 'nonexistent-ticket' not found"
        )
        expect(command.error).not.toHaveBeenCalled()
      })

      it('should handle invalid status errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', status: 'invalid_status' }
        const flags = {}
        // Create a mock TicketValidationError using proper prototype chain
        class MockTicketValidationError extends Error {
          constructor(message: string) {
            super(message)
            this.name = 'TicketValidationError'
          }
        }
        const invalidStatusError = new MockTicketValidationError(
          'Invalid status: invalid_status. Valid values are: pending, in_progress, completed, archived'
        )
        vi.mocked(mockSDK.tickets.updateStatus).mockRejectedValue(invalidStatusError)
        vi.mocked(command.error).mockImplementation(() => {
          throw new Error('Command error')
        })

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow(
          'Invalid status: invalid_status. Valid values are: pending, in_progress, completed, archived'
        )
        expect(command.error).not.toHaveBeenCalled()
      })

      it('should re-throw other SDK errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', status: 'pending' }
        const flags = {}
        const otherError = new Error('Network error')
        vi.mocked(mockSDK.tickets.updateStatus).mockRejectedValue(otherError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Network error')
      })

      it('should handle validation errors from SDK', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', status: 'pending' }
        const flags = {}
        const validationError = new Error('Validation failed')
        vi.mocked(mockSDK.tickets.updateStatus).mockRejectedValue(validationError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Validation failed')
      })

      it('should handle network errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', status: 'pending' }
        const flags = {}
        const networkError = new Error('Network unavailable')
        vi.mocked(mockSDK.tickets.updateStatus).mockRejectedValue(networkError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Network unavailable')
      })
    })

    describe('status value tests', () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'archived']

      validStatuses.forEach(status => {
        it(`should handle valid status: ${status}`, async () => {
          // Arrange
          const args = { ticketId: 'ticket-123', status }
          const flags = {}

          // Act
          await command.execute(args, flags)

          // Assert
          expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('ticket-123', status)
          expect(command.log).toHaveBeenCalledWith(`Ticket ticket-123 status updated to: ${status}`)
        })
      })

      it('should handle case-sensitive status values', async () => {
        // Arrange - testing that case matters
        const args = { ticketId: 'ticket-123', status: 'PENDING' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert - Should pass through case as-is to SDK for validation
        expect(mockSDK.tickets.updateStatus).toHaveBeenCalledWith('ticket-123', 'PENDING')
      })
    })
  })

  describe('command metadata', () => {
    it('should have correct static properties', () => {
      expect(UpdateStatusCommand.description).toBe('Update ticket status')
      expect(UpdateStatusCommand.args.ticketId.required).toBe(true)
      expect(UpdateStatusCommand.args.status.required).toBe(true)
    })

    it('should have correct examples', () => {
      expect(UpdateStatusCommand.examples).toContain('pm update status ticket-123 in_progress')
      expect(UpdateStatusCommand.examples).toContain('pm update status ticket-456 completed')
    })
  })
})
