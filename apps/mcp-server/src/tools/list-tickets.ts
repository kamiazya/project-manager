import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const listTicketsSchema = z.object({
  // status: z
  //   .enum(['pending', 'in_progress', 'completed', 'archived'])
  //   .optional()
  //   .describe('Filter by status'),
  // priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority'),
  // type: z.enum(['feature', 'bug', 'task']).optional().describe('Filter by type'),
  // limit: z.number().optional().default(100).describe('Maximum number of tickets to return'),
})

class ListTicketsTool extends BaseTool<typeof listTicketsSchema> {
  readonly name = 'list_tickets'
  readonly title = 'List Tickets'
  readonly description = 'List all tickets with optional filters'
  readonly inputSchema = listTicketsSchema.shape

  protected async execute(_input: z.infer<typeof listTicketsSchema>, sdk: ProjectManagerSDK) {
    const tickets = await sdk.tickets.getAll()

    return {
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        type: ticket.type,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      })),
      total: tickets.length,
    }
  }
}

export const listTicketsTool = new ListTicketsTool()
