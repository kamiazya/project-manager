import { TYPES } from '@project-manager/core'
import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServiceContainer } from '../utils/service-factory.ts'
import { DeleteCommand } from './delete.ts'

// Mock the service factory module
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
}))

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
}))

describe('DeleteCommand', () => {
  let mockContainer: Container
  let mockGetTicketByIdUseCase: any
  let mockDeleteTicketUseCase: any

  beforeEach(() => {
    // Mock use cases
    mockGetTicketByIdUseCase = {
      execute: vi.fn(),
    }
    mockDeleteTicketUseCase = {
      execute: vi.fn(),
    }

    // Mock the service container
    mockContainer = {
      get: vi.fn(type => {
        if (type === TYPES.GetTicketByIdUseCase) return mockGetTicketByIdUseCase
        if (type === TYPES.DeleteTicketUseCase) return mockDeleteTicketUseCase
        return null
      }),
    } as unknown as Container

    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should delete ticket with force flag', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      status: 'pending',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)
    mockDeleteTicketUseCase.execute.mockResolvedValue(undefined)

    // Act
    const cmd = new DeleteCommand(['ticket-123', '--force'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(mockGetTicketByIdUseCase.execute).toHaveBeenCalledWith({ id: 'ticket-123' })
    expect(mockDeleteTicketUseCase.execute).toHaveBeenCalledWith({ id: 'ticket-123' })
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 deleted successfully.')
  })

  it('should cancel deletion when user declines confirmation', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      status: 'pending',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)

    // Mock user declining deletion
    const { confirm } = await import('@inquirer/prompts')
    vi.mocked(confirm).mockResolvedValue(false)

    // Act
    const cmd = new DeleteCommand(['ticket-123'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(confirm).toHaveBeenCalledWith({
      message: 'Are you sure you want to delete ticket "Test ticket"?',
      default: false,
    })
    expect(mockDeleteTicketUseCase.execute).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('Deletion cancelled.')
  })

  it('should delete ticket after user confirmation', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      status: 'pending',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)
    mockDeleteTicketUseCase.execute.mockResolvedValue(undefined)

    // Mock user confirming deletion
    const { confirm } = await import('@inquirer/prompts')
    vi.mocked(confirm).mockResolvedValue(true)

    // Act
    const cmd = new DeleteCommand(['ticket-123'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(confirm).toHaveBeenCalledWith({
      message: 'Are you sure you want to delete ticket "Test ticket"?',
      default: false,
    })
    expect(mockDeleteTicketUseCase.execute).toHaveBeenCalledWith({ id: 'ticket-123' })
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 deleted successfully.')
  })

  it('should delete ticket when force flag is used (no confirmation)', async () => {
    // Arrange
    const mockTicket = {
      id: 'ticket-123',
      title: 'Test ticket',
      status: 'pending',
    }

    mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicket)
    mockDeleteTicketUseCase.execute.mockResolvedValue(undefined)

    // Act
    const cmd = new DeleteCommand(['ticket-123', '--force'], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    } as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    const { confirm } = await import('@inquirer/prompts')
    expect(confirm).not.toHaveBeenCalled()
    expect(mockDeleteTicketUseCase.execute).toHaveBeenCalledWith({ id: 'ticket-123' })
    expect(logSpy).toHaveBeenCalledWith('Ticket ticket-123 deleted successfully.')
  })

  it('should handle ticket not found', async () => {
    // Arrange
    mockGetTicketByIdUseCase.execute.mockResolvedValue(null)

    // Act
    const cmd = new DeleteCommand(['non-existent'], {
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

  it('should support rm alias', async () => {
    // Check if rm alias is properly configured
    expect(DeleteCommand.aliases).toContain('rm')
  })
})
