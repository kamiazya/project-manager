import {
  GetTicketByIdRequest,
  UpdateTicketPriorityRequest,
  UpdateTicketStatusRequest,
} from '@project-manager/core'
import { isValidTicketPriority, isValidTicketStatus } from '@project-manager/shared'
import { Command } from 'commander'
import { formatTicketResponse } from '../utils/output.js'
import {
  getGetTicketByIdUseCase,
  getUpdateTicketPriorityUseCase,
  getUpdateTicketStatusUseCase,
} from '../utils/service-factory.js'

export function updateTicketCommand(): Command {
  const command = new Command('update')
    .alias('u')
    .description('Update ticket properties')
    .argument('<id>', 'Ticket ID')
    .option('-s, --status <status>', 'Update status (pending, in_progress, completed, archived)')
    .option('-p, --priority <priority>', 'Update priority (high, medium, low)')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options) => {
      try {
        const getTicketByIdUseCase = getGetTicketByIdUseCase()
        const updateTicketStatusUseCase = getUpdateTicketStatusUseCase()
        const updateTicketPriorityUseCase = getUpdateTicketPriorityUseCase()

        // Check if ticket exists
        const getRequest = new GetTicketByIdRequest(id)
        let response = await getTicketByIdUseCase.execute(getRequest)

        if (!response) {
          console.error(`Ticket not found: ${id}`)
          process.exit(1)
        }

        // Track what was updated
        const updates: string[] = []

        // Update status if provided
        if (options.status) {
          if (!isValidTicketStatus(options.status)) {
            console.error(
              `Invalid status: ${options.status}. Valid statuses are: pending, in_progress, completed, archived`
            )
            process.exit(1)
          }
          const statusRequest = new UpdateTicketStatusRequest(id, options.status)
          response = await updateTicketStatusUseCase.execute(statusRequest)
          updates.push(`status to ${options.status}`)
        }

        // Update priority if provided
        if (options.priority) {
          if (!isValidTicketPriority(options.priority)) {
            console.error(
              `Invalid priority: ${options.priority}. Valid priorities are: high, medium, low`
            )
            process.exit(1)
          }
          const priorityRequest = new UpdateTicketPriorityRequest(id, options.priority)
          response = await updateTicketPriorityUseCase.execute(priorityRequest)
          updates.push(`priority to ${options.priority}`)
        }

        if (updates.length === 0) {
          console.error('No updates specified. Use --status or --priority to update ticket.')
          process.exit(1)
        }

        const output = formatTicketResponse(response, {
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
