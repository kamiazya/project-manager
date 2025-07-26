import { TicketNotFoundError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

export interface ListAliasesRequest {
  readonly ticketId: string
}

export interface AliasInfo {
  readonly alias: string
  readonly type: 'canonical' | 'custom'
}

export interface ListAliasesResponse {
  readonly ticketId: string
  readonly aliases: readonly AliasInfo[]
}

export class ListAliasesUseCase {
  private readonly resolutionService: TicketResolutionService

  constructor(private readonly ticketRepository: TicketRepository) {
    this.resolutionService = new TicketResolutionService(ticketRepository)
  }

  async execute(request: ListAliasesRequest): Promise<ListAliasesResponse> {
    // Resolve ticket by ID or alias
    const { ticket } = await this.resolutionService.resolveTicket(request.ticketId)
    if (!ticket) {
      throw new TicketNotFoundError(request.ticketId, 'ListAliasesUseCase')
    }

    const aliases: AliasInfo[] = []

    // Add canonical alias if exists
    if (ticket.aliases.canonical) {
      aliases.push({
        alias: ticket.aliases.canonical.value,
        type: 'canonical',
      })
    }

    // Add custom aliases
    for (const customAlias of ticket.aliases.custom) {
      aliases.push({
        alias: customAlias.value,
        type: 'custom',
      })
    }

    return {
      ticketId: ticket.id.value,
      aliases,
    }
  }
}
