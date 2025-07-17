import { GetTicketById } from '@project-manager/application'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { getGetTicketByIdUseCase } from '../utils/container.ts'
import { handleError } from '../utils/error-handler.ts'

const getTicketByIdSchema = z.object({
  id: z.string().min(1).describe('The ticket ID'),
})

export const getTicketByIdTool: McpTool = {
  name: 'get_ticket',
  title: 'Get Ticket',
  description: 'Get a ticket by ID',
  inputSchema: getTicketByIdSchema.shape,
  handler: async (input: z.infer<typeof getTicketByIdSchema>) => {
    try {
      const useCase = getGetTicketByIdUseCase()

      const response = await useCase.execute(new GetTicketById.Request(input.id))

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
