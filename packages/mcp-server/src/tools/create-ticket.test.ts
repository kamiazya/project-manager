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

    // MCP tools return content array
    expect(result.content).toBeDefined()
    expect(result.content[0].type).toBe('text')

    const responseData = JSON.parse(result.content[0].text)
    expect(responseData.success).toBe(true)
    expect(responseData.ticket).toMatchObject({
      id: mockResponse.id,
      title: mockResponse.title,
      description: mockResponse.description,
      status: mockResponse.status,
      priority: mockResponse.priority,
      type: mockResponse.type,
    })

    // Verify the use case was called with CreateTicketRequest instance
    expect(mockUseCase.execute).toHaveBeenCalled()
    const callArg = mockUseCase.execute.mock.calls[0][0]
    expect(callArg.toCreateTicketData()).toMatchObject({
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

    // MCP tools return content array
    expect(result.content).toBeDefined()
    expect(result.content[0].type).toBe('text')

    const responseData = JSON.parse(result.content[0].text)
    expect(responseData.success).toBe(false)
    expect(responseData.error).toBe('Test error')
  })
})
