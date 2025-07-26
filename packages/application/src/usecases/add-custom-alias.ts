import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

/**
 * Request for adding a custom alias to a ticket
 */
export interface AddCustomAliasRequest {
  /**
   * The ticket ID to add an alias to
   */
  ticketId: string

  /**
   * The custom alias to add
   */
  alias: string
}

/**
 * Response from adding a custom alias
 */
export interface AddCustomAliasResponse {
  /**
   * The added alias
   */
  alias: string

  /**
   * Type of alias added
   */
  type: 'custom'

  /**
   * Whether the alias was added successfully
   */
  wasAdded: boolean

  /**
   * Total number of custom aliases after addition
   */
  totalCustomAliases: number
}

/**
 * Use case for adding custom aliases to tickets
 *
 * This use case allows users to add custom, user-defined aliases
 * to tickets as alternatives to system-generated canonical aliases.
 *
 * Business Rules:
 * - Users can add multiple custom aliases to a ticket
 * - Custom aliases must be unique across all tickets
 * - Custom aliases must pass TicketAlias validation
 * - Cannot add duplicate custom aliases to the same ticket
 * - Cannot add alias that conflicts with existing canonical aliases
 */
export class AddCustomAliasUseCase extends BaseUseCase<
  AddCustomAliasRequest,
  AddCustomAliasResponse
> {
  private readonly resolutionService: TicketResolutionService

  constructor(private readonly ticketRepository: TicketRepository) {
    super()
    this.resolutionService = new TicketResolutionService(ticketRepository)
  }

  /**
   * Execute the use case
   */
  async execute(request: AddCustomAliasRequest): Promise<AddCustomAliasResponse> {
    // Resolve ticket by ID or alias
    const { ticket } = await this.resolutionService.resolveTicket(request.ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.ticketId, 'AddCustomAliasUseCase')
    }

    // Validate alias format using TicketAlias validation
    const customAlias = TicketAlias.create(request.alias, 'custom')

    // Check if alias is unique across all tickets
    await this.validateAliasUniqueness(request.alias, ticket)

    // Check if ticket already has this custom alias
    const existingCustomAlias = ticket.aliases.custom.find(
      alias => alias.value.toLowerCase() === request.alias.toLowerCase()
    )
    if (existingCustomAlias) {
      throw new TicketValidationError(
        `Ticket already has custom alias "${request.alias}"`,
        'customAlias',
        request.alias
      )
    }

    // Add custom alias to ticket
    ticket.addCustomAlias(customAlias)
    await this.ticketRepository.save(ticket)

    return {
      alias: customAlias.value,
      type: 'custom',
      wasAdded: true,
      totalCustomAliases: ticket.aliases.custom.length,
    }
  }

  /**
   * Validate that the alias is unique across all tickets
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
