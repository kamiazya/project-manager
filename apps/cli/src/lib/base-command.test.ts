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
        updateContent: vi.fn(),
        updateStatus: vi.fn(),
        delete: vi.fn(),
        search: vi.fn(),
      },
    } as unknown as ProjectManagerSDK

    // Mock createProjectManagerSDK to return our mock SDK
    vi.mocked(createProjectManagerSDK).mockResolvedValue(mockSDK)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clear SDK cache after each test
    BaseCommand.clearSDKCache()
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
      environment: 'auto',
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
    const mockTickets = [
      {
        id: '1',
        title: 'Test ticket',
        status: 'pending',
        priority: 'medium',
        type: 'task',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    vi.mocked(mockSDK.tickets.search).mockResolvedValue(mockTickets)

    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        const tickets = await this.sdk.tickets.search({})
        expect(tickets).toBe(mockTickets)
      }
    }

    const cmd = new TestCommand([], {} as any)
    await cmd.init()
    await cmd.run()

    expect(mockSDK.tickets.search).toHaveBeenCalledTimes(1)
  })

  describe('SDK Caching', () => {
    it('should cache SDK instance across multiple command executions', async () => {
      class TestCommand extends BaseCommand {
        async execute(): Promise<void> {
          expect(this.sdk).toBe(mockSDK)
        }
      }

      // First command execution
      const cmd1 = new TestCommand([], {} as any)
      await cmd1.init()
      await cmd1.run()

      // Second command execution should use cached SDK
      const cmd2 = new TestCommand([], {} as any)
      await cmd2.init()
      await cmd2.run()

      // SDK should only be created once
      expect(createProjectManagerSDK).toHaveBeenCalledTimes(1)
      expect(cmd1.sdk).toBe(cmd2.sdk)
    })

    it('should invalidate cache when configuration changes', async () => {
      const mockSDK2 = { different: 'sdk' } as unknown as ProjectManagerSDK
      vi.mocked(createProjectManagerSDK)
        .mockResolvedValueOnce(mockSDK)
        .mockResolvedValueOnce(mockSDK2)

      class TestCommand extends BaseCommand {
        constructor(
          argv: string[],
          config: any,
          private customNodeEnv?: string
        ) {
          super(argv, config)
        }

        async execute(): Promise<void> {}

        // Override to simulate environment change
        private generateConfigHash(config: { environment: 'auto' }): string {
          const hashData = {
            environment: config.environment,
            nodeEnv: this.customNodeEnv || process.env.NODE_ENV,
          }
          return JSON.stringify(hashData)
        }
      }

      // First command with default environment
      const cmd1 = new TestCommand([], {} as any)
      await cmd1.init()

      // Simulate environment change
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'different-environment'

      // Second command should create new SDK due to environment change
      const cmd2 = new TestCommand([], {} as any)
      await cmd2.init()

      // Restore environment
      process.env.NODE_ENV = originalNodeEnv

      // Should have been called twice due to configuration change
      expect(createProjectManagerSDK).toHaveBeenCalledTimes(2)
    })

    it('should allow manual cache clearing', async () => {
      class TestCommand extends BaseCommand {
        async execute(): Promise<void> {}
      }

      // First initialization
      const cmd1 = new TestCommand([], {} as any)
      await cmd1.init()

      // Clear cache manually
      BaseCommand.clearSDKCache()

      // Second initialization should create new SDK
      const cmd2 = new TestCommand([], {} as any)
      await cmd2.init()

      expect(createProjectManagerSDK).toHaveBeenCalledTimes(2)
    })
  })
})
