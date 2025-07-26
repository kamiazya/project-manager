import type { AliasGenerator } from '@project-manager/domain'
import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

/**
 * Request for regenerating a ticket's canonical alias
 */
export interface RegenerateCanonicalAliasRequest {
  /**
   * The ticket ID for which to regenerate the canonical alias
   */
  ticketId: string

  /**
   * Whether to force regeneration even if a canonical alias already exists
   */
  force?: boolean
}

/**
 * Response from regenerating a canonical alias
 */
export interface RegenerateCanonicalAliasResponse {
  /**
   * The new canonical alias
   */
  newCanonicalAlias: string

  /**
   * The previous canonical alias that was replaced (if any)
   */
  previousCanonicalAlias?: string

  /**
   * Whether the regeneration was successful
   */
  wasRegenerated: boolean

  /**
   * Whether this was a forced regeneration
   */
  wasForced: boolean
}

/**
 * Use case for regenerating canonical aliases for tickets
 *
 * This use case allows users to regenerate the system-generated canonical alias
 * for a ticket using the current alias generation algorithm.
 *
 * Business Rules:
 * - Can regenerate canonical aliases for any ticket
 * - By default, won't regenerate if a canonical alias already exists (unless forced)
 * - Force option allows overwriting existing canonical aliases
 * - New canonical alias must pass uniqueness validation
 * - Uses the same generation algorithm as ticket creation
 */
export class RegenerateCanonicalAliasUseCase extends BaseUseCase<
  RegenerateCanonicalAliasRequest,
  RegenerateCanonicalAliasResponse
> {
  private readonly resolutionService: TicketResolutionService

  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly aliasGenerator: AliasGenerator
  ) {
    super()
    this.resolutionService = new TicketResolutionService(ticketRepository)
  }

  /**
   * Execute the use case
   */
  async execute(
    request: RegenerateCanonicalAliasRequest
  ): Promise<RegenerateCanonicalAliasResponse> {
    // Resolve ticket by ID or alias
    const { ticket } = await this.resolutionService.resolveTicket(request.ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.ticketId, 'RegenerateCanonicalAliasUseCase')
    }

    // Check if canonical alias already exists and force is not specified
    const existingCanonicalAlias = ticket.aliases.canonical?.value
    if (existingCanonicalAlias && !request.force) {
      throw new TicketValidationError(
        `Ticket ${request.ticketId} already has canonical alias "${existingCanonicalAlias}". Use force=true to regenerate.`,
        'canonicalAliasExists',
        existingCanonicalAlias
      )
    }

    // Generate new canonical alias
    const newCanonicalAliasValue = this.aliasGenerator.generate(ticket.id)

    // Validate that the new alias is unique
    await this.validateAliasUniqueness(newCanonicalAliasValue, ticket)

    // Store previous canonical alias for response
    const previousCanonicalAlias = existingCanonicalAlias

    // Create new canonical alias
    const newCanonicalAlias = TicketAlias.create(newCanonicalAliasValue, 'canonical')

    // Set canonical alias on ticket (replacing any existing one)
    if (existingCanonicalAlias) {
      ticket.replaceCanonicalAlias(newCanonicalAlias)
    } else {
      ticket.setCanonicalAlias(newCanonicalAlias)
    }

    await this.ticketRepository.save(ticket)

    return {
      newCanonicalAlias: newCanonicalAliasValue,
      previousCanonicalAlias,
      wasRegenerated: true,
      wasForced: request.force || false,
    }
  }

  /**
   * Validate that the alias is unique across all tickets
   */
  private async validateAliasUniqueness(alias: string, currentTicket: Ticket): Promise<void> {
    const allTickets = await this.ticketRepository.queryTickets()

    for (const ticket of allTickets) {
      // Skip the current ticket
      if (ticket.id.equals(currentTicket.id)) {
        continue
      }

      // Check against canonical alias of other tickets
      if (ticket.aliases.canonical?.matches(alias)) {
        throw new TicketValidationError(
          `Cannot use alias "${alias}". It conflicts with canonical alias of ticket ${ticket.id.value}`,
          'aliasConflict',
          alias
        )
      }

      // Check against custom aliases of other tickets
      const conflictingCustomAlias = ticket.aliases.custom.find(a => a.matches(alias))
      if (conflictingCustomAlias) {
        throw new TicketValidationError(
          `Cannot use alias "${alias}". It conflicts with custom alias of ticket ${ticket.id.value}`,
          'aliasConflict',
          alias
        )
      }
    }
  }
}
