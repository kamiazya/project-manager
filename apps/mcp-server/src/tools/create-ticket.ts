import { CreateTicket } from '@project-manager/application'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { getCreateTicketUseCase } from '../utils/container.ts'
import { handleError } from '../utils/error-handler.ts'
import { formatErrorResponse, formatSuccessResponse } from '../utils/response-formatter.ts'

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

export const createTicketTool: McpTool = {
  name: 'create_ticket',
  title: 'Create Ticket',
  description: 'Create a new ticket',
  inputSchema: createTicketSchema.shape,
  handler: async (input: z.infer<typeof createTicketSchema>) => {
    try {
      const useCase = getCreateTicketUseCase()

      const request = new CreateTicket.Request(
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
