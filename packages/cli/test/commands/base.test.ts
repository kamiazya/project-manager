import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BaseCommand } from '../../src/commands/base.ts'
import { getServiceContainer } from '../../src/utils/service-factory.ts'

// Mock the service factory module
vi.mock('../../src/utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
}))

describe('BaseCommand', () => {
  let mockContainer: Container

  beforeEach(() => {
    // Mock the service container
    mockContainer = {
      get: vi.fn(),
    } as unknown as Container

    // Mock getServiceContainer to return our mock container
    vi.mocked(getServiceContainer).mockReturnValue(mockContainer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize service container', async () => {
    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        // Check that the container was initialized
        expect(this.container).toBe(mockContainer)
      }
    }

    const cmd = new TestCommand([], {} as any)
    await cmd.init() // init is now called explicitly
    await cmd.run()

    expect(getServiceContainer).toHaveBeenCalledTimes(1)
  })

  it('should handle errors gracefully', async () => {
    const testError = new Error('Test error')

    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        throw testError
      }
    }

    const cmd = new TestCommand([], {} as any)
    await cmd.init()

    // Mock the parent catch method to prevent actual error throwing
    const catchSpy = vi
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(cmd)), 'catch')
      .mockResolvedValue(undefined)

    // The catch method should be called when an error occurs
    try {
      await cmd.run()
    } catch (error) {
      // This is expected since we're testing error handling
    }

    expect(catchSpy).toHaveBeenCalled()
  })

  it('should provide access to services', async () => {
    const mockTicketService = {
      getAll: vi.fn().mockResolvedValue([]),
    }

    mockContainer.get = vi.fn().mockReturnValue(mockTicketService)

    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        const ticketService = this.getService('TicketService')
        expect(ticketService).toBe(mockTicketService)
      }
    }

    const cmd = new TestCommand([], {} as any)
    await cmd.init()
    await cmd.run()

    expect(mockContainer.get).toHaveBeenCalledWith('TicketService')
  })
})
