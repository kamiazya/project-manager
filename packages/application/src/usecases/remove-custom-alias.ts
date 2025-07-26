import { TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

/**
 * Request for removing a custom alias from a ticket
 */
export interface RemoveCustomAliasRequest {
  /**
   * The ticket ID to remove an alias from
   */
  ticketId: string

  /**
   * The custom alias to remove
   */
  alias: string
}

/**
 * Response from removing a custom alias
 */
export interface RemoveCustomAliasResponse {
  /**
   * The removed alias
   */
  alias: string

  /**
   * Whether the alias was removed successfully
   */
  wasRemoved: boolean

  /**
   * Total number of custom aliases after removal
   */
  totalCustomAliases: number
}

/**
 * Use case for removing custom aliases from tickets
 *
 * This use case allows users to remove custom, user-defined aliases
 * from tickets while preserving system-generated canonical aliases.
 *
 * Business Rules:
 * - Only custom aliases can be removed (not canonical aliases)
 * - The alias must exist on the ticket to be removed
 * - Cannot remove non-existent aliases
 * - Canonical aliases are protected from deletion
 */
export class RemoveCustomAliasUseCase extends BaseUseCase<
  RemoveCustomAliasRequest,
  RemoveCustomAliasResponse
> {
  private readonly resolutionService: TicketResolutionService

  constructor(private readonly ticketRepository: TicketRepository) {
    super()
    this.resolutionService = new TicketResolutionService(ticketRepository)
  }

  /**
   * Execute the use case
   */
  async execute(request: RemoveCustomAliasRequest): Promise<RemoveCustomAliasResponse> {
    // Resolve ticket by ID or alias
    const { ticket } = await this.resolutionService.resolveTicket(request.ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.ticketId, 'RemoveCustomAliasUseCase')
    }

    // Check if trying to remove canonical alias
    if (ticket.aliases.canonical?.matches(request.alias)) {
      throw new TicketValidationError(
        `Cannot remove canonical alias "${request.alias}". Canonical aliases are system-generated and protected from deletion.`,
        'canonicalAlias',
        request.alias
      )
    }

    // Check if the custom alias exists on this ticket
    const customAlias = ticket.aliases.custom.find(alias => alias.matches(request.alias))
    if (!customAlias) {
      throw new TicketValidationError(
        `Custom alias "${request.alias}" not found on ticket ${request.ticketId}`,
        'customAlias',
        request.alias
      )
    }

    // Remove custom alias from ticket
    ticket.removeCustomAlias(request.alias)
    await this.ticketRepository.save(ticket)

    return {
      alias: request.alias,
      wasRemoved: true,
      totalCustomAliases: ticket.aliases.custom.length,
    }
  }
}
