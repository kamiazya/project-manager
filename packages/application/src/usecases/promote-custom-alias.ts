import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

/**
 * Request for promoting a custom alias to canonical alias
 */
export interface PromoteCustomAliasRequest {
  /**
   * The ticket ID containing the alias to promote
   */
  ticketId: string

  /**
   * The custom alias to promote to canonical
   */
  alias: string
}

/**
 * Response from promoting a custom alias
 */
export interface PromoteCustomAliasResponse {
  /**
   * The promoted alias (now canonical)
   */
  alias: string

  /**
   * The previous canonical alias that was replaced
   */
  previousCanonicalAlias?: string

  /**
   * Whether the promotion was successful
   */
  wasPromoted: boolean

  /**
   * Total number of custom aliases after promotion
   */
  totalCustomAliases: number
}

/**
 * Use case for promoting custom aliases to canonical status
 *
 * This use case allows users to promote a user-defined custom alias
 * to become the new canonical (system) alias for a ticket.
 *
 * Business Rules:
 * - Only custom aliases can be promoted (not existing canonical aliases)
 * - The custom alias must exist on the ticket to be promoted
 * - Promoting a custom alias removes it from the custom aliases list
 * - The previous canonical alias (if any) is replaced and removed
 * - The promoted alias becomes the new canonical alias
 * - Aliases must pass validation and uniqueness checks
 */
export class PromoteCustomAliasUseCase extends BaseUseCase<
  PromoteCustomAliasRequest,
  PromoteCustomAliasResponse
> {
  private readonly resolutionService: TicketResolutionService

  constructor(private readonly ticketRepository: TicketRepository) {
    super()
    this.resolutionService = new TicketResolutionService(ticketRepository)
  }

  /**
   * Execute the use case
   */
  async execute(request: PromoteCustomAliasRequest): Promise<PromoteCustomAliasResponse> {
    // Resolve ticket by ID or alias
    const { ticket } = await this.resolutionService.resolveTicket(request.ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.ticketId, 'PromoteCustomAliasUseCase')
    }

    // Check if the alias is already the canonical alias
    if (ticket.aliases.canonical?.matches(request.alias)) {
      throw new TicketValidationError(
        `Alias "${request.alias}" is already the canonical alias for this ticket`,
        'canonicalAlias',
        request.alias
      )
    }

    // Check if the custom alias exists on this ticket
    const customAliasToPromote = ticket.aliases.custom.find(alias => alias.matches(request.alias))
    if (!customAliasToPromote) {
      throw new TicketValidationError(
        `Custom alias "${request.alias}" not found on ticket ${request.ticketId}`,
        'customAlias',
        request.alias
      )
    }

    // Validate alias format for canonical usage
    const canonicalAlias = TicketAlias.create(request.alias, 'canonical')

    // Check if alias is unique across all tickets (excluding this ticket)
    await this.validateAliasUniquenessForPromotion(request.alias, ticket)

    // Store previous canonical alias for response
    const previousCanonicalAlias = ticket.aliases.canonical?.value

    // Remove from custom aliases
    ticket.removeCustomAlias(request.alias)

    // Set as new canonical alias (replacing any existing one)
    ticket.replaceCanonicalAlias(canonicalAlias)

    await this.ticketRepository.save(ticket)

    return {
      alias: request.alias,
      previousCanonicalAlias,
      wasPromoted: true,
      totalCustomAliases: ticket.aliases.custom.length,
    }
  }

  /**
   * Validate that the alias is unique across all tickets when promoted to canonical
   * This checks against both canonical and custom aliases of other tickets
   */
  private async validateAliasUniquenessForPromotion(
    alias: string,
    currentTicket: Ticket
  ): Promise<void> {
    const allTickets = await this.ticketRepository.queryTickets()

    for (const ticket of allTickets) {
      // Skip the current ticket since we're promoting one of its custom aliases
      if (ticket.id.equals(currentTicket.id)) {
        continue
      }

      // Check against canonical alias of other tickets
      if (ticket.aliases.canonical?.matches(alias)) {
        throw new TicketValidationError(
          `Cannot promote alias "${alias}" to canonical. It conflicts with canonical alias of ticket ${ticket.id.value}`,
          'aliasConflict',
          alias
        )
      }

      // Check against custom aliases of other tickets
      const conflictingCustomAlias = ticket.aliases.custom.find(a => a.matches(alias))
      if (conflictingCustomAlias) {
        throw new TicketValidationError(
          `Cannot promote alias "${alias}" to canonical. It conflicts with custom alias of ticket ${ticket.id.value}`,
          'aliasConflict',
          alias
        )
      }
    }
  }
}
