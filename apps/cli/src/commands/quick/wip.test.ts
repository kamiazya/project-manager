import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getSearchTicketsUseCase } from '../../utils/service-factory.ts'
import { QuickWipCommand } from './wip.ts'

// Mock service factory
vi.mock('../../utils/service-factory.ts', () => ({
  getSearchTicketsUseCase: vi.fn(),
}))

describe('QuickWipCommand', () => {
  let command: QuickWipCommand
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: any
  let mockSearchTicketsUseCase: any

  beforeEach(() => {
    command = new QuickWipCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(command, 'error').mockImplementation((() => {
      throw new Error('Command error')
    }) as any)

    mockSearchTicketsUseCase = {
      execute: vi.fn(),
    }

    vi.mocked(getSearchTicketsUseCase).mockReturnValue(mockSearchTicketsUseCase)
  })

  test('should have correct command metadata', () => {
    expect(QuickWipCommand.description).toBe('List work-in-progress tickets')
    expect(QuickWipCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %>',
      '<%= config.bin %> <%= command.id %> --compact',
    ])
    expect(QuickWipCommand.flags.compact).toBeDefined()
    expect(QuickWipCommand.flags.compact.description).toBe('Compact output format')
  })

  test('should execute with proper type safety', async () => {
    // Test that the execute method accepts ExecuteArgs and ExecuteFlags
    const args = {} // No args expected
    const flags = { compact: false, json: false }

    const mockTickets = [
      {
        id: 'ticket-1',
        title: 'Test ticket 1',
        status: 'in_progress',
        priority: 'high',
        type: 'feature',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should call search use case with correct status
    expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        criteria: expect.objectContaining({
          status: 'in_progress',
        }),
      })
    )
  })

  test('should return Promise<void>', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: [] })

    const result = command.execute(args, flags)

    // Should return a Promise<void>
    expect(result).toBeInstanceOf(Promise)

    const resolvedResult = await result
    expect(resolvedResult).toBeUndefined()
  })

  test('should handle empty ticket list', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: [] })

    await command.execute(args, flags)

    expect(logSpy).toHaveBeenCalledWith('No work-in-progress tickets found.')
  })

  test('should display tickets in compact format', async () => {
    const args = {}
    const flags = { compact: true, json: false }

    const mockTickets = [
      {
        id: 'ticket-1',
        title: 'Test ticket 1',
        priority: 'high',
        type: 'feature',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should display ticket in compact format
    expect(logSpy).toHaveBeenCalledWith('ticket-1 [HF] Test ticket 1')
  })

  test('should display tickets in table format', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    const mockTickets = [
      {
        id: 'ticket-1',
        title: 'Test ticket 1',
        priority: 'medium',
        type: 'bug',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should display table headers and data
    expect(logSpy).toHaveBeenCalledWith('\nWork-in-Progress Tickets:')
    expect(logSpy).toHaveBeenCalledWith('=========================')
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ticket-1'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test ticket 1'))
  })

  test('should use TicketSummary type for tickets', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    // Test with proper TicketSummary structure
    const mockTicketSummary = {
      id: 'ticket-1',
      title: 'Test ticket with proper structure',
      status: 'in_progress',
      priority: 'high',
      type: 'feature',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: [mockTicketSummary] })

    await command.execute(args, flags)

    // Should handle TicketSummary properties correctly
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ticket-1'))
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test ticket with proper structure')
    )
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('high'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('feature'))
  })

  test('should handle compact format with proper priority and type shortcuts', async () => {
    const args = {}
    const flags = { compact: true, json: false }

    const testCases = [
      { priority: 'high', type: 'feature', expected: '[HF]' },
      { priority: 'medium', type: 'bug', expected: '[MB]' },
      { priority: 'low', type: 'task', expected: '[LT]' },
    ]

    for (const testCase of testCases) {
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Test ticket',
          priority: testCase.priority,
          type: testCase.type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      await command.execute(args, flags)

      expect(logSpy).toHaveBeenCalledWith(`ticket-1 ${testCase.expected} Test ticket`)
    }
  })

  test('should handle json flag correctly', async () => {
    const args = {}
    const flags = { compact: false, json: true }

    const mockTickets = [
      {
        id: 'ticket-1',
        title: 'Test ticket',
        priority: 'medium',
        type: 'task',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should still display tickets (json formatting handled by base command)
    expect(logSpy).toHaveBeenCalledWith('\nWork-in-Progress Tickets:')
  })

  test('should use shared truncation constants', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    // Test with a very long title
    const longTitle =
      'This is a very long ticket title that should be truncated according to the shared constants'
    const mockTickets = [
      {
        id: 'ticket-1',
        title: longTitle,
        priority: 'medium',
        type: 'task',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should truncate title using shared constants
    const logCalls = logSpy.mock.calls.map(call => call[0])
    const tableOutput = logCalls.find(
      call => typeof call === 'string' && call.includes('This is a very long ticket title')
    )

    expect(tableOutput).toBeDefined()
    expect(tableOutput).toContain('This is a very long ticket title that should be...')
    expect(tableOutput).not.toContain(longTitle) // Full title should not appear
  })

  test('should handle search use case errors', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    mockSearchTicketsUseCase.execute.mockRejectedValue(new Error('Database connection failed'))

    await expect(command.execute(args, flags)).rejects.toThrow()
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to retrieve work-in-progress tickets: Database connection failed'
    )
  })

  test('should handle tickets with null or undefined properties', async () => {
    const args = {}
    const flags = { compact: true, json: false }

    const mockTickets = [
      {
        id: 'ticket-1',
        title: null,
        priority: undefined,
        type: null,
        createdAt: null,
        updatedAt: null,
      },
      {
        id: 'ticket-2',
        title: '',
        priority: '',
        type: '',
        createdAt: '',
        updatedAt: '',
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should use fallback values for null/undefined properties
    expect(logSpy).toHaveBeenCalledWith('ticket-1 [UU] Untitled')
    expect(logSpy).toHaveBeenCalledWith('ticket-2 [UU] Untitled')
  })

  test('should handle tickets with null properties in table format', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    const mockTickets = [
      {
        id: null,
        title: undefined,
        priority: null,
        type: undefined,
        createdAt: null,
        updatedAt: null,
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should handle null values gracefully in table format
    const logCalls = logSpy.mock.calls.map(call => call[0])
    const tableContent = logCalls.find(call => typeof call === 'string' && call.includes('Unknown'))
    expect(tableContent).toBeDefined()
    expect(tableContent).toContain('Untitled')
    expect(tableContent).toContain('unknown')
    expect(tableContent).toContain('N/A')
  })

  test('should handle non-Error exceptions', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    // Mock a non-Error rejection
    mockSearchTicketsUseCase.execute.mockRejectedValue('String error')

    await expect(command.execute(args, flags)).rejects.toThrow()
    expect(errorSpy).toHaveBeenCalledWith('An unexpected error occurred while retrieving tickets')
  })

  test('should format table correctly', async () => {
    const args = {}
    const flags = { compact: false, json: false }

    const mockTickets = [
      {
        id: 'short-id',
        title: 'Short',
        priority: 'high',
        type: 'bug',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      },
      {
        id: 'very-long-ticket-id',
        title: 'Very long ticket title',
        priority: 'medium',
        type: 'feature',
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    await command.execute(args, flags)

    // Should format table with proper headers
    expect(logSpy).toHaveBeenCalledWith('\nWork-in-Progress Tickets:')
    expect(logSpy).toHaveBeenCalledWith('=========================')

    // Should include table content
    const logCalls = logSpy.mock.calls.map(call => call[0])
    const tableContent = logCalls.find(
      call => typeof call === 'string' && call.includes('ID') && call.includes('Title')
    )
    expect(tableContent).toBeDefined()
  })
})
