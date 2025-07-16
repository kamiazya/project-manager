import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { GetTicketStatsUseCase } from './get-ticket-stats.ts'

// Use local class for testing
class GetTicketStatsRequest {
  constructor() {}
}

describe('GetTicketStatsUseCase', () => {
  let useCase: GetTicketStatsUseCase
  let mockTicketRepository: TicketRepository

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }
    useCase = new GetTicketStatsUseCase(mockTicketRepository)
  })

  describe('execute', () => {
    it('should call repository getStatistics method and return response', async () => {
      // Arrange
      const request = new GetTicketStatsRequest()
      const mockStats = {
        total: 5,
        pending: 2,
        inProgress: 1,
        completed: 1,
        archived: 1,
        byPriority: {
          high: 1,
          medium: 2,
          low: 2,
        },
        byType: {
          feature: 2,
          bug: 2,
          task: 1,
        },
      }

      vi.mocked(mockTicketRepository.getStatistics).mockResolvedValue(mockStats)

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(mockTicketRepository.getStatistics).toHaveBeenCalledOnce()
      expect(mockTicketRepository.findAll).not.toHaveBeenCalled()
      expect(result.stats.total).toBe(5)
      expect(result.stats.pending).toBe(2)
      expect(result.stats.byPriority.high).toBe(1)
      expect(result.stats.byType.feature).toBe(2)
    })

    it('should not call findAll method', async () => {
      // Arrange
      const request = new GetTicketStatsRequest()
      const mockStats = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        archived: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
        byType: { feature: 0, bug: 0, task: 0 },
      }

      vi.mocked(mockTicketRepository.getStatistics).mockResolvedValue(mockStats)

      // Act
      await useCase.execute(request)

      // Assert
      expect(mockTicketRepository.getStatistics).toHaveBeenCalledOnce()
      expect(mockTicketRepository.findAll).not.toHaveBeenCalled()
    })
  })
})
