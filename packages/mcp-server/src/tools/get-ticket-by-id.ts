import type { GetTicketByIdUseCase } from '@project-manager/core'
import { TYPES } from '@project-manager/core'
import { z } from 'zod'
import { getContainer } from '../utils/container.js'
import { handleError } from '../utils/error-handler.js'

const getTicketByIdSchema = z.object({
  id: z.string().min(1).describe('The ticket ID'),
})

export const getTicketByIdTool = {
  name: 'get_ticket',
  title: 'Get Ticket',
  description: 'Get a ticket by ID',
  inputSchema: getTicketByIdSchema.shape,
  handler: async (input: z.infer<typeof getTicketByIdSchema>) => {
    try {
      const container = getContainer()
      const useCase = container.get<GetTicketByIdUseCase>(TYPES.GetTicketByIdUseCase)

      const response = await useCase.execute({ id: input.id })

      if (!response) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Ticket not found',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                ticket: {
                  id: response.id,
                  title: response.title,
                  description: response.description,
                  status: response.status,
                  priority: response.priority,
                  type: response.type,
                  createdAt: response.createdAt,
                  updatedAt: response.updatedAt,
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
