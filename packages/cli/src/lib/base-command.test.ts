import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServiceContainer } from '../utils/service-factory.ts'
import { BaseCommand } from './base-command.ts'

// Mock the service factory module
vi.mock('../utils/service-factory.ts', () => ({
  getServiceContainer: vi.fn(),
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

    // The run method should propagate the error
    await expect(cmd.run()).rejects.toThrow('Test error')
  })

  it('should provide access to services', async () => {
    const mockTicketService = {
      getAll: vi.fn().mockResolvedValue([]),
    }

    mockContainer.get = vi.fn().mockReturnValue(mockTicketService)

    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        const ticketService = this.getService('TicketService' as any)
        expect(ticketService).toBe(mockTicketService)
      }
    }

    const cmd = new TestCommand([], {} as any)
    await cmd.init()
    await cmd.run()

    expect(mockContainer.get).toHaveBeenCalledWith('TicketService')
  })
})
