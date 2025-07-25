import { Command } from '@oclif/core'
import {
  ApplicationError,
  createProjectManagerSDK,
  InfrastructureError,
  PersistenceError,
  ProjectManagerSDK,
  TicketNotFoundError,
  TicketValidationError,
  UseCaseExecutionError,
} from '@project-manager/sdk'

/**
 * Base command class that provides common functionality for all commands.
 * Integrates with the ProjectManagerSDK for unified access to project management functionality.
 *
 * @template TArgs - Type for command arguments
 * @template TFlags - Type for command flags
 * @template TResult - Type for command result (for JSON output)
 *
 * @example
 * // Example usage with specific types
 * interface CreateArgs extends Record<string, unknown> {
 *   title?: string
 * }
 *
 * interface CreateFlags extends Record<string, unknown> {
 *   priority?: string
 *   json?: boolean
 * }
 *
 * export class CreateCommand extends BaseCommand<CreateArgs, CreateFlags, void> {
 *   async execute(args: CreateArgs, flags: CreateFlags): void {
 *     // TypeScript provides full type safety for args and flags
 *     if (args.title) { ... }
 *     if (flags.priority) { ... }
 *
 *     // Access SDK directly
 *     const result = await this.sdk.tickets.create({
 *       title: args.title,
 *       description: 'New ticket'
 *     })
 *   }
 * }
 */
export abstract class BaseCommand<
  TArgs extends Record<string, unknown> = Record<string, unknown>,
  TFlags extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
