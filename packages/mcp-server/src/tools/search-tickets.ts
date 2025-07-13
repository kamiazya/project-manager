import type { SearchTicketsUseCase } from '@project-manager/core'
import { SearchTicketsRequest, TYPES } from '@project-manager/core'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { getContainer } from '../utils/container.ts'
import { handleError } from '../utils/error-handler.ts'

const searchTicketsSchema = z.object({
  query: z.string().min(1).describe('The search query'),
  searchIn: z
    .array(z.enum(['title', 'description']))
    .optional()
    .default(['title', 'description'])
    .describe('Fields to search in'),
})

export const searchTicketsTool: McpTool = {
  name: 'search_tickets',
  title: 'Search Tickets',
  description: 'Search tickets by query',
  inputSchema: searchTicketsSchema.shape,
  handler: async (input: z.infer<typeof searchTicketsSchema>) => {
    try {
      const container = getContainer()
      const useCase = container.get<SearchTicketsUseCase>(TYPES.SearchTicketsUseCase)

      const response = await useCase.execute(
        new SearchTicketsRequest({
          search: input.query,
          searchIn: input.searchIn,
        })
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                tickets: response.tickets.map(ticket => ({
                  id: ticket.id,
                  title: ticket.title,
                  status: ticket.status,
                  priority: ticket.priority,
                  type: ticket.type,
                  createdAt: ticket.createdAt,
                  updatedAt: ticket.updatedAt,
                })),
                total: response.totalCount,
              },
              null,
              2
            ),
          },
        ],
      }
    } catch (error) {
      const errorInfo = handleError(error)
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                ...errorInfo,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      }
    }
  },
}
