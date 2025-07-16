import { beforeEach, describe, expect, test, vi } from 'vitest'
import { QuickNewCommand } from './new.ts'

describe('QuickNewCommand', () => {
  let command: QuickNewCommand
  let logSpy: ReturnType<typeof vi.spyOn>
  let mockCreateTicketUseCase: any

  beforeEach(() => {
    command = new QuickNewCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})

    mockCreateTicketUseCase = {
      execute: vi.fn().mockResolvedValue({ id: 'test-ticket-id' }),
    }

    ;(command as any).getService = vi.fn().mockReturnValue(mockCreateTicketUseCase)
  })

  test('should have correct command metadata', () => {
    expect(QuickNewCommand.description).toBe('Quickly create a new ticket')
    expect(QuickNewCommand.aliases).toEqual(['q:n'])
    expect(QuickNewCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %> "Fix login bug"',
      '<%= config.bin %> <%= command.id %> "Add dashboard" -d "Create user dashboard" -p h -t f',
    ])
    expect(QuickNewCommand.args.title).toBeDefined()
    expect(QuickNewCommand.args.title.description).toBe('Ticket title')
    expect(QuickNewCommand.args.title.required).toBe(true)
  })

  test('should execute with proper type safety', async () => {
    // Test that the execute method accepts ExecuteArgs and ExecuteFlags
    const args = { title: 'Test ticket' }
    const flags = {
      description: 'Test description',
      priority: 'h',
      type: 'f',
      json: false,
    }

    await command.execute(args, flags)

    // Should create ticket with proper types
    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test ticket',
        description: 'Test description',
        priority: 'high',
        type: 'feature',
      })
    )
    expect(logSpy).toHaveBeenCalledWith('Ticket test-ticket-id created successfully.')
  })

  test('should return Promise<void>', async () => {
    const args = { title: 'Test ticket' }
    const flags = {
      description: 'Test description',
      priority: 'm',
      type: 't',
      json: false,
    }

    const result = command.execute(args, flags)

    // Should return a Promise<void>
    expect(result).toBeInstanceOf(Promise)

    const resolvedResult = await result
    expect(resolvedResult).toBeUndefined()
  })

  test('should expand priority shortcuts correctly', async () => {
    // Test high priority shortcut
    const args = { title: 'High priority ticket' }
    const flags = {
      description: 'Test description',
      priority: 'h',
      type: 'f',
      json: false,
    }

    await command.execute(args, flags)

    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'high',
      })
    )
  })

  test('should expand type shortcuts correctly', async () => {
    // Test feature type shortcut
    const args = { title: 'Feature ticket' }
    const flags = {
      description: 'Test description',
      priority: 'm',
      type: 'f',
      json: false,
    }

    await command.execute(args, flags)

    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feature',
      })
    )
  })

  test('should handle full priority names', async () => {
    const args = { title: 'Medium priority ticket' }
    const flags = {
      description: 'Test description',
      priority: 'medium',
      type: 'bug',
      json: false,
    }

    await command.execute(args, flags)

    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'medium',
        type: 'bug',
      })
    )
  })

  test('should handle full type names', async () => {
    const args = { title: 'Task ticket' }
    const flags = {
      description: 'Test description',
      priority: 'low',
      type: 'task',
      json: false,
    }

    await command.execute(args, flags)

    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'low',
        type: 'task',
      })
    )
  })

  test('should trim title whitespace', async () => {
    const args = { title: '  Test ticket with spaces  ' }
    const flags = {
      description: 'Test description',
      priority: 'm',
      type: 't',
      json: false,
    }

    await command.execute(args, flags)

    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test ticket with spaces',
      })
    )
  })

  test('should handle default values', async () => {
    const args = { title: 'Default values ticket' }
    const flags = {
      description: '', // Default empty description
      priority: 'm', // Default medium priority
      type: 't', // Default task type
      json: false,
    }

    await command.execute(args, flags)

    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '',
        priority: 'medium',
        type: 'task',
      })
    )
  })

  test('should use proper domain types', async () => {
    const args = { title: 'Domain types ticket' }
    const flags = {
      description: 'Test description',
      priority: 'h',
      type: 'b',
      json: false,
    }

    await command.execute(args, flags)

    // Should call with TicketPriority and TicketType domain types
    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'high', // TicketPriority
        type: 'bug', // TicketType
      })
    )
  })

  test('should expand all priority shortcuts', async () => {
    const testCases = [
      { input: 'h', expected: 'high' },
      { input: 'm', expected: 'medium' },
      { input: 'l', expected: 'low' },
      { input: 'high', expected: 'high' },
      { input: 'medium', expected: 'medium' },
      { input: 'low', expected: 'low' },
    ]

    for (const testCase of testCases) {
      const args = { title: `Priority ${testCase.input} ticket` }
      const flags = {
        description: 'Test description',
        priority: testCase.input,
        type: 't',
        json: false,
      }

      await command.execute(args, flags)

      expect(mockCreateTicketUseCase.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({
          priority: testCase.expected,
        })
      )
    }
  })

  test('should expand all type shortcuts', async () => {
    const testCases = [
      { input: 'f', expected: 'feature' },
      { input: 'b', expected: 'bug' },
      { input: 't', expected: 'task' },
      { input: 'feature', expected: 'feature' },
      { input: 'bug', expected: 'bug' },
      { input: 'task', expected: 'task' },
    ]

    for (const testCase of testCases) {
      const args = { title: `Type ${testCase.input} ticket` }
      const flags = {
        description: 'Test description',
        priority: 'm',
        type: testCase.input,
        json: false,
      }

      await command.execute(args, flags)

      expect(mockCreateTicketUseCase.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: testCase.expected,
        })
      )
    }
  })

  test('should handle json flag correctly', async () => {
    const args = { title: 'JSON flag ticket' }
    const flags = {
      description: 'Test description',
      priority: 'h',
      type: 'f',
      json: true,
    }

    await command.execute(args, flags)

    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'JSON flag ticket',
        description: 'Test description',
        priority: 'high',
        type: 'feature',
      })
    )
    expect(logSpy).toHaveBeenCalledWith('Ticket test-ticket-id created successfully.')
  })
})
