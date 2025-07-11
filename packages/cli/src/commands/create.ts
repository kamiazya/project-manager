import { CreateTicketRequest } from '@project-manager/core'
import type { TicketPriority, TicketPrivacy, TicketType } from '@project-manager/shared'
import { ERROR_MESSAGES, getConfig, SUCCESS_MESSAGES } from '@project-manager/shared'
import { Command } from 'commander'
import { formatTicketResponse } from '../utils/output.js'
import { getCreateTicketUseCase } from '../utils/service-factory.js'

export function createTicketCommand(): Command {
  const config = getConfig()

  const command = new Command('create')
    .alias('c')
    .description('Create a new ticket')
    .argument('<title>', 'Ticket title')
    .argument('<description>', 'Ticket description')
    .option(
      '-p, --priority <priority>',
      'Priority level (high, medium, low)',
      config.defaultPriority
    )
    .option('-t, --type <type>', 'Ticket type (feature, bug, task)', config.defaultType)
    .option(
      '--privacy <privacy>',
      'Privacy level (local-only, shareable, public)',
      config.defaultPrivacy
    )
    .option('-s, --status <status>', 'Initial status (pending, in_progress)', config.defaultStatus)
    .option('--json', 'Output in JSON format')
    .action(async (title: string, description: string, options) => {
      try {
        const createTicketUseCase = getCreateTicketUseCase()

        const request = new CreateTicketRequest(
          title.trim(),
          description.trim(),
          options.priority as TicketPriority,
          options.type as TicketType,
          options.privacy as TicketPrivacy
        )

        const response = await createTicketUseCase.execute(request)

        const output = formatTicketResponse(response, {
          format: options.json ? 'json' : config.defaultOutputFormat,
        })

        console.log(output)
        console.log(`\n${SUCCESS_MESSAGES.TICKET_CREATED(response.id)}`)
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
