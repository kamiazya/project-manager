import { GetAllTickets } from '@project-manager/application'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as containerModule from '../utils/container.ts'
import { listTicketsTool } from './list-tickets.ts'

// Mock the container
vi.mock('../utils/container.ts')

describe('listTicketsTool', () => {
  let mockUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn(),
    }
    vi.spyOn(containerModule, 'getGetAllTicketsUseCase').mockReturnValue(mockUseCase as any)
  })

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(listTicketsTool.name).toBe('list_tickets')
    })

    it('should have correct description', () => {
      expect(listTicketsTool.description).toBe('List all tickets with optional filters')
    })

    it('should have correct input schema', () => {
      expect(listTicketsTool.inputSchema).toBeDefined()
      expect(typeof listTicketsTool.inputSchema).toBe('object')
    })
  })

  describe('Tool Handler', () => {
    it('should return all tickets when no filters provided', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'First Ticket',
          description: 'First ticket description',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ticket-2',
          title: 'Second Ticket',
          description: 'Second ticket description',
          status: 'in_progress',
          priority: 'medium',
          type: 'feature',
          privacy: 'team',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({})

      expect(mockUseCase.execute).toHaveBeenCalled()

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(2)
      expect(response.tickets[0]).toMatchObject({
        id: 'ticket-1',
        title: 'First Ticket',
        status: 'pending',
        priority: 'high',
        type: 'bug',
      })
      expect(response.tickets[1]).toMatchObject({
        id: 'ticket-2',
        title: 'Second Ticket',
        status: 'in_progress',
        priority: 'medium',
        type: 'feature',
      })
      expect(response.total).toBe(2)
    })

    it('should filter tickets by status', async () => {
      const mockTickets = [
        {
          id: 'pending-1',
          title: 'Pending Ticket',
          description: 'Pending ticket description',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({ status: 'pending' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            status: 'pending',
          }),
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0]).toMatchObject({
        id: 'pending-1',
        title: 'Pending Ticket',
        status: 'pending',
      })
      expect(response.total).toBe(1)
    })

    it('should filter tickets by priority', async () => {
      const mockTickets = [
        {
          id: 'high-1',
          title: 'High Priority Ticket',
          description: 'High priority ticket description',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({ priority: 'high' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            priority: 'high',
          }),
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0]).toMatchObject({
        id: 'high-1',
        title: 'High Priority Ticket',
        priority: 'high',
      })
      expect(response.total).toBe(1)
    })

    it('should filter tickets by type', async () => {
      const mockTickets = [
        {
          id: 'bug-1',
          title: 'Bug Ticket',
          description: 'Bug ticket description',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({ type: 'bug' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            type: 'bug',
          }),
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0]).toMatchObject({
        id: 'bug-1',
        title: 'Bug Ticket',
        type: 'bug',
      })
      expect(response.total).toBe(1)
    })

    it('should limit number of results', async () => {
      const mockTickets = [
        {
          id: 'limited-1',
          title: 'Limited Ticket 1',
          description: 'Limited ticket description',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({ limit: 1 })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            limit: 1,
          }),
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0]).toMatchObject({
        id: 'limited-1',
        title: 'Limited Ticket 1',
      })
      expect(response.total).toBe(1)
    })

    it('should handle multiple filters simultaneously', async () => {
      const mockTickets = [
        {
          id: 'filtered-1',
          title: 'Filtered Ticket',
          description: 'Filtered ticket description',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({
        status: 'pending',
        priority: 'high',
        type: 'bug',
        limit: 10,
      })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            status: 'pending',
            priority: 'high',
            type: 'bug',
            limit: 10,
          }),
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0]).toMatchObject({
        id: 'filtered-1',
        title: 'Filtered Ticket',
        status: 'pending',
        priority: 'high',
        type: 'bug',
      })
      expect(response.total).toBe(1)
    })

    it('should handle empty results', async () => {
      mockUseCase.execute.mockResolvedValue({ tickets: [] })

      const result = await listTicketsTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(0)
      expect(response.total).toBe(0)
    })

    it('should handle empty results with filters', async () => {
      mockUseCase.execute.mockResolvedValue({ tickets: [] })

      const result = await listTicketsTool.handler({ status: 'completed' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(0)
      expect(response.total).toBe(0)
    })

    it('should handle use case errors', async () => {
      const useCaseError = new Error('Database connection failed')
      useCaseError.name = 'DatabaseError'

      mockUseCase.execute.mockRejectedValue(useCaseError)

      const result = await listTicketsTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
        isError: true,
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Database connection failed')
    })

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid status filter')
      validationError.name = 'ValidationError'

      mockUseCase.execute.mockRejectedValue(validationError)

      const result = await listTicketsTool.handler({ status: 'invalid' as any })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
        isError: true,
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Invalid status filter')
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Failed to read tickets from storage')
      storageError.name = 'StorageError'

      mockUseCase.execute.mockRejectedValue(storageError)

      const result = await listTicketsTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
        isError: true,
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Failed to read tickets from storage')
    })

    it('should handle large number of tickets', async () => {
      const mockTickets = Array.from({ length: 1000 }, (_, i) => ({
        id: `ticket-${i}`,
        title: `Ticket ${i}`,
        description: `Description ${i}`,
        status:
          i % 4 === 0
            ? 'pending'
            : i % 4 === 1
              ? 'in_progress'
              : i % 4 === 2
                ? 'completed'
                : 'archived',
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        type: i % 3 === 0 ? 'bug' : i % 3 === 1 ? 'feature' : 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const startTime = Date.now()
      const result = await listTicketsTool.handler({})
      const duration = Date.now() - startTime

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1000)
      expect(response.total).toBe(1000)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle concurrent requests', async () => {
      const mockTickets = [
        {
          id: 'concurrent-1',
          title: 'Concurrent Ticket',
          description: 'Concurrent ticket description',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      // Execute multiple concurrent requests
      const promises = [
        listTicketsTool.handler({}),
        listTicketsTool.handler({ status: 'pending' }),
        listTicketsTool.handler({ priority: 'high' }),
      ]

      const results = await Promise.all(promises)

      expect(mockUseCase.execute).toHaveBeenCalledTimes(3)
      results.forEach(result => {
        expect(result).toHaveProperty('content')
        expect(result.content).toHaveLength(1)
        expect(result.content[0]).toHaveProperty('text')
        const response = JSON.parse(result.content[0].text)
        expect(response.success).toBe(true)
      })
    })

    it('should handle different status values', async () => {
      const statuses = ['pending', 'in_progress', 'completed', 'archived'] as const

      for (const status of statuses) {
        const mockTickets = [
          {
            id: `${status}-1`,
            title: `${status} Ticket`,
            description: `${status} ticket description`,
            status,
            priority: 'medium',
            type: 'task',
            privacy: 'local-only',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

        mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

        const result = await listTicketsTool.handler({ status })

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: expect.any(String),
            },
          ],
        })

        const response = JSON.parse(result.content[0].text)
        expect(response.success).toBe(true)
        expect(response.tickets).toHaveLength(1)
        expect(response.tickets[0]).toMatchObject({
          id: `${status}-1`,
          title: `${status} Ticket`,
          status,
        })
      }
    })

    it('should handle different priority values', async () => {
      const priorities = ['high', 'medium', 'low'] as const

      for (const priority of priorities) {
        const mockTickets = [
          {
            id: `${priority}-1`,
            title: `${priority} Priority Ticket`,
            description: `${priority} priority ticket description`,
            status: 'pending',
            priority,
            type: 'task',
            privacy: 'local-only',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

        mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

        const result = await listTicketsTool.handler({ priority })

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: expect.any(String),
            },
          ],
        })

        const response = JSON.parse(result.content[0].text)
        expect(response.success).toBe(true)
        expect(response.tickets).toHaveLength(1)
        expect(response.tickets[0]).toMatchObject({
          id: `${priority}-1`,
          title: `${priority} Priority Ticket`,
          priority,
        })
      }
    })

    it('should handle different type values', async () => {
      const types = ['bug', 'feature', 'task'] as const

      for (const type of types) {
        const mockTickets = [
          {
            id: `${type}-1`,
            title: `${type} Type Ticket`,
            description: `${type} type ticket description`,
            status: 'pending',
            priority: 'medium',
            type,
            privacy: 'local-only',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

        mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

        const result = await listTicketsTool.handler({ type })

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: expect.any(String),
            },
          ],
        })

        const response = JSON.parse(result.content[0].text)
        expect(response.success).toBe(true)
        expect(response.tickets).toHaveLength(1)
        expect(response.tickets[0]).toMatchObject({
          id: `${type}-1`,
          title: `${type} Type Ticket`,
          type,
        })
      }
    })

    it('should handle limit edge cases', async () => {
      const mockTickets = [
        {
          id: 'limit-1',
          title: 'Limit Test Ticket',
          description: 'Limit test description',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      // Test limit 0
      mockUseCase.execute.mockResolvedValue({ tickets: [] })
      let result = await listTicketsTool.handler({ limit: 0 })
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })
      const response0 = JSON.parse(result.content[0].text)
      expect(response0.success).toBe(true)
      expect(response0.tickets).toHaveLength(0)

      // Test negative limit
      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })
      result = await listTicketsTool.handler({ limit: -1 })
      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            limit: -1,
          }),
        })
      )

      // Test very large limit
      result = await listTicketsTool.handler({ limit: 999999 })
      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            limit: 999999,
          }),
        })
      )
    })

    it('should handle tickets with special characters', async () => {
      const mockTickets = [
        {
          id: 'special-1',
          title: 'Special: "Characters" & <HTML>',
          description: 'Testing special characters: @#$%^&*(){}[]|\\:";\'<>?,./',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].id).toBe('special-1')
      expect(response.tickets[0].title).toBe('Special: "Characters" & <HTML>')
    })

    it('should handle tickets with long content', async () => {
      const longTitle = 'Very long title that might cause display issues: ' + 'x'.repeat(100)
      const longDescription =
        'Very long description that might cause display issues: ' + 'x'.repeat(500)

      const mockTickets = [
        {
          id: 'long-1',
          title: longTitle,
          description: longDescription,
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await listTicketsTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].id).toBe('long-1')
      expect(response.tickets[0].title).toBe(longTitle)
    })

    it('should handle performance with rapid filtering', async () => {
      const mockTickets = [
        {
          id: 'perf-1',
          title: 'Performance Test',
          description: 'Performance test description',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const startTime = Date.now()

      // Execute 50 filtered requests rapidly
      const promises = Array.from({ length: 50 }, (_, i) =>
        listTicketsTool.handler({
          status: i % 2 === 0 ? 'pending' : ('completed' as any),
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : ('low' as any),
          type: i % 3 === 0 ? 'bug' : i % 3 === 1 ? 'feature' : ('task' as any),
        })
      )

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(50)
      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds
      expect(mockUseCase.execute).toHaveBeenCalledTimes(50)
    })
  })
})
