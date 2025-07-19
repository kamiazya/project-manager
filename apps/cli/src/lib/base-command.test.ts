import { createProjectManagerSDK, ProjectManagerSDK } from '@project-manager/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BaseCommand } from './base-command.ts'

// Mock the SDK module
vi.mock('@project-manager/sdk', () => ({
  ProjectManagerSDK: vi.fn(),
  createProjectManagerSDK: vi.fn(),
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
  let mockSDK: ProjectManagerSDK

  beforeEach(() => {
    // Mock the SDK
    mockSDK = {
      tickets: {
        create: vi.fn(),
        getById: vi.fn(),
        getAll: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        search: vi.fn(),
        getStats: vi.fn(),
      },
    } as unknown as ProjectManagerSDK

    // Mock createProjectManagerSDK to return our mock SDK
    vi.mocked(createProjectManagerSDK).mockResolvedValue(mockSDK)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize SDK', async () => {
    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        // Check that the SDK was initialized
        expect(this.sdk).toBe(mockSDK)
      }
    }

    const cmd = new TestCommand([], {} as any)
    await cmd.init() // init is now called explicitly
    await cmd.run()

    expect(createProjectManagerSDK).toHaveBeenCalledTimes(1)
    expect(createProjectManagerSDK).toHaveBeenCalledWith({
      environment: 'production',
    })
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

  it('should provide access to SDK methods', async () => {
    const mockTickets = [{ id: '1', title: 'Test ticket' }]
    mockSDK.tickets.getAll = vi.fn().mockResolvedValue(mockTickets)

    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        const tickets = await this.sdk.tickets.getAll()
        expect(tickets).toBe(mockTickets)
      }
    }

    const cmd = new TestCommand([], {} as any)
    await cmd.init()
    await cmd.run()

    expect(mockSDK.tickets.getAll).toHaveBeenCalledTimes(1)
  })
})
