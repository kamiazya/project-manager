import { CreateTicketUseCase, TYPES } from '@project-manager/core'
import { Container } from 'inversify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as containerModule from '../utils/container.js'
import { createTicketTool } from './create-ticket.js'

describe('createTicketTool', () => {
  let mockContainer: Container
  let mockUseCase: CreateTicketUseCase

  beforeEach(() => {
    mockContainer = new Container()
    mockUseCase = {
      execute: vi.fn(),
    } as unknown as CreateTicketUseCase

    mockContainer.bind<CreateTicketUseCase>(TYPES.CreateTicketUseCase).toConstantValue(mockUseCase)
    vi.spyOn(containerModule, 'getContainer').mockReturnValue(mockContainer)
  })

  it('should have correct metadata', () => {
    expect(createTicketTool.name).toBe('create_ticket')
    expect(createTicketTool.description).toBe('Create a new ticket')
    expect(createTicketTool.inputSchema).toBeDefined()
  })

  it('should create ticket successfully', async () => {
    const mockResponse = {
      id: 'test-id',
      title: 'Test Ticket',
      description: 'Test Description',
      status: 'pending',
      priority: 'medium',
      type: 'task',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    vi.mocked(mockUseCase.execute).mockResolvedValue(mockResponse)

    const result = await createTicketTool.handler({
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      type: 'task',
    })

    expect(result.success).toBe(true)
    expect(result.ticket).toEqual(mockResponse)
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      type: 'task',
    })
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(mockUseCase.execute).mockRejectedValue(new Error('Test error'))

    const result = await createTicketTool.handler({
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      type: 'task',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Test error')
  })
})
