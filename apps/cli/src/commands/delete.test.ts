import type { ProjectManagerSDK } from '@project-manager/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteCommand } from './delete.ts'

// Mock inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
}))

// Mock the SDK
const mockSDK = {
  tickets: {
    getById: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as ProjectManagerSDK

// Mock the BaseCommand SDK property
vi.mock('../lib/base-command.ts', () => ({
  BaseCommand: class {
    sdk = mockSDK
    log = vi.fn()
    error = vi.fn()
  },
}))

// Import the mocked confirm function
import { confirm } from '@inquirer/prompts'

describe('DeleteCommand', () => {
  let command: DeleteCommand
  let mockTicket: any

  beforeEach(() => {
    const mockConfig = {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any
    command = new DeleteCommand([], mockConfig)
    mockTicket = {
      id: 'ticket-123',
      title: 'Test Ticket to Delete',
      description: 'Test Description',
      status: 'pending',
      priority: 'high',
      type: 'feature',
    }

    // Reset mocks
    vi.clearAllMocks()

    // Setup default successful responses
    vi.mocked(mockSDK.tickets.getById).mockResolvedValue(mockTicket)
    vi.mocked(mockSDK.tickets.delete).mockResolvedValue(undefined)
    vi.mocked(confirm).mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('execute', () => {
    it('should delete ticket successfully with confirmation', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123' }
      const flags = {}

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.getById).toHaveBeenCalledWith('ticket-123')
      expect(confirm).toHaveBeenCalledWith({
        message: 'Are you sure you want to delete ticket "Test Ticket to Delete"?',
        default: false,
      })
      expect(mockSDK.tickets.delete).toHaveBeenCalledWith('ticket-123')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-123 deleted successfully.')
    })

    it('should delete ticket without confirmation when force flag is used', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123' }
      const flags = { force: true }

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.getById).toHaveBeenCalledWith('ticket-123')
      expect(confirm).not.toHaveBeenCalled()
      expect(mockSDK.tickets.delete).toHaveBeenCalledWith('ticket-123')
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-123 deleted successfully.')
    })

    it('should cancel deletion when user declines confirmation', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123' }
      const flags = {}
      vi.mocked(confirm).mockResolvedValue(false)

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.getById).toHaveBeenCalledWith('ticket-123')
      expect(confirm).toHaveBeenCalled()
      expect(mockSDK.tickets.delete).not.toHaveBeenCalled()
      expect(command.log).toHaveBeenCalledWith('Deletion cancelled.')
    })

    it('should show error when ticket is not found', async () => {
      // Arrange
      const args = { ticketId: 'nonexistent-ticket' }
      const flags = {}
      vi.mocked(mockSDK.tickets.getById).mockResolvedValue(null)

      // Mock error method to throw to simulate oclif behavior
      vi.mocked(command.error).mockImplementation(() => {
        throw new Error('Command error')
      })

      // Act & Assert
      await expect(command.execute(args, flags)).rejects.toThrow('Command error')
      expect(mockSDK.tickets.getById).toHaveBeenCalledWith('nonexistent-ticket')
      expect(command.error).toHaveBeenCalledWith('Ticket not found: nonexistent-ticket')
      expect(confirm).not.toHaveBeenCalled()
      expect(mockSDK.tickets.delete).not.toHaveBeenCalled()
    })

    describe('input validation boundary tests', () => {
      it('should handle very long ticket ID', async () => {
        // Arrange
        const longTicketId = `ticket-${'a'.repeat(100)}`
        const args = { ticketId: longTicketId }
        const flags = { force: true }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.getById).toHaveBeenCalledWith(longTicketId)
        expect(mockSDK.tickets.delete).toHaveBeenCalledWith(longTicketId)
      })

      it('should handle special characters in ticket ID', async () => {
        // Arrange
        const specialTicketId = 'ticket-@#$%^&*()'
        const args = { ticketId: specialTicketId }
        const flags = { force: true }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.getById).toHaveBeenCalledWith(specialTicketId)
        expect(mockSDK.tickets.delete).toHaveBeenCalledWith(specialTicketId)
      })

      it('should handle Unicode characters in ticket ID', async () => {
        // Arrange
        const unicodeTicketId = 'チケット-123'
        const args = { ticketId: unicodeTicketId }
        const flags = { force: true }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.getById).toHaveBeenCalledWith(unicodeTicketId)
        expect(mockSDK.tickets.delete).toHaveBeenCalledWith(unicodeTicketId)
      })

      it('should handle minimum valid ticket ID', async () => {
        // Arrange
        const minTicketId = '1'
        const args = { ticketId: minTicketId }
        const flags = { force: true }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.getById).toHaveBeenCalledWith(minTicketId)
        expect(mockSDK.tickets.delete).toHaveBeenCalledWith(minTicketId)
      })
    })

    describe('confirmation dialog tests', () => {
      it('should show correct confirmation message with ticket title', async () => {
        // Arrange
        const ticketWithLongTitle = {
          ...mockTicket,
          title: 'Very long ticket title that might be truncated in some UIs',
        }
        vi.mocked(mockSDK.tickets.getById).mockResolvedValue(ticketWithLongTitle)
        const args = { ticketId: 'ticket-123' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(confirm).toHaveBeenCalledWith({
          message:
            'Are you sure you want to delete ticket "Very long ticket title that might be truncated in some UIs"?',
          default: false,
        })
      })

      it('should handle ticket with special characters in title', async () => {
        // Arrange
        const ticketWithSpecialTitle = {
          ...mockTicket,
          title: 'Ticket with "quotes" and \'apostrophes\' & <tags>',
        }
        vi.mocked(mockSDK.tickets.getById).mockResolvedValue(ticketWithSpecialTitle)
        const args = { ticketId: 'ticket-123' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(confirm).toHaveBeenCalledWith({
          message:
            'Are you sure you want to delete ticket "Ticket with "quotes" and \'apostrophes\' & <tags>"?',
          default: false,
        })
      })

      it('should handle ticket with Unicode characters in title', async () => {
        // Arrange
        const ticketWithUnicodeTitle = {
          ...mockTicket,
          title: 'テストチケット 🎉 ñørmål tëxt',
        }
        vi.mocked(mockSDK.tickets.getById).mockResolvedValue(ticketWithUnicodeTitle)
        const args = { ticketId: 'ticket-123' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(confirm).toHaveBeenCalledWith({
          message: 'Are you sure you want to delete ticket "テストチケット 🎉 ñørmål tëxt"?',
          default: false,
        })
      })
    })

    describe('error handling scenarios', () => {
      it('should handle SDK getById errors gracefully', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = {}
        const sdkError = new Error('Failed to fetch ticket')
        vi.mocked(mockSDK.tickets.getById).mockRejectedValue(sdkError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Failed to fetch ticket')
        expect(mockSDK.tickets.getById).toHaveBeenCalledWith('ticket-123')
        expect(confirm).not.toHaveBeenCalled()
        expect(mockSDK.tickets.delete).not.toHaveBeenCalled()
      })

      it('should handle SDK delete errors gracefully', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { force: true }
        const deleteError = new Error('Failed to delete ticket')
        vi.mocked(mockSDK.tickets.delete).mockRejectedValue(deleteError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Failed to delete ticket')
        expect(mockSDK.tickets.getById).toHaveBeenCalledWith('ticket-123')
        expect(mockSDK.tickets.delete).toHaveBeenCalledWith('ticket-123')
      })

      it('should handle confirmation dialog errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = {}
        const confirmError = new Error('Failed to show confirmation')
        vi.mocked(confirm).mockRejectedValue(confirmError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Failed to show confirmation')
        expect(mockSDK.tickets.getById).toHaveBeenCalledWith('ticket-123')
        expect(confirm).toHaveBeenCalled()
        expect(mockSDK.tickets.delete).not.toHaveBeenCalled()
      })

      it('should handle network errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { force: true }
        const networkError = new Error('Network unavailable')
        vi.mocked(mockSDK.tickets.getById).mockRejectedValue(networkError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Network unavailable')
      })

      it('should handle file system errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { force: true }
        const fsError = new Error('Permission denied')
        vi.mocked(mockSDK.tickets.delete).mockRejectedValue(fsError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Permission denied')
      })
    })

    describe('edge cases', () => {
      it('should handle ticket with empty title in confirmation', async () => {
        // Arrange
        const ticketWithEmptyTitle = {
          ...mockTicket,
          title: '',
        }
        vi.mocked(mockSDK.tickets.getById).mockResolvedValue(ticketWithEmptyTitle)
        const args = { ticketId: 'ticket-123' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(confirm).toHaveBeenCalledWith({
          message: 'Are you sure you want to delete ticket ""?',
          default: false,
        })
      })

      it('should handle ticket with undefined title', async () => {
        // Arrange
        const ticketWithUndefinedTitle = {
          ...mockTicket,
          title: undefined,
        }
        vi.mocked(mockSDK.tickets.getById).mockResolvedValue(ticketWithUndefinedTitle)
        const args = { ticketId: 'ticket-123' }
        const flags = {}

        // Act
        await command.execute(args, flags)

        // Assert
        expect(confirm).toHaveBeenCalledWith({
          message: 'Are you sure you want to delete ticket "undefined"?',
          default: false,
        })
      })

      it('should handle force flag with false value', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { force: false }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(confirm).toHaveBeenCalled() // Should still show confirmation
        expect(mockSDK.tickets.delete).toHaveBeenCalledWith('ticket-123')
      })
    })
  })

  describe('command metadata', () => {
    it('should have correct static properties', () => {
      expect(DeleteCommand.description).toBe('Delete a ticket')
      expect(DeleteCommand.aliases).toContain('rm')
      expect(DeleteCommand.args.ticketId.required).toBe(true)
    })

    it('should have correct flag definitions', () => {
      expect(DeleteCommand.flags.force.char).toBe('f')
    })
  })
})
