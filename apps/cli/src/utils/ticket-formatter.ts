import type { TicketResponse } from '@project-manager/sdk'

/**
 * Utility for formatting ticket output consistently across CLI commands
 */
export class TicketFormatter {
  /**
   * Format a ticket response for display in the CLI
   */
  static format(ticket: TicketResponse): string {
    // Format alias information
    let aliasOutput = ''
    if (ticket.aliases) {
      const aliasLines = []
      if (ticket.aliases.canonical) {
        aliasLines.push(`  Canonical: ${ticket.aliases.canonical}`)
      }
      if (ticket.aliases.custom.length > 0) {
        aliasLines.push(`  Custom: ${ticket.aliases.custom.join(', ')}`)
      }
      if (aliasLines.length > 0) {
        aliasOutput = `\nAliases:\n${aliasLines.join('\n')}`
      }
    }

    // Format and return the ticket
    return `ID: ${ticket.id}\nTitle: ${ticket.title}\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nType: ${ticket.type}\nDescription: ${ticket.description}${aliasOutput}\nCreated: ${ticket.createdAt}\nUpdated: ${ticket.updatedAt}`
  }

  /**
   * Format alias information only
   */
  static formatAliases(ticket: TicketResponse): string {
    if (!ticket.aliases) {
      return 'No aliases'
    }

    const aliasLines = []
    if (ticket.aliases.canonical) {
      aliasLines.push(`  Canonical: ${ticket.aliases.canonical}`)
    }
    if (ticket.aliases.custom.length > 0) {
      aliasLines.push(`  Custom: ${ticket.aliases.custom.join(', ')}`)
    }

    return aliasLines.length > 0 ? aliasLines.join('\n') : 'No aliases'
  }
}
