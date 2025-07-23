import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import { BaseTool } from '../lib/base-tool.ts'

const deleteTicketSchema = z.object({
  id: z.string().min(1).describe('The ticket ID to delete'),
})

class DeleteTicketTool extends BaseTool<typeof deleteTicketSchema> {
  readonly name = 'delete_ticket'
  readonly title = 'Delete Ticket'
  readonly description = 'Delete a ticket by its ID'
  readonly inputSchema = deleteTicketSchema.shape

  protected async execute(input: z.infer<typeof deleteTicketSchema>, sdk: ProjectManagerSDK) {
    await sdk.tickets.delete(input.id)

    return {
      success: true,
      message: `Ticket ${input.id} has been deleted successfully`,
      deletedTicketId: input.id,
    }
  }
}

export const deleteTicketTool = new DeleteTicketTool()
