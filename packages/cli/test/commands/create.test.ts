import { Container } from 'inversify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateCommand } from '../../src/commands/create.ts'

// Mock service factory
vi.mock('../../src/utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
}))

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
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
        if (type === TYPES.CreateTicketUseCase) return mockCreateTicketUseCase
        throw new Error(`Unknown service type: ${type.toString()}`)
      }),
    }

    const { getServiceContainer } = require('../../src/utils/service-factory.ts')
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
    })

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.execute(
      { title: 'Test ticket' },
      { description: 'Test description', priority: 'h', type: 'f' }
    )

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
    })

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.execute({ title: undefined }, { description: '', priority: 'm', type: 't' })

    // Assert
    expect(input).toHaveBeenCalledWith({ message: 'Title:' })
    expect(input).toHaveBeenCalledWith({ message: 'Description:' })
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
    })

    await cmd.execute({ title: 'Test ticket' }, { description: '', priority: 'l', type: 't' })

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
    })

    await cmd.execute({ title: 'Test ticket' }, { description: '', priority: 'm', type: 'b' })

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
    // Arrange & Act & Assert
    const cmd = new CreateCommand([''], {
      runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
    })

    await expect(
      cmd.execute({ title: '' }, { description: '', priority: 'm', type: 't' })
    ).rejects.toThrow('Title cannot be empty')
  })
})
