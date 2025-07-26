import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

/**
 * Request for renaming a custom alias on a ticket
 */
export interface RenameCustomAliasRequest {
  /**
   * The ticket ID containing the alias to rename
   */
  ticketId: string

  /**
   * The current alias name to be renamed
   */
  oldAlias: string

  /**
   * The new alias name
   */
  newAlias: string
}

/**
 * Response from renaming a custom alias
 */
export interface RenameCustomAliasResponse {
  /**
   * The old alias name
   */
  oldAlias: string

  /**
   * The new alias name
   */
  newAlias: string

  /**
   * Whether the alias was renamed successfully
   */
  wasRenamed: boolean
}

/**
 * Use case for renaming custom aliases on tickets
 *
 * This use case allows users to change the name of custom aliases
 * while maintaining all business rules and constraints.
 *
 * Business Rules:
 * - Only custom aliases can be renamed (not canonical aliases)
 * - The old alias must exist on the ticket
 * - The new alias must be unique across all tickets
 * - The new alias must pass TicketAlias validation
 * - Cannot rename to the same name (self-reference)
 * - Cannot rename canonical aliases
 */
export class RenameCustomAliasUseCase extends BaseUseCase<
  RenameCustomAliasRequest,
  RenameCustomAliasResponse
> {
  private readonly resolutionService: TicketResolutionService

  constructor(private readonly ticketRepository: TicketRepository) {
    super()
    this.resolutionService = new TicketResolutionService(ticketRepository)
  }

  /**
   * Execute the use case
   */
  async execute(request: RenameCustomAliasRequest): Promise<RenameCustomAliasResponse> {
    // Resolve ticket by ID or alias
    const { ticket } = await this.resolutionService.resolveTicket(request.ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.ticketId, 'RenameCustomAliasUseCase')
    }

    // Check if trying to rename canonical alias
    if (ticket.aliases.canonical?.matches(request.oldAlias)) {
      throw new TicketValidationError(
        `Cannot rename canonical alias "${request.oldAlias}". Canonical aliases are system-generated and cannot be modified.`,
        'canonicalAlias',
        request.oldAlias
      )
    }

    // Check if the old custom alias exists on this ticket
    const existingCustomAlias = ticket.aliases.custom.find(alias => alias.matches(request.oldAlias))
    if (!existingCustomAlias) {
      throw new TicketValidationError(
        `Custom alias "${request.oldAlias}" not found on ticket ${request.ticketId}`,
        'oldAlias',
        request.oldAlias
      )
    }

    // Check for self-reference (renaming to same name)
    if (request.oldAlias.toLowerCase() === request.newAlias.toLowerCase()) {
      throw new TicketValidationError(
        `Cannot rename alias to itself: "${request.oldAlias}" → "${request.newAlias}"`,
        'newAlias',
        request.newAlias
      )
    }

    // Validate new alias format using TicketAlias validation
    const newCustomAlias = TicketAlias.create(request.newAlias, 'custom')

    // Check if new alias is unique across all tickets
    await this.validateAliasUniqueness(request.newAlias, ticket)

    // Check if ticket already has this new custom alias
    const duplicateCustomAlias = ticket.aliases.custom.find(
      alias => alias.value.toLowerCase() === request.newAlias.toLowerCase()
    )
    if (duplicateCustomAlias) {
      throw new TicketValidationError(
        `Ticket already has custom alias "${request.newAlias}"`,
        'newAlias',
        request.newAlias
      )
    }

    // Perform the rename: remove old alias and add new alias
    ticket.removeCustomAlias(request.oldAlias)
    ticket.addCustomAlias(newCustomAlias)
    await this.ticketRepository.save(ticket)

    return {
      oldAlias: request.oldAlias,
      newAlias: request.newAlias,
      wasRenamed: true,
    }
  }

  /**
   * Validate that the new alias is unique across all tickets
   */
  private async validateAliasUniqueness(alias: string, currentTicket: Ticket): Promise<void> {
    const existingTicket = await this.ticketRepository.findByAlias(alias)

    if (existingTicket && !existingTicket.id.equals(currentTicket.id)) {
      throw new TicketValidationError(
        `Alias "${alias}" is already in use by ticket ${existingTicket.id.value}. ` +
          `All aliases must be unique across all tickets.`,
        'alias',
        alias
      )
    }
  }
}
