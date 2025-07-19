import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const searchTicketsSchema = z.object({
  query: z.string().min(1).describe('The search query'),
  searchIn: z
    .array(z.enum(['title', 'description']))
    .optional()
    .default(['title', 'description'])
    .describe('Fields to search in'),
})

class SearchTicketsTool extends BaseTool<typeof searchTicketsSchema> {
  readonly name = 'search_tickets'
  readonly title = 'Search Tickets'
  readonly description = 'Search tickets by query'
  readonly inputSchema = searchTicketsSchema.shape

  protected async execute(input: z.infer<typeof searchTicketsSchema>, sdk: ProjectManagerSDK) {
    const tickets = await sdk.tickets.search({
      query: input.query,
      searchIn: input.searchIn,
    })

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

export const searchTicketsTool = new SearchTicketsTool()
