import { Command } from '@oclif/core'
import { createProjectManagerSDK, ProjectManagerSDK } from '@project-manager/sdk'

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
 *   async execute(args: CreateArgs, flags: CreateFlags): Promise<void> {
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

  /**
   * Enable JSON flag support for all commands by default.
   * Commands can override this if they don't want JSON output.
   */
  static override enableJsonFlag = true

  /**
   * oclif lifecycle method called before command execution.
   * Initializes the ProjectManagerSDK.
   */
  async init(): Promise<void> {
    await super.init()

    try {
      // Get environment (development/production)
      const environment = process.env.NODE_ENV === 'development' ? 'development' : 'production'

      // Initialize SDK for CLI usage
      this.sdk = await createProjectManagerSDK({
        environment,
      })
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Failed to initialize SDK: ${error.message}`)
      } else {
        this.error('Failed to initialize SDK due to an unknown error')
      }
    }
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
   * Error handler that provides user-friendly error messages.
   * Uses generic error handling approach to avoid coupling to specific error types.
   * Override this method to customize error handling.
   */
  async catch(error: Error): Promise<any> {
    // Handle domain-specific errors by error message patterns
    if (error.message.includes('Ticket not found')) {
      this.error(`Ticket not found: ${error.message}`, { exit: 1 })
    } else if (
      error.message.includes('Validation error') ||
      error.name === 'TicketValidationError'
    ) {
      this.error(`Validation error: ${error.message}`, { exit: 1 })
    } else if (error.message.includes('Storage error') || error.name === 'StorageError') {
      this.error(`Storage error: ${error.message}`, { exit: 1 })
    }

    // Let oclif handle unexpected errors
    return super.catch(error)
  }
}
