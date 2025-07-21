import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const updateTicketContentBaseSchema = z.object({
  id: z.string().min(1).describe('The ticket ID'),
  title: z.string().optional().describe('The new title (optional)'),
  description: z.string().optional().describe('The new description (optional)'),
})

const updateTicketContentSchema = updateTicketContentBaseSchema.refine(
  data => data.title !== undefined || data.description !== undefined,
  {
    message: 'At least one of title or description must be provided',
    path: ['title', 'description'],
  }
)

class UpdateTicketContentTool extends BaseTool<typeof updateTicketContentSchema> {
  readonly name = 'update_ticket_content'
  readonly title = 'Update Ticket Content'
  readonly description = 'Update the title and/or description of a ticket'
  readonly inputSchema = updateTicketContentBaseSchema.shape

  protected async execute(
    input: z.infer<typeof updateTicketContentSchema>,
    sdk: ProjectManagerSDK
  ) {
    const ticket = await sdk.tickets.updateContent({
      id: input.id,
      title: input.title,
      description: input.description,
    })

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

export const updateTicketContentTool = new UpdateTicketContentTool()
