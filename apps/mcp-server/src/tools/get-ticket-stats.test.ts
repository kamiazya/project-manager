import { GetTicketStats } from '@project-manager/application'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as containerModule from '../utils/container.ts'
import { getTicketStatsTool } from './get-ticket-stats.ts'

// Mock the container
vi.mock('../utils/container.ts')

describe('getTicketStatsTool', () => {
  let mockUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn(),
    }
    vi.spyOn(containerModule, 'getGetTicketStatsUseCase').mockReturnValue(mockUseCase as any)
  })

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(getTicketStatsTool.name).toBe('get_ticket_stats')
    })

    it('should have correct description', () => {
      expect(getTicketStatsTool.description).toBe('Get statistics about tickets')
    })

    it('should have correct input schema', () => {
      expect(getTicketStatsTool.inputSchema).toBeDefined()
      expect(typeof getTicketStatsTool.inputSchema).toBe('object')
      expect(Object.keys(getTicketStatsTool.inputSchema)).toHaveLength(0) // Empty schema
    })
  })

  describe('Tool Handler', () => {
    it('should return complete ticket statistics', async () => {
      const mockStats = {
        stats: {
          total: 50,
          pending: 20,
          inProgress: 15,
          completed: 10,
          archived: 5,
          byPriority: {
            high: 10,
            medium: 25,
            low: 15,
          },
          byType: {
            bug: 20,
            feature: 15,
            task: 15,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const result = await getTicketStatsTool.handler({})

      expect(mockUseCase.execute).toHaveBeenCalledWith(expect.any(GetTicketStats.Request))

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
      expect(response.stats).toEqual({
        total: 50,
        byStatus: {
          pending: 20,
          inProgress: 15,
          completed: 10,
          archived: 5,
        },
        byPriority: {
          high: 10,
          medium: 25,
          low: 15,
        },
        byType: {
          bug: 20,
          feature: 15,
          task: 15,
        },
      })
    })

    it('should handle empty statistics (no tickets)', async () => {
      const mockStats = {
        stats: {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          archived: 0,
          byPriority: {
            high: 0,
            medium: 0,
            low: 0,
          },
          byType: {
            bug: 0,
            feature: 0,
            task: 0,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const result = await getTicketStatsTool.handler({})

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.stats.total).toBe(0)
      expect(response.stats.byStatus).toEqual({
        pending: 0,
        inProgress: 0,
        completed: 0,
        archived: 0,
      })
    })

    it('should handle statistics with only one status', async () => {
      const mockStats = {
        stats: {
          total: 100,
          pending: 100,
          inProgress: 0,
          completed: 0,
          archived: 0,
          byPriority: {
            high: 30,
            medium: 50,
            low: 20,
          },
          byType: {
            bug: 40,
            feature: 35,
            task: 25,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const result = await getTicketStatsTool.handler({})

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.stats.total).toBe(100)
      expect(response.stats.byStatus.pending).toBe(100)
      expect(response.stats.byStatus.inProgress).toBe(0)
      expect(response.stats.byStatus.completed).toBe(0)
      expect(response.stats.byStatus.archived).toBe(0)
    })

    it('should handle statistics with only one priority', async () => {
      const mockStats = {
        stats: {
          total: 50,
          pending: 20,
          inProgress: 20,
          completed: 10,
          archived: 0,
          byPriority: {
            high: 50,
            medium: 0,
            low: 0,
          },
          byType: {
            bug: 25,
            feature: 15,
            task: 10,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const result = await getTicketStatsTool.handler({})

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.stats.byPriority.high).toBe(50)
      expect(response.stats.byPriority.medium).toBe(0)
      expect(response.stats.byPriority.low).toBe(0)
    })

    it('should handle statistics with only one type', async () => {
      const mockStats = {
        stats: {
          total: 75,
          pending: 25,
          inProgress: 25,
          completed: 20,
          archived: 5,
          byPriority: {
            high: 20,
            medium: 30,
            low: 25,
          },
          byType: {
            bug: 75,
            feature: 0,
            task: 0,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const result = await getTicketStatsTool.handler({})

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.stats.byType.bug).toBe(75)
      expect(response.stats.byType.feature).toBe(0)
      expect(response.stats.byType.task).toBe(0)
    })

    it('should handle large numbers of tickets', async () => {
      const mockStats = {
        stats: {
          total: 10000,
          pending: 3000,
          inProgress: 2500,
          completed: 3500,
          archived: 1000,
          byPriority: {
            high: 2000,
            medium: 5000,
            low: 3000,
          },
          byType: {
            bug: 4000,
            feature: 3500,
            task: 2500,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const result = await getTicketStatsTool.handler({})

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.stats.total).toBe(10000)

      // Verify totals add up
      const statusTotal =
        response.stats.byStatus.pending +
        response.stats.byStatus.inProgress +
        response.stats.byStatus.completed +
        response.stats.byStatus.archived
      expect(statusTotal).toBe(10000)

      const priorityTotal =
        response.stats.byPriority.high +
        response.stats.byPriority.medium +
        response.stats.byPriority.low
      expect(priorityTotal).toBe(10000)

      const typeTotal =
        response.stats.byType.bug + response.stats.byType.feature + response.stats.byType.task
      expect(typeTotal).toBe(10000)
    })

    it('should handle use case errors', async () => {
      const useCaseError = new Error('Failed to calculate statistics')
      useCaseError.name = 'StatisticsError'

      mockUseCase.execute.mockRejectedValue(useCaseError)

      const result = await getTicketStatsTool.handler({})

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
      expect(response.error).toBe('Failed to calculate statistics')
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Failed to read ticket data')
      storageError.name = 'StorageError'

      mockUseCase.execute.mockRejectedValue(storageError)

      const result = await getTicketStatsTool.handler({})

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
      expect(response.error).toBe('Failed to read ticket data')
    })

    it('should handle performance with rapid requests', async () => {
      const mockStats = {
        stats: {
          total: 100,
          pending: 40,
          inProgress: 30,
          completed: 20,
          archived: 10,
          byPriority: {
            high: 20,
            medium: 50,
            low: 30,
          },
          byType: {
            bug: 40,
            feature: 35,
            task: 25,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const startTime = Date.now()

      // Execute 100 rapid requests
      const promises = Array.from({ length: 100 }, () => getTicketStatsTool.handler({}))

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(100)
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
      expect(mockUseCase.execute).toHaveBeenCalledTimes(100)

      // Verify all results are consistent
      results.forEach(result => {
        const response = JSON.parse(result.content[0].text)
        expect(response.success).toBe(true)
        expect(response.stats.total).toBe(100)
      })
    })

    it('should return consistent snapshot of statistics', async () => {
      // Test that statistics represent a consistent point in time
      const mockStats1 = {
        stats: {
          total: 50,
          pending: 20,
          inProgress: 15,
          completed: 10,
          archived: 5,
          byPriority: { high: 10, medium: 25, low: 15 },
          byType: { bug: 20, feature: 15, task: 15 },
        },
      }

      const mockStats2 = {
        stats: {
          total: 55, // Total changed
          pending: 22,
          inProgress: 16,
          completed: 11,
          archived: 6,
          byPriority: { high: 11, medium: 27, low: 17 },
          byType: { bug: 22, feature: 16, task: 17 },
        },
      }

      mockUseCase.execute.mockResolvedValueOnce(mockStats1).mockResolvedValueOnce(mockStats2)

      const result1 = await getTicketStatsTool.handler({})
      const result2 = await getTicketStatsTool.handler({})

      const response1 = JSON.parse(result1.content[0].text)
      const response2 = JSON.parse(result2.content[0].text)

      // First call should return first snapshot
      expect(response1.stats.total).toBe(50)

      // Second call should return second snapshot
      expect(response2.stats.total).toBe(55)

      // Each snapshot should be internally consistent
      expect(
        response1.stats.byStatus.pending +
          response1.stats.byStatus.inProgress +
          response1.stats.byStatus.completed +
          response1.stats.byStatus.archived
      ).toBe(50)

      expect(
        response2.stats.byStatus.pending +
          response2.stats.byStatus.inProgress +
          response2.stats.byStatus.completed +
          response2.stats.byStatus.archived
      ).toBe(55)
    })

    it('should handle zero values in statistics gracefully', async () => {
      const mockStats = {
        stats: {
          total: 10,
          pending: 10,
          inProgress: 0,
          completed: 0,
          archived: 0,
          byPriority: {
            high: 0,
            medium: 10,
            low: 0,
          },
          byType: {
            bug: 0,
            feature: 0,
            task: 10,
          },
        },
      }

      mockUseCase.execute.mockResolvedValue(mockStats)

      const result = await getTicketStatsTool.handler({})

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)

      // Verify zero values are properly returned
      expect(response.stats.byStatus.inProgress).toBe(0)
      expect(response.stats.byStatus.completed).toBe(0)
      expect(response.stats.byStatus.archived).toBe(0)
      expect(response.stats.byPriority.high).toBe(0)
      expect(response.stats.byPriority.low).toBe(0)
      expect(response.stats.byType.bug).toBe(0)
      expect(response.stats.byType.feature).toBe(0)
    })

    it('should handle unexpected errors gracefully', async () => {
      const unexpectedError = new Error('Unexpected error occurred')

      mockUseCase.execute.mockRejectedValue(unexpectedError)

      const result = await getTicketStatsTool.handler({})

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
      expect(response.error).toBe('Unexpected error occurred')
    })
  })
})
