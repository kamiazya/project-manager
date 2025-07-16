import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getServiceContainer, getUpdateTicketUseCase } from '../utils/service-factory.ts'
import { UpdateCommand } from './update.ts'

// Mock the service factory module
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
  getUpdateTicketUseCase: vi.fn(),
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
        } else if (this.argv[i] === '--title' && i + 1 < this.argv.length) {
          flags.title = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--status' && i + 1 < this.argv.length) {
          flags.status = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--priority' && i + 1 < this.argv.length) {
          flags.priority = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--type' && i + 1 < this.argv.length) {
          flags.type = this.argv[i + 1]
          i++
        } else if (this.argv[i] === '--description' && i + 1 < this.argv.length) {
          flags.description = this.argv[i + 1]
          i++
        }
      }

      return { args, flags }
    }
    log = vi.fn()
    logJson = vi.fn()
    error = vi.fn()
    warn = vi.fn()
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

describe('UpdateCommand', () => {
  let mockContainer: Container
  let mockUpdateTicketUseCase: any

  beforeEach(() => {
    // Mock use cases
    mockUpdateTicketUseCase = {
      execute: vi.fn(),
    }

    // Mock the service container
    mockContainer = {
      get: vi.fn(() => mockUpdateTicketUseCase),
    } as unknown as Container

    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
    vi.mocked(getUpdateTicketUseCase).mockReturnValue(mockUpdateTicketUseCase)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should update ticket title', async () => {
    // Arrange
    const updatedTicket = {
      id: 'ticket-123',
      title: 'New title',
      status: 'pending',
      priority: 'medium',
      type: 'task',
    }

    mockUpdateTicketUseCase.execute.mockResolvedValue(updatedTicket)

    // Act
    const cmd = new UpdateCommand(['ticket-123', '--title', 'New title'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(getUpdateTicketUseCase).toHaveBeenCalled()
    expect(mockUpdateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ticket-123',
        updates: expect.objectContaining({
          title: 'New title',
        }),
      })
    )
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 updated successfully.')
  })

  it('should update multiple fields', async () => {
    // Arrange
    const updatedTicket = {
      id: 'ticket-123',
      title: 'New title',
      status: 'in_progress',
      priority: 'high',
      type: 'task',
    }

    mockUpdateTicketUseCase.execute.mockResolvedValue(updatedTicket)

    // Act
    const cmd = new UpdateCommand(
      ['ticket-123', '--title', 'New title', '--status', 'in_progress', '--priority', 'high'],
      {
        runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
      } as any
    )
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(mockUpdateTicketUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ticket-123',
        updates: expect.objectContaining({
          title: 'New title',
          status: 'in_progress',
          priority: 'high',
        }),
      })
    )
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 updated successfully.')
  })

  it('should output JSON when --json flag is used', async () => {
    // Arrange
    const updatedTicket = {
      id: 'ticket-123',
      title: 'New title',
      status: 'pending',
      priority: 'medium',
      type: 'task',
    }

    mockUpdateTicketUseCase.execute.mockResolvedValue(updatedTicket)

    // Act
    const cmd = new UpdateCommand(['ticket-123', '--title', 'New title', '--json'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const result = await cmd.run()

    // Assert
    expect(result).toEqual(updatedTicket)
  })

  it('should handle ticket not found', async () => {
    // Arrange
    const { TicketNotFoundError } = await import('@project-manager/shared')
    mockUpdateTicketUseCase.execute.mockRejectedValue(
      new TicketNotFoundError('Ticket not found: non-existent-id')
    )

    // Act
    const cmd = new UpdateCommand(['non-existent-id', '--title', 'New title'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    // Assert
    await expect(cmd.run()).rejects.toThrow('Ticket not found: non-existent-id')
  })

  it('should validate at least one field is provided', async () => {
    // Act
    const cmd = new UpdateCommand(['ticket-123'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const errorSpy = vi.spyOn(cmd, 'error').mockImplementation(() => {
      throw new Error('At least one field must be specified for update')
    })

    // Assert
    await expect(cmd.run()).rejects.toThrow('At least one field must be specified for update')
    expect(errorSpy).toHaveBeenCalledWith('At least one field must be specified for update')
  })

  it('should validate required ticket ID argument', async () => {
    // This test might not be needed as oclif should handle required arguments
    // But keeping it to ensure proper error handling
    const cmd = new UpdateCommand(['--title', 'New title'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const errorSpy = vi.spyOn(cmd, 'error').mockImplementation(() => {
      throw new Error('Ticket ID is required')
    })

    // We expect an error due to missing required argument
    await expect(cmd.run()).rejects.toThrow('Ticket ID is required')
    expect(errorSpy).toHaveBeenCalledWith('Ticket ID is required')
  })
})
