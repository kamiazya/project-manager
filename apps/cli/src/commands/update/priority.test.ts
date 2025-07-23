import type { ProjectManagerSDK } from '@project-manager/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdatePriorityCommand } from './priority.ts'

// Mock the SDK
const mockSDK = {
  tickets: {
    updatePriority: vi.fn(),
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

describe('UpdatePriorityCommand', () => {
  let command: UpdatePriorityCommand
  let mockUpdatedTicket: any

  beforeEach(() => {
    const mockConfig = {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any
    command = new UpdatePriorityCommand([], mockConfig)
    mockUpdatedTicket = {
      id: 'ticket-123',
      title: 'Test Ticket',
      description: 'Test Description',
      status: 'pending',
      priority: 'high',
      type: 'task',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    // Reset mocks
    vi.clearAllMocks()

    // Setup default successful response
    vi.mocked(mockSDK.tickets.updatePriority).mockResolvedValue(mockUpdatedTicket)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('execute', () => {
    it('should update ticket priority to high successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123', priority: 'high' }
      const flags = {}

      // Act
      const result = await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-123', 'high')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-123 priority updated to: high')
      expect(result).toBeUndefined()
    })

    it('should update ticket priority to medium successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-456', priority: 'medium' }
      const flags = {}

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-456', 'medium')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-456 priority updated to: medium')
    })

    it('should update ticket priority to low successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-789', priority: 'low' }
      const flags = {}

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-789', 'low')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-789 priority updated to: low')
    })

    it('should return JSON when json flag is set', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123', priority: 'high' }
      const flags = { json: true }

      // Act
      const result = await command.execute(args, flags)

      // Assert
      expect(result).toEqual(mockUpdatedTicket)
      expect(command.log).not.toHaveBeenCalled() // No log message in JSON mode
    })

    it('should call error when ticketId is empty', async () => {
      // Arrange
      const args = { ticketId: '', priority: 'high' }
      const flags = {}

      // Mock error method to throw to simulate oclif behavior
      vi.mocked(command.error).mockImplementation(() => {
        throw new Error('Command error')
      })

      // Act & Assert
      await expect(command.execute(args, flags)).rejects.toThrow('Command error')
      expect(command.error).toHaveBeenCalledWith('Ticket ID is required')
    })

    it('should call error when priority is empty', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123', priority: '' }
      const flags = {}

      // Mock error method to throw to simulate oclif behavior
      vi.mocked(command.error).mockImplementation(() => {
        throw new Error('Command error')
      })

      // Act & Assert
      await expect(command.execute(args, flags)).rejects.toThrow('Command error')
      expect(command.error).toHaveBeenCalledWith('Priority is required')
    })

    describe('input validation boundary tests', () => {
      it('should handle very long ticket ID', async () => {
        // Arrange
        const longTicketId = `ticket-${'a'.repeat(100)}`
        const args = { ticketId: longTicketId, priority: 'high' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith(longTicketId, 'high')
      })

      it('should handle special characters in ticket ID', async () => {
        // Arrange
        const specialTicketId = 'ticket-@#$%^&*()'
        const args = { ticketId: specialTicketId, priority: 'medium' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith(specialTicketId, 'medium')
      })

      it('should handle Unicode characters in ticket ID', async () => {
        // Arrange
        const args = { ticketId: 'チケット-123', priority: 'low' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('チケット-123', 'low')
      })

      it('should handle minimum valid ticket ID', async () => {
        // Arrange
        const args = { ticketId: '1', priority: 'high' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('1', 'high')
      })
    })

    describe('error handling scenarios', () => {
      it('should handle ticket not found errors', async () => {
        // Arrange
        const args = { ticketId: 'nonexistent-ticket', priority: 'high' }
        const flags = {}
        // Create a mock TicketNotFoundError using proper prototype chain
        class MockTicketNotFoundError extends Error {
          constructor(ticketId: string) {
            super(`Ticket with ID '${ticketId}' not found`)
            this.name = 'TicketNotFoundError'
          }
        }
        const notFoundError = new MockTicketNotFoundError('nonexistent-ticket')
        vi.mocked(mockSDK.tickets.updatePriority).mockRejectedValue(notFoundError)
        vi.mocked(command.error).mockImplementation(() => {
          throw new Error('Command error')
        })

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow(
          "Ticket with ID 'nonexistent-ticket' not found"
        )
        expect(command.error).not.toHaveBeenCalled()
      })

      it('should handle invalid priority errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: 'invalid_priority' }
        const flags = {}
        // Create a mock TicketValidationError using proper prototype chain
        class MockTicketValidationError extends Error {
          constructor(message: string) {
            super(message)
            this.name = 'TicketValidationError'
          }
        }
        const invalidPriorityError = new MockTicketValidationError(
          'Invalid priority: invalid_priority. Valid values are: high, medium, low'
        )
        vi.mocked(mockSDK.tickets.updatePriority).mockRejectedValue(invalidPriorityError)
        vi.mocked(command.error).mockImplementation(() => {
          throw new Error('Command error')
        })

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow(
          'Invalid priority: invalid_priority. Valid values are: high, medium, low'
        )
        expect(command.error).not.toHaveBeenCalled()
      })

      it('should re-throw other SDK errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: 'high' }
        const flags = {}
        const otherError = new Error('Network error')
        vi.mocked(mockSDK.tickets.updatePriority).mockRejectedValue(otherError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Network error')
      })

      it('should handle validation errors from SDK', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: 'high' }
        const flags = {}
        const validationError = new Error('Validation failed')
        vi.mocked(mockSDK.tickets.updatePriority).mockRejectedValue(validationError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Validation failed')
      })

      it('should handle network errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: 'high' }
        const flags = {}
        const networkError = new Error('Network unavailable')
        vi.mocked(mockSDK.tickets.updatePriority).mockRejectedValue(networkError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Network unavailable')
      })

      it('should handle file system errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: 'high' }
        const flags = {}
        const fsError = new Error('Permission denied')
        vi.mocked(mockSDK.tickets.updatePriority).mockRejectedValue(fsError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Permission denied')
      })
    })

    describe('priority value tests', () => {
      const validPriorities = ['high', 'medium', 'low']

      validPriorities.forEach(priority => {
        it(`should handle valid priority: ${priority}`, async () => {
          // Arrange
          const args = { ticketId: 'ticket-123', priority }
          const flags = {}

          // Act
          await command.execute(args, flags)

          // Assert
          expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-123', priority)
          expect(command.log).toHaveBeenCalledWith(
            `Ticket ticket-123 priority updated to: ${priority}`
          )
        })
      })

      it('should handle case-sensitive priority values', async () => {
        // Arrange - testing that case matters
        const args = { ticketId: 'ticket-123', priority: 'HIGH' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert - Should pass through case as-is to SDK for validation
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-123', 'HIGH')
      })

      it('should handle priority with whitespace', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: ' high ' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert - Should pass through as-is for SDK to handle
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-123', ' high ')
      })
    })

    describe('edge cases', () => {
      it('should handle numeric priority values', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: '1' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-123', '1')
      })

      it('should handle special character priority values', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: 'high!' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-123', 'high!')
      })

      it('should handle Unicode priority values', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123', priority: '高' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updatePriority).toHaveBeenCalledWith('ticket-123', '高')
      })
    })
  })

  describe('command metadata', () => {
    it('should have correct static properties', () => {
      expect(UpdatePriorityCommand.description).toBe('Update ticket priority')
      expect(UpdatePriorityCommand.args.ticketId.required).toBe(true)
      expect(UpdatePriorityCommand.args.priority.required).toBe(true)
    })

    it('should have correct examples', () => {
      expect(UpdatePriorityCommand.examples).toContain('pm update priority ticket-123 high')
      expect(UpdatePriorityCommand.examples).toContain('pm update priority ticket-456 low')
    })
  })
})
