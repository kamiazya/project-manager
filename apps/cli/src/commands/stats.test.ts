import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getGetTicketStatsUseCase, getServiceContainer } from '../utils/service-factory.ts'
import { StatsCommand } from './stats.ts'

// Mock the service factory module
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
  getGetTicketStatsUseCase: vi.fn(),
}))

// Mock the output module to check formatted output
vi.mock('../utils/output.ts', () => ({
  formatStats: vi.fn(stats => `Total: ${stats.total} tickets`),
}))

// Mock the oclif Command class
vi.mock('@oclif/core', () => ({
  Command: class MockCommand {
    config = { runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }) }
    argv: string[]

    constructor(argv: string[]) {
      this.argv = argv
    }

    async init() {}
    async parse() {
      // Simple parsing logic for tests
      const args: any = {}
      const flags: any = {}

      // Handle flags
      for (let i = 0; i < this.argv.length; i++) {
        if (this.argv[i] === '--json') {
          flags.json = true
        }
      }

      return { args, flags }
    }
    log = vi.fn()
    logJson = vi.fn()
    error = vi.fn()
    async catch() {}
  },
  Args: {
    string: vi.fn(() => ({ description: '', required: false })),
  },
  Flags: {
    boolean: vi.fn(() => ({ description: '', required: false })),
    string: vi.fn(() => ({ description: '', required: false })),
  },
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
    vi.mocked(getGetTicketStatsUseCase).mockReturnValue(mockGetTicketStatsUseCase)
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
    const cmd = new StatsCommand([], {} as any)
    await cmd.init()

    const logSpy = vi.spyOn(cmd, 'log').mockImplementation(() => {})
    await cmd.run()

    // Assert
    expect(getGetTicketStatsUseCase).toHaveBeenCalled()
    expect(mockGetTicketStatsUseCase.execute).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('Total: 10 tickets')
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
    const cmd = new StatsCommand(['--json'], {} as any)
    await cmd.init()

    const result = await cmd.run()

    // Assert
    expect(mockGetTicketStatsUseCase.execute).toHaveBeenCalled()
    expect(result).toEqual(mockStats)
  })

  it('should handle errors gracefully', async () => {
    // Arrange
    mockGetTicketStatsUseCase.execute.mockRejectedValue(new Error('Database connection failed'))

    // Act
    const cmd = new StatsCommand([], {} as any)
    await cmd.init()

    // Assert
    await expect(cmd.run()).rejects.toThrow('Database connection failed')
  })
})
