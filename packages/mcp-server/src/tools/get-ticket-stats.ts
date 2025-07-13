import type { GetTicketStatsUseCase } from '@project-manager/core'
import { TYPES } from '@project-manager/core'
import { z } from 'zod'
import { getContainer } from '../utils/container.js'
import { handleError } from '../utils/error-handler.js'

const getTicketStatsSchema = z.object({})

export const getTicketStatsTool = {
  name: 'get_ticket_stats',
  title: 'Get Ticket Statistics',
  description: 'Get statistics about tickets',
  inputSchema: getTicketStatsSchema.shape,
  handler: async () => {
    try {
      const container = getContainer()
      const useCase = container.get<GetTicketStatsUseCase>(TYPES.GetTicketStatsUseCase)

      const response = await useCase.execute({})

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                stats: {
                  total: response.stats.total,
                  byStatus: {
                    pending: response.stats.pending,
                    inProgress: response.stats.inProgress,
                    completed: response.stats.completed,
                    archived: response.stats.archived,
                  },
                  byPriority: response.stats.byPriority,
                  byType: response.stats.byType,
                },
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
