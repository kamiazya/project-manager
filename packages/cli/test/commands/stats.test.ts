import { runCommand } from '@oclif/test'
import { TYPES } from '@project-manager/core'
import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServiceContainer } from '../../src/utils/service-factory.ts'

// Mock the service factory module
vi.mock('../../src/utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
}))

// Mock the output module to check formatted output
vi.mock('../../src/utils/output.ts', () => ({
  formatStats: vi.fn(stats => `Total: ${stats.total} tickets`),
}))

describe('StatsCommand', () => {
  let mockContainer: Container
  let mockGetTicketStatsUseCase: any

  beforeEach(() => {
    // Mock use case
    mockGetTicketStatsUseCase = {
      execute: vi.fn(),
    }

    // Mock the service container
    mockContainer = {
      get: vi.fn().mockReturnValue(mockGetTicketStatsUseCase),
    } as unknown as Container

    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should display stats in default format', async () => {
    // Arrange
    const mockStats = {
      total: 10,
      byStatus: { pending: 5, in_progress: 3, completed: 2 },
      byPriority: { high: 2, medium: 5, low: 3 },
      byType: { feature: 4, bug: 3, task: 3 },
    }

    mockGetTicketStatsUseCase.execute.mockResolvedValue({
      stats: mockStats,
    })

    // Act
    const { stdout } = await runCommand('stats')

    // Assert
    expect(mockContainer.get).toHaveBeenCalledWith(TYPES.GetTicketStatsUseCase)
    expect(mockGetTicketStatsUseCase.execute).toHaveBeenCalled()
    expect(stdout).toContain('Total: 10 tickets')
  })

  it('should display stats in JSON format when --json flag is used', async () => {
    // Arrange
    const mockStats = {
      total: 10,
      byStatus: { pending: 5, in_progress: 3, completed: 2 },
      byPriority: { high: 2, medium: 5, low: 3 },
      byType: { feature: 4, bug: 3, task: 3 },
    }

    mockGetTicketStatsUseCase.execute.mockResolvedValue({
      stats: mockStats,
    })

    // Act
    const { stdout } = await runCommand('stats --json')

    // Assert
    expect(mockGetTicketStatsUseCase.execute).toHaveBeenCalled()
    expect(stdout).toContain('"total": 10')
    expect(stdout).toContain('"byStatus"')
  })

  it('should handle errors gracefully', async () => {
    // Arrange
    mockGetTicketStatsUseCase.execute.mockRejectedValue(new Error('Database connection failed'))

    // Act & Assert
    await expect(runCommand('stats')).rejects.toThrow('Database connection failed')
  })
})
