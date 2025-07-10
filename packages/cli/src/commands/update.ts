import type { TicketPriority, TicketStatus } from '@project-manager/shared'
import { Command } from 'commander'
import { formatTicket } from '../utils/output.js'
import { getTicketUseCase } from '../utils/service-factory.js'

export function updateTicketCommand(): Command {
  const command = new Command('update')
    .description('Update ticket properties')
    .argument('<id>', 'Ticket ID')
    .option('-s, --status <status>', 'Update status (pending, in_progress, completed, archived)')
    .option('-p, --priority <priority>', 'Update priority (high, medium, low)')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options) => {
      try {
        const ticketUseCase = getTicketUseCase()

        let ticket: any

        try {
          ticket = await ticketUseCase.getTicket(id)
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            console.error(`Ticket not found: ${id}`)
            process.exit(1)
          }
          throw error
        }

        // Track what was updated
        const updates: string[] = []

        // Update status if provided
        if (options.status) {
          ticket = await ticketUseCase.updateTicketStatus(id, options.status as TicketStatus)
          updates.push(`status to ${options.status}`)
        }

        // Update priority if provided
        if (options.priority) {
          ticket = await ticketUseCase.updateTicketPriority(id, options.priority as TicketPriority)
          updates.push(`priority to ${options.priority}`)
        }

        if (updates.length === 0) {
          console.error('No updates specified. Use --status or --priority to update ticket.')
          process.exit(1)
        }

        const output = formatTicket(ticket, {
          format: options.json ? 'json' : 'table',
        })

        console.log(output)
        console.log(`\nUpdated ${updates.join(' and ')}.`)
      } catch (error) {
        console.error(
          'Failed to update ticket:',
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  return command
}
