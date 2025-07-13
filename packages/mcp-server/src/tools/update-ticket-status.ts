import type { UpdateTicketStatusUseCase } from '@project-manager/core'
import { TYPES, UpdateTicketStatusRequest } from '@project-manager/core'
import { z } from 'zod'
import { getContainer } from '../utils/container.js'
import { handleError } from '../utils/error-handler.js'
import { formatErrorResponse, formatSuccessResponse } from '../utils/response-formatter.js'

const updateTicketStatusSchema = z.object({
  id: z.string().min(1).describe('The ticket ID'),
  status: z.enum(['pending', 'in_progress', 'completed', 'archived']).describe('The new status'),
})

export const updateTicketStatusTool = {
  name: 'update_ticket_status',
  title: 'Update Ticket Status',
  description: 'Update the status of a ticket',
  inputSchema: updateTicketStatusSchema.shape,
  handler: async (input: z.infer<typeof updateTicketStatusSchema>) => {
    try {
      const container = getContainer()
      const useCase = container.get<UpdateTicketStatusUseCase>(TYPES.UpdateTicketStatusUseCase)

      const response = await useCase.execute(new UpdateTicketStatusRequest(input.id, input.status))

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
