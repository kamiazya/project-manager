import { TYPES } from '@project-manager/core'
import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServiceContainer } from '../utils/service-factory.ts'
import { ListCommand } from './list.ts'

// Mock the service factory module
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
}))

// Mock the output module
vi.mock('../utils/output.ts', () => ({
  formatTicketSummaryList: vi.fn((tickets, options) => {
    if (options.format === 'json') {
      return JSON.stringify(tickets)
    }
    return `Found ${tickets.length} tickets`
  }),
}))

// Mock shared configuration
vi.mock('@project-manager/shared', async importOriginal => {
  const actual = await importOriginal()
  // Ensure actual is an object before spreading
  const actualObject = actual && typeof actual === 'object' ? actual : {}
  return {
    ...actualObject,
    getConfig: vi.fn(() => ({ defaultOutputFormat: 'table' })),
    SUCCESS_MESSAGES: {
      TICKETS_FOUND: (count: number) => `Found ${count} tickets`,
    },
  }
})

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

      // Handle flags
      for (let i = 0; i < this.argv.length; i++) {
        if (this.argv[i] === '--json') {
          flags.json = true
        } else if (this.argv[i] === '--status' && i + 1 < this.argv.length) {
          flags.status = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--priority' && i + 1 < this.argv.length) {
          flags.priority = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--type' && i + 1 < this.argv.length) {
          flags.type = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--search' && i + 1 < this.argv.length) {
          flags.search = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--format' && i + 1 < this.argv.length) {
          flags.format = this.argv[i + 1]
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
  },
}))

describe('ListCommand', () => {
  let mockContainer: Container
  let mockSearchTicketsUseCase: any

  beforeEach(() => {
    // Mock use case
    mockSearchTicketsUseCase = {
      execute: vi.fn(),
    }

    // Mock the service container
    mockContainer = {
      get: vi.fn().mockReturnValue(mockSearchTicketsUseCase),
    } as unknown as Container

    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should list all tickets by default', async () => {
    // Arrange
    const mockTickets = [
      { id: '1', title: 'Task 1', status: 'pending' },
      { id: '2', title: 'Task 2', status: 'completed' },
    ]

    mockSearchTicketsUseCase.execute.mockResolvedValue({
      tickets: mockTickets,
    })

    // Act
    const cmd = new ListCommand([], {} as any)
    await cmd.init()

    // Capture log output
    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})

    await cmd.run()

    // Assert
    expect(mockContainer.get).toHaveBeenCalledWith(TYPES.SearchTicketsUseCase)
    expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith({
      criteria: {},
    })
    expect(logSpy).toHaveBeenCalledWith('Found 2 tickets')
  })

  it('should filter by status', async () => {
    // Arrange
    const mockTickets = [{ id: '1', title: 'Task 1', status: 'pending' }]
    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    // Act
    const cmd = new ListCommand(['--status', 'pending'], {} as any)
    await cmd.init()

    await cmd.run()

    // Assert
    expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith({
      criteria: { status: 'pending' },
    })
  })

  it('should filter by priority and type', async () => {
    // Arrange
    const mockTickets = [{ id: '1', title: 'High bug', priority: 'high', type: 'bug' }]
    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    // Act
    const cmd = new ListCommand(['--priority', 'high', '--type', 'bug'], {} as any)
    await cmd.init()

    await cmd.run()

    // Assert
    expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith({
      criteria: { priority: 'high', type: 'bug' },
    })
  })

  it('should search by title and description', async () => {
    // Arrange
    const mockTickets = [{ id: '1', title: 'Login feature' }]
    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    // Act
    const cmd = new ListCommand(['--search', 'login'], {} as any)
    await cmd.init()

    await cmd.run()

    // Assert
    expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith({
      criteria: { search: 'login' },
    })
  })

  it('should support different output formats', async () => {
    // Arrange
    const mockTickets = [{ id: '1', title: 'Task 1' }]
    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    // Act - compact format
    const cmd = new ListCommand(['--format', 'compact'], {} as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert - Should use the formatTicketSummaryList with compact format
    expect(logSpy).toHaveBeenCalled()
  })

  it('should output JSON when --json flag is used', async () => {
    // Arrange
    const mockTickets = [{ id: '1', title: 'Task 1' }]
    mockSearchTicketsUseCase.execute.mockResolvedValue({ tickets: mockTickets })

    // Act
    const cmd = new ListCommand(['--json'], {} as any)
    await cmd.init()

    await cmd.run()

    // Assert
    expect((cmd as any).logJson).toHaveBeenCalledWith(mockTickets)
  })
})
