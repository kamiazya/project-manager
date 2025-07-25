import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const updateTicketPrioritySchema = z.object({
  id: z.string().min(1).describe('The ticket ID'),
  priority: z.enum(['high', 'medium', 'low']).describe('The new priority level'),
})

class UpdateTicketPriorityTool extends BaseTool<typeof updateTicketPrioritySchema> {
  readonly name = 'update_ticket_priority'
  readonly title = 'Update Ticket Priority'
  readonly description = 'Update the priority level of a ticket'
  readonly inputSchema = updateTicketPrioritySchema.shape

  protected async execute(
    input: z.infer<typeof updateTicketPrioritySchema>,
    sdk: ProjectManagerSDK
  ) {
    const ticket = await sdk.tickets.updatePriority(input.id, input.priority)

    return {
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        type: ticket.type,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    }
  }
}

export const updateTicketPriorityTool = new UpdateTicketPriorityTool()
