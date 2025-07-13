import type { CreateTicketUseCase } from '@project-manager/core'
import { CreateTicketRequest, TYPES } from '@project-manager/core'
import { z } from 'zod'
import { getContainer } from '../utils/container.js'
import { handleError } from '../utils/error-handler.js'
import { formatErrorResponse, formatSuccessResponse } from '../utils/response-formatter.js'

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

export const createTicketTool = {
  name: 'create_ticket',
  title: 'Create Ticket',
  description: 'Create a new ticket',
  inputSchema: createTicketSchema.shape,
  handler: async (input: z.infer<typeof createTicketSchema>) => {
    try {
      const container = getContainer()
      const useCase = container.get<CreateTicketUseCase>(TYPES.CreateTicketUseCase)

      const request = new CreateTicketRequest(
        input.title,
        input.description || '',
        input.priority,
        input.type
      )

      const response = await useCase.execute(request)

      return formatSuccessResponse({
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
      })
    } catch (error) {
      const errorInfo = handleError(error)
      return formatErrorResponse(errorInfo)
    }
  },
}
