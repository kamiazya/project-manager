import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CLI_TYPES } from '../infrastructure/container.ts'
import { getServiceContainer } from '../utils/service-factory.ts'
import { CreateCommand } from './create.ts'

// Mock service factory
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
}))

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
}))

// Mock the oclif Command class
vi.mock('@oclif/core', () => ({
  Command: class MockCommand {
    config = { runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }) }
    argv: string[]

    constructor(argv: string[]) {
      this.argv = argv
    }

    async init() {}
    async parse() {
      // Simple parsing logic for tests
      const args: any = {}
      const flags: any = {}

      // Handle positional arguments
      if (this.argv.length > 0 && !this.argv[0]?.startsWith('-')) {
        args.title = this.argv[0]
      }

      // Handle flags
      for (let i = 0; i < this.argv.length; i++) {
        if (this.argv[i] === '--json') {
          flags.json = true
        } else if (this.argv[i] === '-d' || this.argv[i] === '--description') {
          flags.description = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '-p' || this.argv[i] === '--priority') {
          flags.priority = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '-t' || this.argv[i] === '--type') {
          flags.type = this.argv[i + 1]
          i++
        }
      }

      return { args, flags }
    }
    log = vi.fn()
    logJson = vi.fn()
    error = vi.fn()
    async catch() {}
  },
  Args: {
    string: vi.fn(() => ({ description: '', required: false })),
  },
  Flags: {
    boolean: vi.fn(() => ({ description: '', required: false })),
    string: vi.fn(() => ({ description: '', required: false })),
    char: vi.fn(() => ({ description: '', required: false })),
  },
}))

describe('CreateCommand', () => {
  let mockContainer: any
  let mockCreateTicketUseCase: any

  beforeEach(() => {
    // Setup mock use cases
    mockCreateTicketUseCase = {
      execute: vi.fn(),
    }

    // Mock the service container
    mockContainer = {
      get: vi.fn(type => {
        if (type === CLI_TYPES.CreateTicketUseCase) return mockCreateTicketUseCase
        throw new Error(`Unknown service type: ${type.toString()}`)
      }),
    }

    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
  })

  it('should create ticket with command line arguments', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      description: 'Test description',
      priority: 'high',
      type: 'feature',
      status: 'pending',
    }

    mockCreateTicketUseCase.execute.mockResolvedValue(mockTicket)

    // Act
    const cmd = new CreateCommand(['Test ticket', '-d', 'Test description', '-p', 'h', '-t', 'f'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test ticket',
        description: 'Test description',
        priority: 'high',
        type: 'feature',
      })
    )
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 created successfully.')
  })

  it('should create ticket with interactive input when no arguments provided', async () => {
    // Arrange
    const { input, select } = await import('@inquirer/prompts')
    vi.mocked(input).mockResolvedValueOnce('Interactive title')
    vi.mocked(input).mockResolvedValueOnce('Interactive description')
    vi.mocked(select).mockResolvedValueOnce('medium')
    vi.mocked(select).mockResolvedValueOnce('bug')

    const mockTicket = {
      id: 'ticket-456',
      title: 'Interactive title',
      description: 'Interactive description',
      priority: 'medium',
      type: 'bug',
      status: 'pending',
    }

    mockCreateTicketUseCase.execute.mockResolvedValue(mockTicket)

    // Act
    const cmd = new CreateCommand([], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(input).toHaveBeenCalledWith({ message: 'Title:' })
    expect(input).toHaveBeenCalledWith({ message: 'Description:', default: '' })
    expect(select).toHaveBeenCalledWith({
      message: 'Priority:',
      choices: [
        { name: 'High', value: 'high' },
        { name: 'Medium', value: 'medium' },
        { name: 'Low', value: 'low' },
      ],
      default: 'medium',
    })
    expect(select).toHaveBeenCalledWith({
      message: 'Type:',
      choices: [
        { name: 'Feature', value: 'feature' },
        { name: 'Bug', value: 'bug' },
        { name: 'Task', value: 'task' },
      ],
      default: 'task',
    })
    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Interactive title',
        description: 'Interactive description',
        priority: 'medium',
        type: 'bug',
      })
    )
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-456 created successfully.')
  })

  it('should handle priority shortcuts correctly', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-789',
      title: 'Test ticket',
      description: '',
      priority: 'low',
      type: 'task',
      status: 'pending',
    }

    mockCreateTicketUseCase.execute.mockResolvedValue(mockTicket)

    // Act
    const cmd = new CreateCommand(['Test ticket', '-p', 'l'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    await cmd.run()

    // Assert
    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test ticket',
        description: '',
        priority: 'low',
        type: 'task',
      })
    )
  })

  it('should handle type shortcuts correctly', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-101',
      title: 'Test ticket',
      description: '',
      priority: 'medium',
      type: 'bug',
      status: 'pending',
    }

    mockCreateTicketUseCase.execute.mockResolvedValue(mockTicket)

    // Act
    const cmd = new CreateCommand(['Test ticket', '-t', 'b'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    await cmd.run()

    // Assert
    expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test ticket',
        description: '',
        priority: 'medium',
        type: 'bug',
      })
    )
  })

  it('should throw error when title is empty', async () => {
    // Arrange
    const { input } = await import('@inquirer/prompts')
    vi.mocked(input).mockResolvedValue('') // Return empty string from input

    // Mock error handling
    const errorSpy = vi.fn().mockImplementation(msg => {
      throw new Error(msg)
    })

    // Act & Assert
    const cmd = new CreateCommand([''], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    // Spy on error method
    vi.spyOn(cmd, 'error').mockImplementation(errorSpy as any)

    await expect(cmd.run()).rejects.toThrow('Title cannot be empty')
  })
})
