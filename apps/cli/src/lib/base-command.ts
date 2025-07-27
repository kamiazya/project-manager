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
      // Use cached SDK if configuration hasn't changed
      if (BaseCommand.cachedSDK) {
        this.sdk = BaseCommand.cachedSDK
        return
      }

      // Create new SDK and cache it
      this.sdk = await createProjectManagerSDK()
      BaseCommand.cachedSDK = this.sdk

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
   * Clear the SDK cache. Useful for testing or when configuration changes.
   */
  static clearSDKCache(): void {
    BaseCommand.cachedSDK = null
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
        } catch (error) {
          // Ignore cleanup errors during shutdown
        }
      }
    }

    // Flags to track shutdown state and prevent concurrent cleanup
    let hasExited = false
    let cleanupTimeout: NodeJS.Timeout | null = null
    let cleanupInProgress = false

    const performAsyncCleanup = async (): Promise<void> => {
      // Clear SDK references - no cleanup needed since we use synchronous loggers
      BaseCommand.cachedSDK = null
    }

    const gracefulShutdown = (_signal: NodeJS.Signals) => {
      // Prevent concurrent cleanup calls
      if (isShuttingDown || hasExited || cleanupInProgress) return
      isShuttingDown = true
      cleanupInProgress = true

      // Set a maximum cleanup time to prevent hanging
      cleanupTimeout = setTimeout(() => {
        if (!hasExited) {
          hasExited = true
          process.kill(process.pid, 'SIGKILL')
        }
      }, 3000) // 3-second timeout for graceful shutdown

      // Use setImmediate to ensure cleanup runs on next tick
      setImmediate(async () => {
        try {
          await performAsyncCleanup()
        } finally {
          cleanupInProgress = false
          // Ensure we exit only once
          if (!hasExited) {
            hasExited = true
            if (cleanupTimeout) clearTimeout(cleanupTimeout)
            process.exit(0)
          }
        }
      })
    }

    // Handle various exit scenarios
    process.on('exit', () => {
      // Synchronous cleanup only - no async operations allowed here
      // Clear timeout if still active
      if (cleanupTimeout) clearTimeout(cleanupTimeout)

      // Perform final synchronous cleanup
      if (BaseCommand.cachedSDK && !isShuttingDown) {
        BaseCommand.cachedSDK = null
      }
    })

    // Graceful shutdown signals - synchronous handlers that manage async cleanup
    process.on('SIGINT', () => {
      gracefulShutdown('SIGINT')
    })

    process.on('SIGTERM', () => {
      gracefulShutdown('SIGTERM')
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

    // Get the result from the execute method
    const result = await this.execute(typedArgs, typedFlags)

    // If JSON flag is enabled and result exists, return the result for testing/output
    if (typedFlags.json && result !== undefined) {
      this.logJson(result)
      return result
    }

    return undefined
  }

  /**
   * Abstract method that concrete commands must implement.
   * @param args Parsed command line arguments with type safety
   * @param flags Parsed command line flags with type safety
   * @returns Result data for JSON output (optional)
   */
  protected abstract execute(args: TArgs, flags: TFlags): Promise<TResult | undefined>

  /**
   * Outputs JSON data to stdout in a consistent format.
   * Override this method to customize JSON output formatting.
   * @param data The data to output as JSON
   */
  protected logJson(data: TResult): void {
    this.log(JSON.stringify(data, null, 2))
  }

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
