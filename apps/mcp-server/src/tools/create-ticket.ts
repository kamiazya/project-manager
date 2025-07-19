import { createTicketPriority, createTicketStatus, createTicketType } from '@project-manager/domain'
import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const createTicketSchema = z.object({
  title: z.string().min(1).describe('The ticket title'),
  description: z.string().optional().describe('The ticket description'),
  priority: z
    .enum(['high', 'medium', 'low'])
    .optional()
    .default('medium')
    .describe('The ticket priority'),
  type: z.enum(['feature', 'bug', 'task']).optional().default('task').describe('The ticket type'),
})

class CreateTicketTool extends BaseTool<typeof createTicketSchema> {
  readonly name = 'create_ticket'
  readonly title = 'Create Ticket'
  readonly description = 'Create a new ticket'
  readonly inputSchema = createTicketSchema.shape

  protected async execute(input: z.infer<typeof createTicketSchema>, sdk: ProjectManagerSDK) {
    const ticket = await sdk.tickets.create({
      title: input.title,
      description: input.description || '',
      priority: createTicketPriority(input.priority),
      type: createTicketType(input.type),
      status: createTicketStatus('pending'), // Default status for new tickets
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

export const createTicketTool = new CreateTicketTool()
