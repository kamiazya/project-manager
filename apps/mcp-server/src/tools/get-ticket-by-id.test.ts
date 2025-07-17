import { GetTicketById } from '@project-manager/application'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as containerModule from '../utils/container.ts'
import { getTicketByIdTool } from './get-ticket-by-id.ts'

// Mock the container
vi.mock('../utils/container.ts')

describe('getTicketByIdTool', () => {
  let mockUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn(),
    }
    vi.spyOn(containerModule, 'getGetTicketByIdUseCase').mockReturnValue(mockUseCase as any)
  })

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(getTicketByIdTool.name).toBe('get_ticket')
    })

    it('should have correct description', () => {
      expect(getTicketByIdTool.description).toBe('Get a ticket by ID')
    })

    it('should have correct input schema', () => {
      expect(getTicketByIdTool.inputSchema).toBeDefined()
      expect(getTicketByIdTool.inputSchema.id).toBeDefined()
      expect(getTicketByIdTool.inputSchema.id._def.description).toBe('The ticket ID')
    })
  })

  describe('Tool Handler', () => {
    it('should return ticket when found', async () => {
      const mockTicket = {
        id: 'test-123',
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        type: 'bug',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUseCase.execute.mockResolvedValue(mockTicket)

      const result = await getTicketByIdTool.handler({ id: 'test-123' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-123',
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Test Ticket'),
          },
        ],
      })

      const responseText = result.content[0].text
      expect(responseText).toContain('Test Ticket')
      expect(responseText).toContain('Test Description')
      expect(responseText).toContain('pending')
      expect(responseText).toContain('high')
      expect(responseText).toContain('bug')
      expect(responseText).toContain('"success": true')
    })

    it('should return not found when ticket does not exist', async () => {
      mockUseCase.execute.mockResolvedValue(null)

      const result = await getTicketByIdTool.handler({ id: 'nonexistent-123' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'nonexistent-123',
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Ticket not found'),
          },
        ],
        isError: true,
      })

      const responseText = result.content[0].text
      expect(responseText).toContain('"success": false')
      expect(responseText).toContain('Ticket not found')
    })

    it('should handle use case errors', async () => {
      const useCaseError = new Error('Database connection failed')
      useCaseError.name = 'DatabaseError'

      mockUseCase.execute.mockRejectedValue(useCaseError)

      const result = await getTicketByIdTool.handler({ id: 'test-123' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Database connection failed'),
          },
        ],
        isError: true,
      })

      const responseText = result.content[0].text
      expect(responseText).toContain('"success": false')
      expect(responseText).toContain('Database connection failed')
    })

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid ticket ID format')
      validationError.name = 'ValidationError'

      mockUseCase.execute.mockRejectedValue(validationError)

      const result = await getTicketByIdTool.handler({ id: 'invalid-id' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Invalid ticket ID format'),
          },
        ],
        isError: true,
      })

      const responseText = result.content[0].text
      expect(responseText).toContain('"success": false')
      expect(responseText).toContain('Invalid ticket ID format')
    })

    it('should handle special characters in ticket ID', async () => {
      const mockTicket = {
        id: 'test-#123',
        title: 'Special Chars Test',
        description: 'Testing special characters',
        status: 'pending',
        priority: 'medium',
        type: 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUseCase.execute.mockResolvedValue(mockTicket)

      const result = await getTicketByIdTool.handler({ id: 'test-#123' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-#123',
        })
      )

      const responseText = result.content[0].text
      expect(responseText).toContain('Special Chars Test')
      expect(responseText).toContain('"success": true')
    })

    it('should handle Unicode characters in ticket ID', async () => {
      const mockTicket = {
        id: 'テスト-123',
        title: 'Unicode Test',
        description: 'Testing Unicode characters',
        status: 'pending',
        priority: 'medium',
        type: 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUseCase.execute.mockResolvedValue(mockTicket)

      const result = await getTicketByIdTool.handler({ id: 'テスト-123' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'テスト-123',
        })
      )

      const responseText = result.content[0].text
      expect(responseText).toContain('Unicode Test')
      expect(responseText).toContain('"success": true')
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Failed to read from storage')
      storageError.name = 'StorageError'

      mockUseCase.execute.mockRejectedValue(storageError)

      const result = await getTicketByIdTool.handler({ id: 'test-123' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Failed to read from storage'),
          },
        ],
        isError: true,
      })

      const responseText = result.content[0].text
      expect(responseText).toContain('"success": false')
      expect(responseText).toContain('Failed to read from storage')
    })

    it('should handle concurrent access', async () => {
      const mockTicket = {
        id: 'concurrent-123',
        title: 'Concurrent Test',
        description: 'Testing concurrent access',
        status: 'pending',
        priority: 'medium',
        type: 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUseCase.execute.mockResolvedValue(mockTicket)

      // Execute multiple concurrent requests
      const promises = [
        getTicketByIdTool.handler({ id: 'concurrent-123' }),
        getTicketByIdTool.handler({ id: 'concurrent-123' }),
        getTicketByIdTool.handler({ id: 'concurrent-123' }),
      ]

      const results = await Promise.all(promises)

      expect(mockUseCase.execute).toHaveBeenCalledTimes(3)
      results.forEach(result => {
        const responseText = result.content[0].text
        expect(responseText).toContain('Concurrent Test')
        expect(responseText).toContain('"success": true')
      })
    })

    it('should handle different ticket statuses', async () => {
      const statuses = ['pending', 'in_progress', 'completed', 'archived'] as const

      for (const status of statuses) {
        const mockTicket = {
          id: `${status}-123`,
          title: `${status} Test`,
          description: `Testing ${status} status`,
          status,
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        mockUseCase.execute.mockResolvedValue(mockTicket)

        const result = await getTicketByIdTool.handler({ id: `${status}-123` })

        const responseText = result.content[0].text
        expect(responseText).toContain(status)
        expect(responseText).toContain(`${status} Test`)
        expect(responseText).toContain('"success": true')
      }
    })

    it('should handle tickets with special characters in content', async () => {
      const mockTicket = {
        id: 'special-content-123',
        title: 'Special: "Characters" & <HTML>',
        description: 'Testing special characters: @#$%^&*(){}[]|\\:";\'<>?,./',
        status: 'pending',
        priority: 'medium',
        type: 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUseCase.execute.mockResolvedValue(mockTicket)

      const result = await getTicketByIdTool.handler({ id: 'special-content-123' })

      const responseText = result.content[0].text
      const response = JSON.parse(responseText)
      expect(response.success).toBe(true)
      expect(response.ticket.title).toBe('Special: "Characters" & <HTML>')
      expect(response.ticket.description).toBe(
        'Testing special characters: @#$%^&*(){}[]|\\:";\'<>?,./'
      )
    })

    it('should handle performance with rapid requests', async () => {
      const mockTicket = {
        id: 'perf-123',
        title: 'Performance Test',
        description: 'Testing performance',
        status: 'pending',
        priority: 'medium',
        type: 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUseCase.execute.mockResolvedValue(mockTicket)

      const startTime = Date.now()

      // Execute 100 requests rapidly
      const promises = Array.from({ length: 100 }, (_, i) =>
        getTicketByIdTool.handler({ id: `perf-${i}` })
      )

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(100)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(mockUseCase.execute).toHaveBeenCalledTimes(100)
    })
  })
})
