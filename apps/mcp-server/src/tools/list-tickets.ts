import { GetAllTickets } from '@project-manager/application'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { getGetAllTicketsUseCase } from '../utils/container.ts'
import { handleError } from '../utils/error-handler.ts'

const listTicketsSchema = z.object({
  status: z
    .enum(['pending', 'in_progress', 'completed', 'archived'])
    .optional()
    .describe('Filter by status'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority'),
  type: z.enum(['feature', 'bug', 'task']).optional().describe('Filter by type'),
  limit: z.number().optional().default(100).describe('Maximum number of tickets to return'),
})

export const listTicketsTool: McpTool = {
  name: 'list_tickets',
  title: 'List Tickets',
  description: 'List all tickets with optional filters',
  inputSchema: listTicketsSchema.shape,
  handler: async (input: z.infer<typeof listTicketsSchema>) => {
    try {
      const useCase = getGetAllTicketsUseCase()

      // Pass filters directly to the use case, filtering out undefined values
      const filters: GetAllTickets.Filters = {}
      if (input.status !== undefined) filters.status = input.status
      if (input.priority !== undefined) filters.priority = input.priority
      if (input.type !== undefined) filters.type = input.type
      if (input.limit !== undefined) filters.limit = input.limit

      const request = new GetAllTickets.Request(filters)

      const response = await useCase.execute(request)
      const tickets = response.tickets

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                tickets: tickets.map(ticket => ({
                  id: ticket.id,
                  title: ticket.title,
                  status: ticket.status,
                  priority: ticket.priority,
                  type: ticket.type,
                  createdAt: ticket.createdAt,
                  updatedAt: ticket.updatedAt,
                })),
                total: tickets.length,
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
