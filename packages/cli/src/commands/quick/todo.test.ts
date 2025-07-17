import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSearchTicketsUseCase } from '../../utils/service-factory.ts'
import { QuickTodoCommand } from './todo.ts'

// Mock the service factory
vi.mock('../../utils/service-factory.ts', () => ({
  getSearchTicketsUseCase: vi.fn(),
}))

// Mock the displayTickets function
vi.mock('../../lib/table-formatter.ts', () => ({
  displayTickets: vi.fn(),
}))

describe('QuickTodoCommand', () => {
  let command: QuickTodoCommand
  let logSpy: ReturnType<typeof vi.spyOn>
  let mockSearchTicketsUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    command = new QuickTodoCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})

    mockSearchTicketsUseCase = {
      execute: vi.fn(),
    }
    vi.mocked(getSearchTicketsUseCase).mockReturnValue(mockSearchTicketsUseCase)
  })

  it('should have correct command metadata', () => {
    expect(QuickTodoCommand.description).toBe('List pending tickets')
    expect(QuickTodoCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %>',
      '<%= config.bin %> <%= command.id %> --compact',
    ])
    expect(QuickTodoCommand.flags.compact).toBeDefined()
    expect(QuickTodoCommand.flags.compact.char).toBe('c')
    expect(QuickTodoCommand.flags.compact.description).toBe('Compact output format')
  })

  describe('Happy Path', () => {
    it('should list pending tickets', async () => {
      const mockTickets = [
        {
          id: 'todo123',
          title: 'Pending Ticket 1',
          description: 'First pending ticket',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'todo456',
          title: 'Pending Ticket 2',
          description: 'Second pending ticket',
          status: 'pending',
          priority: 'medium',
          type: 'feature',
          privacy: 'shareable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      await command.execute({}, { compact: false, json: false })

      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            status: 'pending',
          }),
        })
      )

      // Should call displayTickets with the tickets
      const { displayTickets } = await import('../../lib/table-formatter.ts')
      expect(displayTickets).toHaveBeenCalledWith(mockTickets, 'table', expect.any(Function), {
        sectionTitle: 'Pending Tickets:',
      })
    })

    it('should handle compact output format', async () => {
      const mockTickets = [
        {
          id: 'compact123',
          title: 'Compact Test Ticket',
          description: 'Testing compact format',
          status: 'pending',
          priority: 'low',
          type: 'task',
          privacy: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      await command.execute({}, { compact: true, json: false })

      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            status: 'pending',
          }),
        })
      )

      // Should call displayTickets with compact format
      const { displayTickets } = await import('../../lib/table-formatter.ts')
      expect(displayTickets).toHaveBeenCalledWith(mockTickets, 'compact', expect.any(Function), {
        sectionTitle: 'Pending Tickets:',
      })
    })

    it('should handle multiple pending tickets with different priorities', async () => {
      const mockTickets = [
        {
          id: 'high123',
          title: 'High Priority Task',
          description: 'Important task',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'medium123',
          title: 'Medium Priority Task',
          description: 'Normal task',
          status: 'pending',
          priority: 'medium',
          type: 'feature',
          privacy: 'shareable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'low123',
          title: 'Low Priority Task',
          description: 'Minor task',
          status: 'pending',
          priority: 'low',
          type: 'task',
          privacy: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      await command.execute({}, { compact: false, json: false })

      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            status: 'pending',
          }),
        })
      )

      const { displayTickets } = await import('../../lib/table-formatter.ts')
      expect(displayTickets).toHaveBeenCalledWith(mockTickets, 'table', expect.any(Function), {
        sectionTitle: 'Pending Tickets:',
      })
    })

    it('should handle different ticket types', async () => {
      const mockTickets = [
        {
          id: 'bug123',
          title: 'Bug Ticket',
          description: 'Bug to fix',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'feature123',
          title: 'Feature Ticket',
          description: 'New feature to implement',
          status: 'pending',
          priority: 'medium',
          type: 'feature',
          privacy: 'shareable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task123',
          title: 'Task Ticket',
          description: 'Regular task',
          status: 'pending',
          priority: 'low',
          type: 'task',
          privacy: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      await command.execute({}, { compact: false, json: false })

      const { displayTickets } = await import('../../lib/table-formatter.ts')
      expect(displayTickets).toHaveBeenCalledWith(mockTickets, 'table', expect.any(Function), {
        sectionTitle: 'Pending Tickets:',
      })
    })
  })

  describe('Empty Results', () => {
    it('should handle empty pending tickets list', async () => {
      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: [] })

      await command.execute({}, { compact: false, json: false })

      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            status: 'pending',
          }),
        })
      )

      expect(logSpy).toHaveBeenCalledWith('No pending tickets found.')
    })

    it('should show helpful message when no pending tickets exist', async () => {
      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: [] })

      await command.execute({}, { compact: false, json: false })

      expect(logSpy).toHaveBeenCalledWith('No pending tickets found.')
    })
  })

  describe('Error Handling', () => {
    it('should handle use case execution errors', async () => {
      const useCaseError = new Error('Failed to retrieve tickets')
      useCaseError.name = 'UseCaseError'

      mockSearchTicketsUseCase.execute.mockRejectedValue(useCaseError)

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Failed to retrieve pending tickets: Failed to retrieve tickets')
      })

      await expect(command.execute({}, { compact: false, json: false })).rejects.toThrow(
        'Failed to retrieve pending tickets: Failed to retrieve tickets'
      )

      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            status: 'pending',
          }),
        })
      )

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to retrieve pending tickets: Failed to retrieve tickets'
      )
    })

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Repository connection failed')
      repositoryError.name = 'RepositoryError'

      mockSearchTicketsUseCase.execute.mockRejectedValue(repositoryError)

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Failed to retrieve pending tickets: Repository connection failed')
      })

      await expect(command.execute({}, { compact: false, json: false })).rejects.toThrow(
        'Failed to retrieve pending tickets: Repository connection failed'
      )
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Storage access denied')
      storageError.name = 'StorageError'

      mockSearchTicketsUseCase.execute.mockRejectedValue(storageError)

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Failed to retrieve pending tickets: Storage access denied')
      })

      await expect(command.execute({}, { compact: false, json: false })).rejects.toThrow(
        'Failed to retrieve pending tickets: Storage access denied'
      )
    })

    it('should handle service factory errors', async () => {
      vi.mocked(getSearchTicketsUseCase).mockImplementation(() => {
        throw new Error('Service factory initialization failed')
      })

      await expect(command.execute({}, { compact: false, json: false })).rejects.toThrow(
        'Service factory initialization failed'
      )
    })

    it('should handle network connectivity errors', async () => {
      const networkError = new Error('Network connection timeout')
      networkError.name = 'NetworkError'

      mockSearchTicketsUseCase.execute.mockRejectedValue(networkError)

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Failed to retrieve pending tickets: Network connection timeout')
      })

      await expect(command.execute({}, { compact: false, json: false })).rejects.toThrow(
        'Failed to retrieve pending tickets: Network connection timeout'
      )
    })

    it('should handle unknown errors', async () => {
      const unknownError = 'Unknown error'

      mockSearchTicketsUseCase.execute.mockRejectedValue(unknownError)

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('An unexpected error occurred while retrieving tickets')
      })

      await expect(command.execute({}, { compact: false, json: false })).rejects.toThrow(
        'An unexpected error occurred while retrieving tickets'
      )

      expect(errorSpy).toHaveBeenCalledWith('An unexpected error occurred while retrieving tickets')
    })
  })

  describe('Performance', () => {
    it('should handle large number of pending tickets', async () => {
      const mockTickets = Array.from({ length: 100 }, (_, i) => ({
        id: `large${i}`,
        title: `Large Test Ticket ${i}`,
        description: `Testing large dataset ${i}`,
        status: 'pending',
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        type: i % 3 === 0 ? 'bug' : i % 3 === 1 ? 'feature' : 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const startTime = Date.now()
      await command.execute({}, { compact: false, json: false })
      const duration = Date.now() - startTime

      const { displayTickets } = await import('../../lib/table-formatter.ts')
      expect(displayTickets).toHaveBeenCalledWith(mockTickets, 'table', expect.any(Function), {
        sectionTitle: 'Pending Tickets:',
      })
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should complete within reasonable time', async () => {
      const mockTickets = [
        {
          id: 'perf123',
          title: 'Performance Test',
          description: 'Testing command performance',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const startTime = Date.now()
      await command.execute({}, { compact: false, json: false })
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('Command Integration', () => {
    it('should integrate with BaseCommand properly', async () => {
      const mockTickets = [
        {
          id: 'base123',
          title: 'Base Command Test',
          description: 'Testing base command integration',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      await command.execute({}, { compact: false, json: false })

      expect(getSearchTicketsUseCase).toHaveBeenCalled()
      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledTimes(1)
      const { displayTickets } = await import('../../lib/table-formatter.ts')
      expect(displayTickets).toHaveBeenCalled()
    })

    it('should use correct status filter', async () => {
      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: [] })

      await command.execute({}, { compact: false, json: false })

      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            status: 'pending',
          }),
        })
      )
    })
  })
})
