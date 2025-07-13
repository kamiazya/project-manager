import { Command } from '@oclif/core'
import { StorageError, TicketNotFoundError, TicketValidationError } from '@project-manager/shared'
import type { Container } from 'inversify'
import { getServiceContainer } from '../utils/service-factory.ts'

/**
 * Base command class that provides common functionality for all commands.
 * Integrates with the existing service factory and dependency injection system.
 */
export abstract class BaseCommand extends Command {
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
  public async run(): Promise<void> {
    const { args, flags } = await this.parse(this.constructor as any)

    // Get the result from the execute method
    const result = await this.execute(args, flags)

    // If JSON flag is enabled and result exists, oclif automatically outputs as JSON
    if (flags.json && result !== undefined) {
      this.logJson(result)
    }
  }

  /**
   * Abstract method that concrete commands must implement.
   * @param args Parsed command line arguments
   * @param flags Parsed command line flags
   * @returns Result data for JSON output (optional)
   */
  protected abstract execute(args: any, flags: any): Promise<any>

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
