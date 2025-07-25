import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const updateTicketStatusSchema = z.object({
  id: z.string().min(1).describe('The ticket ID'),
  status: z.enum(['pending', 'in_progress', 'completed', 'archived']).describe('The new status'),
})

class UpdateTicketStatusTool extends BaseTool<typeof updateTicketStatusSchema> {
  readonly name = 'update_ticket_status'
  readonly title = 'Update Ticket Status'
  readonly description = 'Update the status of a ticket'
  readonly inputSchema = updateTicketStatusSchema.shape

  protected async execute(input: z.infer<typeof updateTicketStatusSchema>, sdk: ProjectManagerSDK) {
    const ticket = await sdk.tickets.updateStatus(input.id, input.status)

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

export const updateTicketStatusTool = new UpdateTicketStatusTool()
