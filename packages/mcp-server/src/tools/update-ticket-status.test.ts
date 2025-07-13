import { UpdateTicketStatusUseCase } from '@project-manager/core'
import type { Container } from 'inversify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as containerModule from '../utils/container.ts'
import { updateTicketStatusTool } from './update-ticket-status.ts'

describe('updateTicketStatusTool', () => {
  let mockContainer: Container
  let mockUseCase: UpdateTicketStatusUseCase

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateTicketStatusUseCase

    mockContainer = {
      get: vi.fn().mockReturnValue(mockUseCase),
    } as any

    vi.spyOn(containerModule, 'getContainer').mockReturnValue(mockContainer as any)
  })

  it('should have correct metadata', () => {
    expect(updateTicketStatusTool.name).toBe('update_ticket_status')
    expect(updateTicketStatusTool.description).toBe('Update the status of a ticket')
    expect(updateTicketStatusTool.inputSchema).toBeDefined()
  })

  it('should update ticket status successfully', async () => {
    const mockResponse = {
      id: 'test-id',
      title: 'Test Ticket',
      description: 'Test Description',
      status: 'in_progress',
      priority: 'medium',
      type: 'task',
      privacy: 'public',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    vi.mocked(mockUseCase.execute).mockResolvedValue(mockResponse)

    const result = await updateTicketStatusTool.handler({
      id: 'test-id',
      status: 'in_progress',
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

    // Verify the use case was called with UpdateTicketStatusRequest instance
    expect(mockUseCase.execute).toHaveBeenCalled()
    const callArg = vi.mocked(mockUseCase.execute).mock.calls[0][0]
    expect(callArg.id).toBe('test-id')
    expect(callArg.newStatus).toBe('in_progress')
  })

  it('should handle different status values', async () => {
    const statuses = ['pending', 'in_progress', 'completed', 'archived'] as const

    for (const status of statuses) {
      const mockResponse = {
        id: 'test-id',
        title: 'Test Ticket',
        description: 'Test Description',
        status,
        priority: 'medium',
        type: 'task',
        privacy: 'public',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(mockUseCase.execute).mockResolvedValue(mockResponse)

      const result = await updateTicketStatusTool.handler({
        id: 'test-id',
        status,
      })

      const responseData = JSON.parse(result.content[0].text)
      expect(responseData.success).toBe(true)
      expect(responseData.ticket.status).toBe(status)
    }
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(mockUseCase.execute).mockRejectedValue(new Error('Test error'))

    const result = await updateTicketStatusTool.handler({
      id: 'test-id',
      status: 'in_progress',
    })

    // MCP tools return content array
    expect(result.content).toBeDefined()
    expect(result.content[0].type).toBe('text')
    expect(result.isError).toBe(true)

    const responseData = JSON.parse(result.content[0].text)
    expect(responseData.success).toBe(false)
    expect(responseData.error).toBe('Test error')
  })

  it('should handle ticket not found error', async () => {
    vi.mocked(mockUseCase.execute).mockRejectedValue(new Error('Ticket not found'))

    const result = await updateTicketStatusTool.handler({
      id: 'non-existent-id',
      status: 'completed',
    })

    const responseData = JSON.parse(result.content[0].text)
    expect(responseData.success).toBe(false)
    expect(responseData.error).toBe('Ticket not found')
    expect(result.isError).toBe(true)
  })
})
