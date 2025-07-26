import type { Ticket } from '@project-manager/domain'

/**
 * Standard ticket response interface for data transfer
 */
export interface TicketResponse {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly priority: string
  readonly type: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly description?: string
  readonly aliases?: {
    readonly canonical?: string
    readonly custom: readonly string[]
  }
}

/**
 * Factory function to create TicketResponse from domain entity
 */
export function createTicketResponse(ticket: Ticket): TicketResponse {
  // Extract alias information
  const aliases = ticket.aliases
  const aliasData =
    aliases.canonical || aliases.custom.length > 0
      ? {
          canonical: aliases.canonical?.value,
          custom: aliases.custom.map(alias => alias.value),
        }
      : undefined

  return {
    id: ticket.id.value,
    title: ticket.title.value,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    description: ticket.description?.value,
    aliases: aliasData,
  }
}
