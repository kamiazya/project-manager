import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getArchiveTicketUseCase } from '../../utils/service-factory.ts'
import { QuickArchiveCommand } from './archive.ts'

// Mock the service factory
vi.mock('../../utils/service-factory.ts', () => ({
  getArchiveTicketUseCase: vi.fn(),
}))

describe('QuickArchiveCommand', () => {
  let command: QuickArchiveCommand
  let logSpy: ReturnType<typeof vi.spyOn>
  let mockArchiveTicketUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    command = new QuickArchiveCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})

    mockArchiveTicketUseCase = {
      execute: vi.fn(),
      ticketRepository: {} as any,
    } as any
    vi.mocked(getArchiveTicketUseCase).mockReturnValue(mockArchiveTicketUseCase as any)
  })

  it('should have correct command metadata', () => {
    expect(QuickArchiveCommand.description).toBe('Archive a ticket')
    expect(QuickArchiveCommand.examples).toEqual(['<%= config.bin %> <%= command.id %> abc123'])
    expect(QuickArchiveCommand.args.id).toBeDefined()
    expect(QuickArchiveCommand.args.id.description).toBe('Ticket ID')
    expect(QuickArchiveCommand.args.id.required).toBe(true)
  })

  describe('Happy Path', () => {
    it('should archive ticket with valid ID', async () => {
      const ticketId = 'abc12345'
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Archived ticket abc12345')
    })

    it('should archive ticket from completed status', async () => {
      const ticketId = 'completed123'
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Archived ticket completed123')
    })

    it('should handle different ticket IDs', async () => {
      const ticketId = 'archive123'
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Archived ticket archive123')
    })

    it('should handle archive timestamps', async () => {
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'timestamp123' })

      expect(logSpy).toHaveBeenCalledWith('Archived ticket timestamp123')
    })

    it('should handle different priority levels', async () => {
      const priorities = ['high', 'medium', 'low'] as const

      for (const priority of priorities) {
        mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

        await command.execute({ id: `${priority}123` })

        expect(logSpy).toHaveBeenCalledWith(`Archived ticket ${priority}123`)
      }
    })

    it('should handle different ticket types', async () => {
      const types = ['feature', 'bug', 'task'] as const

      for (const type of types) {
        mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

        await command.execute({ id: `${type}123` })

        expect(logSpy).toHaveBeenCalledWith(`Archived ticket ${type}123`)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle ticket not found errors', async () => {
      const notFoundError = new Error('Ticket not found: xyz99999')
      notFoundError.name = 'TicketNotFoundError'

      mockArchiveTicketUseCase.execute.mockRejectedValue(notFoundError)

      await expect(command.execute({ id: 'xyz99999' })).rejects.toThrow(
        'Ticket not found: xyz99999'
      )

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'xyz99999',
        })
      )
    })

    it('should handle invalid status transition errors', async () => {
      const transitionError = new Error('Cannot transition from pending to archived')
      transitionError.name = 'TicketValidationError'

      mockArchiveTicketUseCase.execute.mockRejectedValue(transitionError)

      await expect(command.execute({ id: 'pending123' })).rejects.toThrow(
        'Cannot transition from pending to archived'
      )

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'pending123',
        })
      )
    })

    it('should handle archiving already archived ticket', async () => {
      const alreadyArchivedError = new Error('Cannot transition from archived to archived')
      alreadyArchivedError.name = 'TicketValidationError'

      mockArchiveTicketUseCase.execute.mockRejectedValue(alreadyArchivedError)

      await expect(command.execute({ id: 'archived123' })).rejects.toThrow(
        'Cannot transition from archived to archived'
      )
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Failed to save ticket to storage')
      storageError.name = 'StorageError'

      mockArchiveTicketUseCase.execute.mockRejectedValue(storageError)

      await expect(command.execute({ id: 'storage123' })).rejects.toThrow(
        'Failed to save ticket to storage'
      )
    })

    it('should handle concurrent modification errors', async () => {
      const concurrencyError = new Error('Ticket was modified by another process')
      concurrencyError.name = 'ConcurrencyError'

      mockArchiveTicketUseCase.execute.mockRejectedValue(concurrencyError)

      await expect(command.execute({ id: 'concurrent123' })).rejects.toThrow(
        'Ticket was modified by another process'
      )
    })

    it('should handle service factory initialization errors', async () => {
      vi.mocked(getArchiveTicketUseCase).mockImplementation(() => {
        throw new Error('Service factory initialization failed')
      })

      await expect(command.execute({ id: 'factory123' })).rejects.toThrow(
        'Service factory initialization failed'
      )
    })
  })

  describe('Input Validation', () => {
    it('should handle special characters in ticket ID', async () => {
      const specialId = 'tick3t-#123'
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: specialId })

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: specialId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Archived ticket ${specialId}`)
    })

    it('should handle Unicode characters in ticket ID', async () => {
      const unicodeId = 'チケット456'
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: unicodeId })

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: unicodeId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Archived ticket ${unicodeId}`)
    })

    it('should handle maximum length ticket ID', async () => {
      const longId = 'a'.repeat(255) // Very long ID
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: longId })

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: longId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Archived ticket ${longId}`)
    })
  })

  describe('Command Integration', () => {
    it('should integrate with BaseCommand properly', async () => {
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'base123' })

      expect(getArchiveTicketUseCase).toHaveBeenCalled()
      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith('Archived ticket base123')
    })

    it('should handle command lifecycle correctly', async () => {
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'lifecycle123' })

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lifecycle123',
        })
      )
    })
  })

  describe('Performance and Concurrency', () => {
    it('should complete within reasonable time', async () => {
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      const startTime = Date.now()
      await command.execute({ id: 'perf123' })
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent archives', async () => {
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      // Execute multiple archives concurrently
      const promises = [
        command.execute({ id: 'concurrent123' }),
        command.execute({ id: 'concurrent124' }),
        command.execute({ id: 'concurrent125' }),
      ]

      await Promise.all(promises)

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid sequential archives', async () => {
      mockArchiveTicketUseCase.execute.mockResolvedValue(undefined)

      // Execute multiple archives rapidly in sequence
      for (let i = 0; i < 5; i++) {
        await command.execute({ id: `rapid${i}` })
      }

      expect(mockArchiveTicketUseCase.execute).toHaveBeenCalledTimes(5)
    })
  })
})
