import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const getTicketByIdSchema = z.object({
  id: z.string().min(1).describe('The ticket ID'),
})

class GetTicketByIdTool extends BaseTool<typeof getTicketByIdSchema> {
  readonly name = 'get_ticket'
  readonly title = 'Get Ticket'
  readonly description = 'Get a ticket by ID'
  readonly inputSchema = getTicketByIdSchema.shape

  protected async execute(input: z.infer<typeof getTicketByIdSchema>, sdk: ProjectManagerSDK) {
    const ticket = await sdk.tickets.getById(input.id)

    if (!ticket) {
      throw new Error('Ticket not found')
    }

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

export const getTicketByIdTool = new GetTicketByIdTool()
