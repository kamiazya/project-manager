import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCompleteTicketUseCase } from '../../utils/service-factory.ts'
import { QuickDoneCommand } from './done.ts'

// Mock the service factory
vi.mock('../../utils/service-factory.ts', () => ({
  getCompleteTicketUseCase: vi.fn(),
}))

describe('QuickDoneCommand', () => {
  let command: QuickDoneCommand
  let logSpy: ReturnType<typeof vi.spyOn>
  let mockCompleteTicketUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    command = new QuickDoneCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})

    mockCompleteTicketUseCase = {
      execute: vi.fn(),
    }
    vi.mocked(getCompleteTicketUseCase).mockReturnValue(mockCompleteTicketUseCase)
  })

  it('should have correct command metadata', () => {
    expect(QuickDoneCommand.description).toBe('Mark ticket as completed')
    expect(QuickDoneCommand.examples).toEqual(['<%= config.bin %> <%= command.id %> abc123'])
    expect(QuickDoneCommand.args.id).toBeDefined()
    expect(QuickDoneCommand.args.id.description).toBe('Ticket ID')
    expect(QuickDoneCommand.args.id.required).toBe(true)
  })

  describe('Happy Path', () => {
    it('should mark ticket as completed with valid ID', async () => {
      const ticketId = 'abc12345'
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Completed ticket abc12345')
    })

    it('should complete ticket from in_progress status', async () => {
      const ticketId = 'inprog123'
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Completed ticket inprog123')
    })

    it('should handle different ticket IDs', async () => {
      const ticketId = 'alias123'
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Completed ticket alias123')
    })

    it('should handle completion timestamps', async () => {
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'timestamp123' })

      expect(logSpy).toHaveBeenCalledWith('Completed ticket timestamp123')
    })

    it('should handle different priority levels', async () => {
      const priorities = ['high', 'medium', 'low'] as const

      for (const priority of priorities) {
        mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

        await command.execute({ id: `${priority}123` })

        expect(logSpy).toHaveBeenCalledWith(`Completed ticket ${priority}123`)
      }
    })

    it('should handle different ticket types', async () => {
      const types = ['feature', 'bug', 'task'] as const

      for (const type of types) {
        mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

        await command.execute({ id: `${type}123` })

        expect(logSpy).toHaveBeenCalledWith(`Completed ticket ${type}123`)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle ticket not found errors', async () => {
      const notFoundError = new Error('Ticket not found: xyz99999')
      notFoundError.name = 'TicketNotFoundError'

      mockCompleteTicketUseCase.execute.mockRejectedValue(notFoundError)

      await expect(command.execute({ id: 'xyz99999' })).rejects.toThrow(
        'Ticket not found: xyz99999'
      )

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'xyz99999',
        })
      )
    })

    it('should handle invalid status transition errors', async () => {
      const transitionError = new Error('Cannot transition from archived to completed')
      transitionError.name = 'TicketValidationError'

      mockCompleteTicketUseCase.execute.mockRejectedValue(transitionError)

      await expect(command.execute({ id: 'archived123' })).rejects.toThrow(
        'Cannot transition from archived to completed'
      )

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'archived123',
        })
      )
    })

    it('should handle completing already completed ticket', async () => {
      const alreadyCompletedError = new Error('Cannot transition from completed to completed')
      alreadyCompletedError.name = 'TicketValidationError'

      mockCompleteTicketUseCase.execute.mockRejectedValue(alreadyCompletedError)

      await expect(command.execute({ id: 'completed123' })).rejects.toThrow(
        'Cannot transition from completed to completed'
      )
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Failed to save ticket to storage')
      storageError.name = 'StorageError'

      mockCompleteTicketUseCase.execute.mockRejectedValue(storageError)

      await expect(command.execute({ id: 'storage123' })).rejects.toThrow(
        'Failed to save ticket to storage'
      )
    })

    it('should handle concurrent modification errors', async () => {
      const concurrencyError = new Error('Ticket was modified by another process')
      concurrencyError.name = 'ConcurrencyError'

      mockCompleteTicketUseCase.execute.mockRejectedValue(concurrencyError)

      await expect(command.execute({ id: 'concurrent123' })).rejects.toThrow(
        'Ticket was modified by another process'
      )
    })

    it('should handle service factory initialization errors', async () => {
      vi.mocked(getCompleteTicketUseCase).mockImplementation(() => {
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
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: specialId })

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: specialId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Completed ticket ${specialId}`)
    })

    it('should handle Unicode characters in ticket ID', async () => {
      const unicodeId = 'チケット456'
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: unicodeId })

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: unicodeId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Completed ticket ${unicodeId}`)
    })

    it('should handle maximum length ticket ID', async () => {
      const longId = 'a'.repeat(255) // Very long ID
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: longId })

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: longId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Completed ticket ${longId}`)
    })
  })

  describe('Command Integration', () => {
    it('should integrate with BaseCommand properly', async () => {
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'base123' })

      expect(getCompleteTicketUseCase).toHaveBeenCalled()
      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith('Completed ticket base123')
    })

    it('should handle command lifecycle correctly', async () => {
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'lifecycle123' })

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lifecycle123',
        })
      )
    })
  })

  describe('Performance and Concurrency', () => {
    it('should complete within reasonable time', async () => {
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      const startTime = Date.now()
      await command.execute({ id: 'perf123' })
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent completions', async () => {
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      // Execute multiple completions concurrently
      const promises = [
        command.execute({ id: 'concurrent123' }),
        command.execute({ id: 'concurrent124' }),
        command.execute({ id: 'concurrent125' }),
      ]

      await Promise.all(promises)

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid sequential completions', async () => {
      mockCompleteTicketUseCase.execute.mockResolvedValue(undefined)

      // Execute multiple completions rapidly in sequence
      for (let i = 0; i < 5; i++) {
        await command.execute({ id: `rapid${i}` })
      }

      expect(mockCompleteTicketUseCase.execute).toHaveBeenCalledTimes(5)
    })
  })
})
