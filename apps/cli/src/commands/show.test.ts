import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getGetTicketByIdUseCase, getServiceContainer } from '../utils/service-factory.ts'
import { ShowCommand } from './show.ts'

// Mock the service factory module
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
  getGetTicketByIdUseCase: vi.fn(),
}))

// Mock the output module
vi.mock('../utils/output.ts', () => ({
  formatTicketResponse: vi.fn((ticket, options) => {
    if (options.format === 'json') {
      return JSON.stringify(ticket)
    }
    return `Ticket: ${ticket.title}\nStatus: ${ticket.status}`
  }),
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
      if (this.argv.length > 0 && this.argv[0] && !this.argv[0].startsWith('-')) {
        args.ticketId = this.argv[0]
      }

      // Handle flags
      for (let i = 0; i < this.argv.length; i++) {
        if (this.argv[i] === '--json') {
          flags.json = true
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
  },
}))

describe('ShowCommand', () => {
  let mockContainer: Container
  let mockGetTicketByIdUseCase: any

  beforeEach(() => {
    // Mock use case
    mockGetTicketByIdUseCase = {
      execute: vi.fn(),
    }

    // Mock the service container
    mockContainer = {
      get: vi.fn().mockReturnValue(mockGetTicketByIdUseCase),
    } as unknown as Container

    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
    vi.mocked(getGetTicketByIdUseCase).mockReturnValue(mockGetTicketByIdUseCase)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show ticket details', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Fix login bug',
      status: 'pending',
      priority: 'high',
      type: 'bug',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)

    // Act
    const cmd = new ShowCommand(['ticket-123'], {} as any)
    await cmd.init()

    // Capture log output
    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})

    await cmd.run()

    // Assert
    expect(getGetTicketByIdUseCase).toHaveBeenCalled()
    expect(mockGetTicketByIdUseCase.execute).toHaveBeenCalledWith({
      id: 'ticket-123',
    })
    expect(logSpy).toHaveBeenCalledWith('Ticket: Fix login bug\nStatus: pending')
  })

  it('should output JSON when --json flag is used', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Fix login bug',
      status: 'pending',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)

    // Act
    const cmd = new ShowCommand(['ticket-123', '--json'], {} as any)
    await cmd.init()

    const result = await cmd.run()

    // Assert - should return the ticket directly when --json flag is used
    expect(result).toEqual(mockTicket)
  })

  it('should handle ticket not found', async () => {
    // Arrange
    mockGetTicketByIdUseCase.execute.mockResolvedValue(null)

    // Act
    const cmd = new ShowCommand(['non-existent'], {} as any)
    await cmd.init()

    const errorSpy = vi.spyOn(cmd, 'error').mockImplementation(() => {
      throw new Error('Ticket not found')
    })

    // Assert
    await expect(cmd.run()).rejects.toThrow('Ticket not found')
    expect(errorSpy).toHaveBeenCalledWith('Ticket not found: non-existent')
  })

  it('should validate required ticket ID argument', async () => {
    // Arrange - no ticket ID provided
    const cmd = new ShowCommand([], {} as any)
    await cmd.init()

    const errorSpy = vi.spyOn(cmd, 'error').mockImplementation(() => {
      throw new Error('Ticket ID is required')
    })

    // Act & Assert
    await expect(cmd.run()).rejects.toThrow('Ticket ID is required')
    expect(errorSpy).toHaveBeenCalledWith('Ticket ID is required')
  })
})
