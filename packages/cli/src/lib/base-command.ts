import { Command } from '@oclif/core'
import { StorageError, TicketNotFoundError, TicketValidationError } from '@project-manager/shared'
import type { Container } from 'inversify'
import { getServiceContainer } from '../utils/service-factory.ts'

/**
 * Base command class that provides common functionality for all commands.
 * Integrates with the existing service factory and dependency injection system.
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
 *   }
 * }
 */
export abstract class BaseCommand<
  TArgs extends Record<string, unknown> = Record<string, unknown>,
  TFlags extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
> extends Command {
  // Public container property allows easy mock injection during testing
  public container!: Container

  /**
   * Enable JSON flag support for all commands by default.
   * Commands can override this if they don't want JSON output.
   */
  static override enableJsonFlag = true

  /**
   * oclif lifecycle method called before command execution.
   * Initializes the dependency injection container.
   */
  async init(): Promise<void> {
    await super.init()
    this.container = getServiceContainer()
  }

  /**
   * Get a service by its identifier from the dependency injection container.
   */
  protected getService<T>(identifier: symbol): T {
    return this.container.get<T>(identifier)
  }

  /**
   * The `run` method is final to prevent subclass overrides.
   * Subclasses should implement `execute` instead to ensure consistent processing flow.
   */
  public async run(): Promise<TResult | void> {
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
  }

  /**
   * Abstract method that concrete commands must implement.
   * @param args Parsed command line arguments with type safety
   * @param flags Parsed command line flags with type safety
   * @returns Result data for JSON output (optional)
   */
  protected abstract execute(args: TArgs, flags: TFlags): Promise<TResult | void>

  /**
   * Error handler that provides user-friendly error messages.
   * Uses typed error classes for robust error handling.
   * Override this method to customize error handling.
   */
  async catch(error: Error): Promise<any> {
    // Handle domain-specific errors with type safety
    if (error instanceof TicketNotFoundError) {
      this.error(`Ticket not found: ${error.ticketId}`, { exit: 1 })
    } else if (error instanceof TicketValidationError) {
      const fieldInfo = error.field ? ` (field: ${error.field})` : ''
      this.error(`Validation error: ${error.message}${fieldInfo}`, { exit: 1 })
    } else if (error instanceof StorageError) {
      this.error(`Storage error: ${error.message}`, { exit: 1 })
    }

    // Let oclif handle unexpected errors
    return super.catch(error)
  }
}
