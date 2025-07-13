import type { GetAllTicketsUseCase } from '@project-manager/core'
import { TYPES } from '@project-manager/core'
import { z } from 'zod'
import { getContainer } from '../utils/container.js'
import { handleError } from '../utils/error-handler.js'

const listTicketsSchema = z.object({
  status: z
    .enum(['pending', 'in_progress', 'completed', 'archived'])
    .optional()
    .describe('Filter by status'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority'),
  type: z.enum(['feature', 'bug', 'task']).optional().describe('Filter by type'),
  limit: z.number().optional().default(100).describe('Maximum number of tickets to return'),
})

export const listTicketsTool = {
  name: 'list_tickets',
  title: 'List Tickets',
  description: 'List all tickets with optional filters',
  inputSchema: listTicketsSchema.shape,
  handler: async (input: z.infer<typeof listTicketsSchema>) => {
    try {
      const container = getContainer()
      const useCase = container.get<GetAllTicketsUseCase>(TYPES.GetAllTicketsUseCase)

      const response = await useCase.execute({})

      let tickets = response.tickets

      // Apply filters
      if (input.status) {
        tickets = tickets.filter(ticket => ticket.status === input.status)
      }
      if (input.priority) {
        tickets = tickets.filter(ticket => ticket.priority === input.priority)
      }
      if (input.type) {
        tickets = tickets.filter(ticket => ticket.type === input.type)
      }

      // Apply limit
      tickets = tickets.slice(0, input.limit)

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
