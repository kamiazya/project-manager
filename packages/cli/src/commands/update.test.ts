import { TYPES } from '@project-manager/core'
import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServiceContainer } from '../utils/service-factory.ts'
import { UpdateCommand } from './update.ts'

// Mock the service factory module
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
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
      if (this.argv.length > 0 && !this.argv[0].startsWith('-')) {
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

describe('UpdateCommand', () => {
  let mockContainer: Container
  let mockGetTicketByIdUseCase: any
  let mockUpdateTicketTitleUseCase: any
  let mockUpdateTicketStatusUseCase: any
  let mockUpdateTicketPriorityUseCase: any
  let mockUpdateTicketDescriptionUseCase: any

  beforeEach(() => {
    // Mock use cases
    mockGetTicketByIdUseCase = {
      execute: vi.fn(),
    }
    mockUpdateTicketTitleUseCase = {
      execute: vi.fn(),
    }
    mockUpdateTicketStatusUseCase = {
      execute: vi.fn(),
    }
    mockUpdateTicketPriorityUseCase = {
      execute: vi.fn(),
    }
    mockUpdateTicketDescriptionUseCase = {
      execute: vi.fn(),
    }

    // Mock the service container
    mockContainer = {
      get: vi.fn(type => {
        if (type === TYPES.GetTicketByIdUseCase) return mockGetTicketByIdUseCase
        if (type === TYPES.UpdateTicketTitleUseCase) return mockUpdateTicketTitleUseCase
        if (type === TYPES.UpdateTicketStatusUseCase) return mockUpdateTicketStatusUseCase
        if (type === TYPES.UpdateTicketPriorityUseCase) return mockUpdateTicketPriorityUseCase
        if (type === TYPES.UpdateTicketDescriptionUseCase) return mockUpdateTicketDescriptionUseCase
        return null
      }),
    } as unknown as Container

    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should update ticket title', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Old title',
      status: 'pending',
      priority: 'medium',
      type: 'task',
    }

    const updatedTicket = {
      ...mockTicket,
      title: 'New title',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)
    mockUpdateTicketTitleUseCase.execute.mockResolvedValue({ ticket: updatedTicket })

    // Act
    const cmd = new UpdateCommand(['ticket-123', '--title', 'New title'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(mockGetTicketByIdUseCase.execute).toHaveBeenCalledWith({ id: 'ticket-123' })
    expect(mockUpdateTicketTitleUseCase.execute).toHaveBeenCalledWith({
      id: 'ticket-123',
      newTitle: 'New title',
    })
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 updated successfully.')
  })

  it('should update multiple fields', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      status: 'pending',
      priority: 'low',
      type: 'task',
    }

    const updatedTicket = {
      ...mockTicket,
      status: 'in_progress',
      priority: 'high',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)
    mockUpdateTicketStatusUseCase.execute.mockResolvedValue({
      ticket: { ...mockTicket, status: 'in_progress' },
    })
    mockUpdateTicketPriorityUseCase.execute.mockResolvedValue({ ticket: updatedTicket })

    // Act
    const cmd = new UpdateCommand(['ticket-123', '--status', 'in_progress', '--priority', 'high'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(mockUpdateTicketStatusUseCase.execute).toHaveBeenCalledWith({
      id: 'ticket-123',
      newStatus: 'in_progress',
    })
    expect(mockUpdateTicketPriorityUseCase.execute).toHaveBeenCalledWith({
      id: 'ticket-123',
      newPriority: 'high',
    })
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 updated successfully.')
  })

  it('should output JSON when --json flag is used', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      status: 'pending',
    }

    const updatedTicket = {
      ...mockTicket,
      title: 'Updated title',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)
    mockUpdateTicketTitleUseCase.execute.mockResolvedValue({ ticket: updatedTicket })

    // Act
    const cmd = new UpdateCommand(['ticket-123', '--title', 'Updated title', '--json'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logJsonSpy = vi.spyOn(cmd, 'logJson').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(logJsonSpy).toHaveBeenCalledWith({ ticket: updatedTicket })
  })

  it('should handle ticket not found', async () => {
    // Arrange
    mockGetTicketByIdUseCase.execute.mockResolvedValue(null)

    // Act
    const cmd = new UpdateCommand(['non-existent', '--title', 'New title'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const errorSpy = vi.spyOn(cmd, 'error').mockImplementation(() => {
      throw new Error('Ticket not found')
    })

    // Assert
    await expect(cmd.run()).rejects.toThrow('Ticket not found')
    expect(errorSpy).toHaveBeenCalledWith('Ticket not found: non-existent')
  })

  it('should require at least one field to update', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      status: 'pending',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)

    // Act
    const cmd = new UpdateCommand(['ticket-123'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const errorSpy = vi.spyOn(cmd, 'error').mockImplementation(() => {
      throw new Error('No fields to update')
    })

    // Assert
    await expect(cmd.run()).rejects.toThrow('No fields to update')
    expect(errorSpy).toHaveBeenCalledWith('At least one field must be specified for update')
  })

  it('should validate required ticket ID argument', async () => {
    // Arrange - no ticket ID provided
    const cmd = new UpdateCommand(['--title', 'New title'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const errorSpy = vi.spyOn(cmd, 'error').mockImplementation(() => {
      throw new Error('Ticket ID is required')
    })

    // Act & Assert
    await expect(cmd.run()).rejects.toThrow('Ticket ID is required')
  })
})
