import { Ticket, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

/**
 * Request for clearing all custom aliases from a ticket
 */
export interface ClearCustomAliasesRequest {
  /**
   * The ticket ID from which to clear all custom aliases
   */
  ticketId: string

  /**
   * Whether to confirm the operation (safety check)
   */
  confirm?: boolean
}

/**
 * Response from clearing custom aliases
 */
export interface ClearCustomAliasesResponse {
  /**
   * The number of custom aliases that were removed
   */
  clearedCount: number

  /**
   * List of aliases that were removed
   */
  clearedAliases: string[]

  /**
   * Whether the clear operation was successful
   */
  wasCleared: boolean

  /**
   * The canonical alias that remains (if any)
   */
  remainingCanonicalAlias?: string
}

/**
 * Use case for clearing all custom aliases from a ticket
 *
 * This use case allows users to remove all custom aliases from a ticket
 * while preserving the canonical alias.
 *
 * Business Rules:
 * - Only custom aliases are removed (canonical alias is preserved)
 * - Requires confirmation to prevent accidental mass deletion
 * - Operation is atomic - either all custom aliases are removed or none
 * - Returns information about what was removed
 * - Cannot be undone once executed
 */
export class ClearCustomAliasesUseCase extends BaseUseCase<
  ClearCustomAliasesRequest,
  ClearCustomAliasesResponse
> {
  private readonly resolutionService: TicketResolutionService

  constructor(private readonly ticketRepository: TicketRepository) {
    super()
    this.resolutionService = new TicketResolutionService(ticketRepository)
  }

  /**
   * Execute the use case
   */
  async execute(request: ClearCustomAliasesRequest): Promise<ClearCustomAliasesResponse> {
    // Resolve ticket by ID or alias
    const { ticket } = await this.resolutionService.resolveTicket(request.ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.ticketId, 'ClearCustomAliasesUseCase')
    }

    // Safety check - require confirmation for destructive operation
    if (!request.confirm) {
      throw new TicketValidationError(
        'Clear operation requires confirmation. Set confirm=true to proceed.',
        'confirmationRequired',
        'false'
      )
    }

    // Get current custom aliases before clearing
    const customAliasesToClear = ticket.aliases.custom.map(alias => alias.value)
    const clearedCount = customAliasesToClear.length

    // If no custom aliases to clear, return early
    if (clearedCount === 0) {
      return {
        clearedCount: 0,
        clearedAliases: [],
        wasCleared: true,
        remainingCanonicalAlias: ticket.aliases.canonical?.value,
      }
    }

    // Clear all custom aliases
    // Create a copy of the aliases to iterate over to avoid mutation during iteration
    const aliasesToRemove = [...customAliasesToClear]

    for (const aliasValue of aliasesToRemove) {
      ticket.removeCustomAlias(aliasValue)
    }

    await this.ticketRepository.save(ticket)

    return {
      clearedCount,
      clearedAliases: customAliasesToClear,
      wasCleared: true,
      remainingCanonicalAlias: ticket.aliases.canonical?.value,
    }
  }
}