> extends Command {
  // Public SDK property allows easy access to all project management functionality
  public sdk!: ProjectManagerSDK

  // Static cache for SDK instances - following oclif Cache pattern
  private static cachedSDK: ProjectManagerSDK | null = null
  private static lastConfigHash: string | null = null
  private static cleanupRegistered = false

  /**
   * Enable JSON flag support for all commands by default.
   * Commands can override this if they don't want JSON output.
   */
  static override enableJsonFlag = true

  /**
   * oclif lifecycle method called before command execution.
   * Initializes the ProjectManagerSDK with caching support.
   */
  async init(): Promise<void> {
    await super.init()

    try {
      const config = { environment: 'auto' as const }
      const configHash = this.generateConfigHash(config)

      // Use cached SDK if configuration hasn't changed
      if (BaseCommand.cachedSDK && BaseCommand.lastConfigHash === configHash) {
        this.sdk = BaseCommand.cachedSDK
        return
      }

      // Create new SDK and cache it
      this.sdk = await createProjectManagerSDK(config)
      BaseCommand.cachedSDK = this.sdk
      BaseCommand.lastConfigHash = configHash

      // Register global cleanup handler once
      if (!BaseCommand.cleanupRegistered) {
        BaseCommand.setupGlobalCleanup()
        BaseCommand.cleanupRegistered = true
      }
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Failed to initialize SDK: ${error.message}`)
      } else {
        this.error('Failed to initialize SDK due to an unknown error')
      }
    }
  }

  /**
   * Generates a hash for SDK configuration to enable cache invalidation.
   * @param config SDK configuration object
   * @returns Configuration hash string
   */
  private generateConfigHash(config: { environment: 'auto' }): string {
    // Include environment variables that might affect SDK behavior
    const hashData = {
      environment: config.environment,
      nodeEnv: process.env.NODE_ENV,
      // Add other environment variables that affect SDK configuration
    }
    return JSON.stringify(hashData)
  }

  /**
   * Clear the SDK cache. Useful for testing or when configuration changes.
   */
  static clearSDKCache(): void {
    BaseCommand.cachedSDK = null
    BaseCommand.lastConfigHash = null
  }

  /**
   * Setup global cleanup handlers for process exit.
   */
  private static setupGlobalCleanup(): void {
    // Flag to track if graceful shutdown has been initiated
    let isShuttingDown = false

    const performSyncCleanup = () => {
      if (isShuttingDown) return
      isShuttingDown = true

      // Only perform synchronous cleanup operations
      if (BaseCommand.cachedSDK) {
        try {
          // Clear the cached SDK reference to prevent further usage
          BaseCommand.cachedSDK = null
          BaseCommand.lastConfigHash = null
        } catch (error) {
          // Ignore cleanup errors during shutdown
        }
      }
    }

    const performAsyncCleanup = async () => {
      if (isShuttingDown) return
      isShuttingDown = true

      if (BaseCommand.cachedSDK && typeof BaseCommand.cachedSDK.shutdown === 'function') {
        try {
          // Set a timeout to prevent hanging during shutdown
          const shutdownPromise = BaseCommand.cachedSDK.shutdown()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Shutdown timeout')), 5000)
          )

          await Promise.race([shutdownPromise, timeoutPromise])
        } catch (error) {
          // Don't log to prevent hanging on exit
        } finally {
          BaseCommand.cachedSDK = null
          BaseCommand.lastConfigHash = null
        }
      }
    }

    // Handle various exit scenarios
    process.on('exit', () => {
      // Synchronous cleanup only - no async operations allowed here
      performSyncCleanup()
    })

    process.on('SIGINT', async () => {
      await performAsyncCleanup()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await performAsyncCleanup()
      process.exit(0)
    })

    // CRITICAL: These handlers must be synchronous per Node.js documentation
    // After uncaughtException/unhandledRejection, the process is in an unknown state
    // and async operations can cause unpredictable behavior or hanging
    process.on('uncaughtException', error => {
      // Only synchronous cleanup - no async operations allowed
      performSyncCleanup()

      // Log error synchronously if possible
      try {
        console.error('Uncaught Exception:', error)
      } catch {
        // Ignore logging errors during crash
      }

      // Terminate immediately - don't use process.exit() as it may hang
      process.kill(process.pid, 'SIGTERM')
    })

    process.on('unhandledRejection', (reason, promise) => {
      // Only synchronous cleanup - no async operations allowed
      performSyncCleanup()

      // Log error synchronously if possible
      try {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason)
      } catch {
        // Ignore logging errors during crash
      }

      // Terminate immediately - don't use process.exit() as it may hang
      process.kill(process.pid, 'SIGTERM')
    })
  }

  /**
   * The `run` method is final to prevent subclass overrides.
   * Subclasses should implement `execute` instead to ensure consistent processing flow.
   */
  public async run(): Promise<TResult | undefined> {
    // Use proper typing for the constructor parameter
    const CommandClass = this.constructor as typeof BaseCommand
    const { args, flags } = await this.parse(CommandClass)

    // Type guard to ensure args and flags match expected types
    const typedArgs = args as TArgs
    const typedFlags = flags as TFlags & { json?: boolean }

    try {
      // Get the result from the execute method
      const result = await this.execute(typedArgs, typedFlags)

      // If JSON flag is enabled and result exists, return the result for testing/output
      if (typedFlags.json && result !== undefined) {
        this.logJson(result)
        return result
      }

      return undefined
    } finally {
      // Ensure proper cleanup of SDK resources
      await this.cleanup()
    }
  }

  /**
   * Cleanup method called after command execution.
   * Properly shuts down SDK resources to prevent hanging.
   */
  private async cleanup(): Promise<void> {
    // No per-command cleanup needed since we use global process handlers
    // This prevents conflicts and ensures proper shutdown on process exit
  }

  /**
   * Abstract method that concrete commands must implement.
   * @param args Parsed command line arguments with type safety
   * @param flags Parsed command line flags with type safety
   * @returns Result data for JSON output (optional)
   */
  protected abstract execute(args: TArgs, flags: TFlags): Promise<TResult | undefined>

  /**
   * Type-safe error handler that provides user-friendly error messages.
   * Uses instanceof checks for robust error type detection with hierarchical error structure.
   * Override this method to customize error handling.
   */
  async catch(error: Error): Promise<any> {
    // Handle specific application errors using type-safe instanceof checks
    if (error instanceof TicketNotFoundError) {
      this.error(`Ticket not found: ${error.message}`, { exit: 1 })
    } else if (error instanceof TicketValidationError) {
      this.error(`Validation error: ${error.message}`, { exit: 1 })
    } else if (error instanceof PersistenceError) {
      this.error(`Persistence error: ${error.message}`, { exit: 1 })
    } else if (error instanceof InfrastructureError) {
      // Handles all infrastructure errors (including future LoggingError, ExternalServiceError, etc.)
      this.error(`Infrastructure error: ${error.message}`, { exit: 1 })
    } else if (error instanceof UseCaseExecutionError) {
      this.error(`Use case error: ${error.message}`, { exit: 1 })
    } else if (error instanceof ApplicationError) {
      // Generic application error handler for any other application errors
      this.error(`Application error: ${error.message}`, { exit: 1 })
    }

    // Let oclif handle unexpected errors
    return super.catch(error)
  }
}
