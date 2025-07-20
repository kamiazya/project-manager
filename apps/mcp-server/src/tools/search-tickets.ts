import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const searchTicketsSchema = z.object({
  query: z.string().optional().describe('The search query (optional)'),
  searchIn: z
    .array(z.enum(['title', 'description']))
    .optional()
    .default(['title', 'description'])
    .describe('Fields to search in'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'archived'])
    .optional()
    .describe('Filter by status'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority'),
  type: z.enum(['feature', 'bug', 'task']).optional().describe('Filter by type'),
  limit: z.number().optional().default(100).describe('Maximum number of tickets to return'),
})

class SearchTicketsTool extends BaseTool<typeof searchTicketsSchema> {
  readonly name = 'search_tickets'
  readonly title = 'Search Tickets'
  readonly description =
    'Search tickets by query with optional filters. If no query is provided, lists all tickets with filters applied.'
  readonly inputSchema = searchTicketsSchema.shape

  protected async execute(input: z.infer<typeof searchTicketsSchema>, sdk: ProjectManagerSDK) {
    const tickets = await sdk.tickets.search({
      query: input.query,
      searchIn: input.searchIn,
      status: input.status,
      priority: input.priority,
      type: input.type,
    })

    // Apply limit at SDK level since repository handles pagination
    const limitedTickets = input.limit ? tickets.slice(0, input.limit) : tickets

    return {
      tickets: limitedTickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        type: ticket.type,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      })),
      total: limitedTickets.length,
    }
  }
}

export const searchTicketsTool = new SearchTicketsTool()
