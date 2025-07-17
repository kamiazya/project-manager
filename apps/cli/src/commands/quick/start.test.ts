import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getStartTicketProgressUseCase } from '../../utils/service-factory.ts'
import { QuickStartCommand } from './start.ts'

// Mock the service factory
vi.mock('../../utils/service-factory.ts', () => ({
  getStartTicketProgressUseCase: vi.fn(),
}))

describe('QuickStartCommand', () => {
  let command: QuickStartCommand
  let logSpy: ReturnType<typeof vi.spyOn>
  let mockStartTicketProgressUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    command = new QuickStartCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})

    mockStartTicketProgressUseCase = {
      execute: vi.fn(),
      ticketRepository: {} as any,
    } as any
    vi.mocked(getStartTicketProgressUseCase).mockReturnValue(mockStartTicketProgressUseCase as any)
  })

  it('should have correct command metadata', () => {
    expect(QuickStartCommand.description).toBe(
      'Start working on a ticket (set status to in_progress)'
    )
    expect(QuickStartCommand.examples).toEqual(['<%= config.bin %> <%= command.id %> abc123'])
    expect(QuickStartCommand.args.id).toBeDefined()
    expect(QuickStartCommand.args.id.description).toBe('Ticket ID')
    expect(QuickStartCommand.args.id.required).toBe(true)
  })

  describe('Happy Path', () => {
    it('should start ticket progress with valid ID', async () => {
      const ticketId = 'abc12345'
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Started working on ticket abc12345')
    })

    it('should handle different ticket IDs', async () => {
      const ticketId = 'alias123'
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: ticketId })

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ticketId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith('Started working on ticket alias123')
    })

    it('should handle timestamp tests', async () => {
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'timestamp123' })

      expect(logSpy).toHaveBeenCalledWith('Started working on ticket timestamp123')
    })

    it('should handle different priority levels', async () => {
      const priorities = ['high', 'medium', 'low'] as const

      for (const priority of priorities) {
        mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

        await command.execute({ id: `${priority}123` })

        expect(logSpy).toHaveBeenCalledWith(`Started working on ticket ${priority}123`)
      }
    })

    it('should handle different ticket types', async () => {
      const types = ['feature', 'bug', 'task'] as const

      for (const type of types) {
        mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

        await command.execute({ id: `${type}123` })

        expect(logSpy).toHaveBeenCalledWith(`Started working on ticket ${type}123`)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle ticket not found errors', async () => {
      const notFoundError = new Error('Ticket not found: xyz99999')
      notFoundError.name = 'TicketNotFoundError'

      mockStartTicketProgressUseCase.execute.mockRejectedValue(notFoundError)

      await expect(command.execute({ id: 'xyz99999' })).rejects.toThrow(
        'Ticket not found: xyz99999'
      )

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'xyz99999',
        })
      )
    })

    it('should handle invalid status transition errors', async () => {
      const transitionError = new Error('Cannot transition from completed to in_progress')
      transitionError.name = 'TicketValidationError'

      mockStartTicketProgressUseCase.execute.mockRejectedValue(transitionError)

      await expect(command.execute({ id: 'completed123' })).rejects.toThrow(
        'Cannot transition from completed to in_progress'
      )

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'completed123',
        })
      )
    })

    it('should handle already in progress ticket', async () => {
      const alreadyInProgressError = new Error('Cannot transition from in_progress to in_progress')
      alreadyInProgressError.name = 'TicketValidationError'

      mockStartTicketProgressUseCase.execute.mockRejectedValue(alreadyInProgressError)

      await expect(command.execute({ id: 'inprogress123' })).rejects.toThrow(
        'Cannot transition from in_progress to in_progress'
      )
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Failed to save ticket to storage')
      storageError.name = 'StorageError'

      mockStartTicketProgressUseCase.execute.mockRejectedValue(storageError)

      await expect(command.execute({ id: 'storage123' })).rejects.toThrow(
        'Failed to save ticket to storage'
      )
    })

    it('should handle concurrent modification errors', async () => {
      const concurrencyError = new Error('Ticket was modified by another process')
      concurrencyError.name = 'ConcurrencyError'

      mockStartTicketProgressUseCase.execute.mockRejectedValue(concurrencyError)

      await expect(command.execute({ id: 'concurrent123' })).rejects.toThrow(
        'Ticket was modified by another process'
      )
    })

    it('should handle service factory initialization errors', async () => {
      vi.mocked(getStartTicketProgressUseCase).mockImplementation(() => {
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
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: specialId })

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: specialId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Started working on ticket ${specialId}`)
    })

    it('should handle Unicode characters in ticket ID', async () => {
      const unicodeId = 'チケット456'
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: unicodeId })

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: unicodeId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Started working on ticket ${unicodeId}`)
    })

    it('should handle maximum length ticket ID', async () => {
      const longId = 'a'.repeat(255) // Very long ID
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: longId })

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: longId,
        })
      )

      expect(logSpy).toHaveBeenCalledWith(`Started working on ticket ${longId}`)
    })
  })

  describe('Command Integration', () => {
    it('should integrate with BaseCommand properly', async () => {
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'base123' })

      expect(getStartTicketProgressUseCase).toHaveBeenCalled()
      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith('Started working on ticket base123')
    })

    it('should handle command lifecycle correctly', async () => {
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      await command.execute({ id: 'lifecycle123' })

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lifecycle123',
        })
      )
    })
  })

  describe('Performance and Concurrency', () => {
    it('should complete within reasonable time', async () => {
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      const startTime = Date.now()
      await command.execute({ id: 'perf123' })
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent starts', async () => {
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      // Execute multiple starts concurrently
      const promises = [
        command.execute({ id: 'concurrent123' }),
        command.execute({ id: 'concurrent124' }),
        command.execute({ id: 'concurrent125' }),
      ]

      await Promise.all(promises)

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid sequential starts', async () => {
      mockStartTicketProgressUseCase.execute.mockResolvedValue(undefined)

      // Execute multiple starts rapidly in sequence
      for (let i = 0; i < 5; i++) {
        await command.execute({ id: `rapid${i}` })
      }

      expect(mockStartTicketProgressUseCase.execute).toHaveBeenCalledTimes(5)
    })
  })
})
