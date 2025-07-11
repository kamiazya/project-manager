import {
  GetTicketByIdRequest,
  UpdateTicketPriorityRequest,
  UpdateTicketStatusRequest,
} from '@project-manager/core'
import type { TicketPriority, TicketStatus } from '@project-manager/shared'
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
          const statusRequest = new UpdateTicketStatusRequest(id, options.status as TicketStatus)
          response = await updateTicketStatusUseCase.execute(statusRequest)
          updates.push(`status to ${options.status}`)
        }

        // Update priority if provided
        if (options.priority) {
          const priorityRequest = new UpdateTicketPriorityRequest(
            id,
            options.priority as TicketPriority
          )
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
