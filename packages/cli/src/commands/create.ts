import type { TicketData, TicketPriority, TicketPrivacy, TicketType } from '@project-manager/shared'
import { DEFAULTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@project-manager/shared'
import { Command } from 'commander'
import { formatTicket } from '../utils/output.js'
import { getTicketUseCase } from '../utils/service-factory.js'

export function createTicketCommand(): Command {
  const command = new Command('create')
    .description('Create a new ticket')
    .argument('<title>', 'Ticket title')
    .argument('<description>', 'Ticket description')
    .option('-p, --priority <priority>', 'Priority level (high, medium, low)', DEFAULTS.PRIORITY)
    .option('-t, --type <type>', 'Ticket type (feature, bug, task)', DEFAULTS.TYPE)
    .option(
      '--privacy <privacy>',
      'Privacy level (local-only, shareable, public)',
      DEFAULTS.PRIVACY
    )
    .option('-s, --status <status>', 'Initial status (pending, in_progress)', DEFAULTS.STATUS)
    .option('--json', 'Output in JSON format')
    .action(async (title: string, description: string, options) => {
      try {
        const ticketUseCase = getTicketUseCase()

        const ticketData: TicketData = {
          title: title.trim(),
          description: description.trim(),
          priority: options.priority as TicketPriority,
          type: options.type as TicketType,
          privacy: options.privacy as TicketPrivacy,
          status: options.status,
        }

        const ticket = await ticketUseCase.createTicket(ticketData)

        const output = formatTicket(ticket, {
          format: options.json ? 'json' : 'table',
        })

        console.log(output)
        console.log(`\n${SUCCESS_MESSAGES.TICKET_CREATED(ticket.id)}`)
      } catch (error) {
        console.error(
          ERROR_MESSAGES.OPERATION_FAILED.CREATE,
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  return command
}
