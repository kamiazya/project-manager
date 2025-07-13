import { TYPES } from '@project-manager/core'
import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ShowCommand } from '../../src/commands/show.ts'
import { getServiceContainer } from '../../src/utils/service-factory.ts'

// Mock the service factory module
vi.mock('../../src/utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
}))

// Mock the output module
vi.mock('../../src/utils/output.ts', () => ({
  formatTicketResponse: vi.fn((ticket, options) => {
    if (options.format === 'json') {
      return JSON.stringify(ticket)
    }
    return `Ticket: ${ticket.title}\nStatus: ${ticket.status}`
  }),
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
    expect(mockContainer.get).toHaveBeenCalledWith(TYPES.GetTicketByIdUseCase)
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

    const logJsonSpy = vi.spyOn(cmd, 'logJson').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(logJsonSpy).toHaveBeenCalledWith(mockTicket)
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

    // Act & Assert
    await expect(cmd.run()).rejects.toThrow()
  })
})
