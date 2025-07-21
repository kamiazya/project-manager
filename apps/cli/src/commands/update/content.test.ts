import type { ProjectManagerSDK } from '@project-manager/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateContentCommand } from './content.ts'

// Mock the SDK
const mockSDK = {
  tickets: {
    updateContent: vi.fn(),
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

describe('UpdateContentCommand', () => {
  let command: UpdateContentCommand
  let mockUpdatedTicket: any

  beforeEach(() => {
    command = new UpdateContentCommand([], {})
    mockUpdatedTicket = {
      id: 'ticket-123',
      title: 'Updated Ticket Title',
      description: 'Updated Description',
      status: 'pending',
      priority: 'high',
      type: 'feature',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    // Reset mocks
    vi.clearAllMocks()

    // Setup default successful response
    vi.mocked(mockSDK.tickets.updateContent).mockResolvedValue(mockUpdatedTicket)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('execute', () => {
    it('should update ticket title successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123' }
      const flags = { title: 'New Title' }

      // Act
      const result = await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
        id: 'ticket-123',
        title: 'New Title',
        description: undefined,
      })
      expect(command.log).toHaveBeenCalledWith('Ticket ticket-123 title updated successfully.')
      expect(result).toBeUndefined()
    })

    it('should update ticket description successfully', async () => {
      // Arrange
      const args = { ticketId: 'ticket-456' }
      const flags = { description: 'New Description' }

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
        id: 'ticket-456',
        title: undefined,
        description: 'New Description',
      })
      expect(command.log).toHaveBeenCalledWith(
        'Ticket ticket-456 description updated successfully.'
      )
    })

    it('should update both title and description', async () => {
      // Arrange
      const args = { ticketId: 'ticket-789' }
      const flags = {
        title: 'Updated Title',
        description: 'Updated Description',
      }

      // Act
      await command.execute(args, flags)

      // Assert
      expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
        id: 'ticket-789',
        title: 'Updated Title',
        description: 'Updated Description',
      })
      expect(command.log).toHaveBeenCalledWith(
        'Ticket ticket-789 title and description updated successfully.'
      )
    })

    it('should return JSON when json flag is set', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123' }
      const flags = { title: 'New Title', json: true }

      // Act
      const result = await command.execute(args, flags)

      // Assert
      expect(result).toEqual(mockUpdatedTicket)
      expect(command.log).not.toHaveBeenCalled() // No log message in JSON mode
    })

    it('should call error when ticketId is empty', async () => {
      // Arrange
      const args = { ticketId: '' }
      const flags = { title: 'New Title' }

      // Mock error method to throw to simulate oclif behavior
      vi.mocked(command.error).mockImplementation(() => {
        throw new Error('Command error')
      })

      // Act & Assert
      await expect(command.execute(args, flags)).rejects.toThrow('Command error')
      expect(command.error).toHaveBeenCalledWith('Ticket ID is required')
    })

    it('should call error when neither title nor description is provided', async () => {
      // Arrange
      const args = { ticketId: 'ticket-123' }
      const flags = {}

      // Mock error method to throw to simulate oclif behavior
      vi.mocked(command.error).mockImplementation(() => {
        throw new Error('Command error')
      })

      // Act & Assert
      await expect(command.execute(args, flags)).rejects.toThrow('Command error')
      expect(command.error).toHaveBeenCalledWith(
        'At least one of --title or --description must be provided'
      )
    })

    describe('input validation boundary tests', () => {
      it('should handle very long ticket ID', async () => {
        // Arrange
        const longTicketId = 'ticket-' + 'a'.repeat(100)
        const args = { ticketId: longTicketId }
        const flags = { title: 'New Title' }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: longTicketId,
          title: 'New Title',
          description: undefined,
        })
      })

      it('should handle very long title', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const longTitle = 'A'.repeat(200)
        const flags = { title: longTitle }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: 'ticket-123',
          title: longTitle,
          description: undefined,
        })
      })

      it('should handle very long description', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const longDescription = 'B'.repeat(2000)
        const flags = { description: longDescription }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: 'ticket-123',
          title: undefined,
          description: longDescription,
        })
      })

      it('should handle special characters in inputs', async () => {
        // Arrange
        const specialTicketId = 'ticket-@#$%^&*()'
        const specialTitle = 'Title with special chars: <>?{}|\\:";\'[]'
        const specialDescription = 'Description\nwith\nnewlines\tand\ttabs'
        const args = { ticketId: specialTicketId }
        const flags = {
          title: specialTitle,
          description: specialDescription,
        }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: specialTicketId,
          title: specialTitle,
          description: specialDescription,
        })
      })

      it('should handle Unicode characters', async () => {
        // Arrange
        const args = { ticketId: 'チケット-123' }
        const flags = {
          title: 'タイトル 🎉 ñørmål tëxt',
          description: '説明 with émojis 🚀',
        }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: 'チケット-123',
          title: 'タイトル 🎉 ñørmål tëxt',
          description: '説明 with émojis 🚀',
        })
      })

      it('should handle empty string values', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = {
          title: '',
          description: '',
        }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: 'ticket-123',
          title: '',
          description: '',
        })
      })

      it('should handle whitespace-only values', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = {
          title: '   ',
          description: '\t\n  \t',
        }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: 'ticket-123',
          title: '   ',
          description: '\t\n  \t',
        })
      })
    })

    describe('error handling scenarios', () => {
      it('should handle ticket not found errors', async () => {
        // Arrange
        const args = { ticketId: 'nonexistent-ticket' }
        const flags = { title: 'New Title' }
        const notFoundError = new Error('Ticket not found')
        vi.mocked(mockSDK.tickets.updateContent).mockRejectedValue(notFoundError)
        vi.mocked(command.error).mockImplementation(() => {
          throw new Error('Command error')
        })

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Command error')
        expect(command.error).toHaveBeenCalledWith('Ticket nonexistent-ticket not found')
      })

      it('should re-throw other SDK errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { title: 'New Title' }
        const otherError = new Error('Network error')
        vi.mocked(mockSDK.tickets.updateContent).mockRejectedValue(otherError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Network error')
      })

      it('should handle validation errors from SDK', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { title: 'A'.repeat(201) } // Assuming title too long
        const validationError = new Error('Title too long')
        vi.mocked(mockSDK.tickets.updateContent).mockRejectedValue(validationError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Title too long')
      })

      it('should handle network errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { title: 'New Title' }
        const networkError = new Error('Network unavailable')
        vi.mocked(mockSDK.tickets.updateContent).mockRejectedValue(networkError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Network unavailable')
      })

      it('should handle file system errors', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { title: 'New Title' }
        const fsError = new Error('Permission denied')
        vi.mocked(mockSDK.tickets.updateContent).mockRejectedValue(fsError)

        // Act & Assert
        await expect(command.execute(args, flags)).rejects.toThrow('Permission denied')
      })
    })

    describe('message formatting tests', () => {
      it('should format message correctly for title only', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { title: 'New Title' }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(command.log).toHaveBeenCalledWith('Ticket ticket-123 title updated successfully.')
      })

      it('should format message correctly for description only', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { description: 'New Description' }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(command.log).toHaveBeenCalledWith(
          'Ticket ticket-123 description updated successfully.'
        )
      })

      it('should format message correctly for both title and description', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { title: 'New Title', description: 'New Description' }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(command.log).toHaveBeenCalledWith(
          'Ticket ticket-123 title and description updated successfully.'
        )
      })
    })

    describe('edge cases', () => {
      it('should handle minimum valid ticket ID', async () => {
        // Arrange
        const args = { ticketId: '1' }
        const flags = { title: 'Updated' }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: '1',
          title: 'Updated',
          description: undefined,
        })
      })

      it('should handle title with only flag provided', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { title: 'Only Title' }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: 'ticket-123',
          title: 'Only Title',
          description: undefined,
        })
      })

      it('should handle description with only flag provided', async () => {
        // Arrange
        const args = { ticketId: 'ticket-123' }
        const flags = { description: 'Only Description' }

        // Act
        await command.execute(args, flags)

        // Assert
        expect(mockSDK.tickets.updateContent).toHaveBeenCalledWith({
          id: 'ticket-123',
          title: undefined,
          description: 'Only Description',
        })
      })
    })
  })

  describe('command metadata', () => {
    it('should have correct static properties', () => {
      expect(UpdateContentCommand.description).toBe('Update ticket content (title and description)')
      expect(UpdateContentCommand.args.ticketId.required).toBe(true)
    })

    it('should have correct flag definitions', () => {
      expect(UpdateContentCommand.flags.title.char).toBe('t')
      expect(UpdateContentCommand.flags.description.char).toBe('d')
    })

    it('should have correct examples', () => {
      expect(UpdateContentCommand.examples).toContain(
        'pm update content ticket-123 --title "New title"'
      )
      expect(UpdateContentCommand.examples).toContain(
        'pm update content ticket-456 --description "Updated description"'
      )
      expect(UpdateContentCommand.examples).toContain(
        'pm update content ticket-789 -t "Bug fix" -d "Fixed the login issue"'
      )
    })
  })
})
