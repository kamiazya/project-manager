import {
  CreateTicketRequest,
  GetAllTicketsRequest,
  SearchTicketsRequest,
  UpdateTicketStatusRequest,
} from '@project-manager/core'
import { getConfig, isValidTicketStatus } from '@project-manager/shared'
import { formatTicketSummaryList } from './output.js'
import {
  getCreateTicketUseCase,
  getGetAllTicketsUseCase,
  getSearchTicketsUseCase,
  getUpdateTicketStatusUseCase,
} from './service-factory.js'

/**
 * CLI helper functions for expanding short-form input values and shared command logic
 */

/**
 * Expand priority short forms to full priority values
 * @param short - Short form input (h, m, l) or full name (high, medium, low)
 * @returns Full priority value, defaults to 'medium' for invalid input
 */
export function expandPriority(short: string): 'high' | 'medium' | 'low' {
  switch (short.toLowerCase()) {
    case 'h':
    case 'high':
      return 'high'
    case 'l':
    case 'low':
      return 'low'
    case 'm':
    case 'medium':
      return 'medium'
    default:
      return 'medium'
  }
}

/**
 * Expand type short forms to full type values
 * @param short - Short form input (f, b, t) or full name (feature, bug, task)
 * @returns Full type value, defaults to 'task' for invalid input
 */
export function expandType(short: string): 'feature' | 'bug' | 'task' {
  switch (short.toLowerCase()) {
    case 'f':
    case 'feature':
      return 'feature'
    case 'b':
    case 'bug':
      return 'bug'
    case 't':
    case 'task':
      return 'task'
    default:
      return 'task'
  }
}

/**
 * Shared command actions
 */

/**
 * Create a new ticket with the given parameters
 */
export async function createTicketAction(
  title: string,
  options: {
    description?: string
    priority?: string
    type?: string
  }
): Promise<void> {
  try {
    const createTicketUseCase = getCreateTicketUseCase()
    const config = getConfig()

    // Convert short forms to full values
    const priority = expandPriority(options.priority || 'm')
    const type = expandType(options.type || 't')

    const request = new CreateTicketRequest(
      title.trim(),
      options.description || `Details for: ${title.trim()}`,
      priority,
      type,
      config.defaultPrivacy
    )

    const response = await createTicketUseCase.execute(request)
    console.log(`✓ Created ticket ${response.id}: ${response.title}`)
  } catch (error) {
    console.error(
      'Failed to create ticket:',
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

/**
 * Update ticket status with the given parameters
 */
export async function updateTicketStatus(
  id: string,
  status: string,
  action: string
): Promise<void> {
  try {
    if (!isValidTicketStatus(status)) {
      console.error(
        `Invalid status: ${status}. Valid statuses are: pending, in_progress, completed, archived`
      )
      process.exit(1)
    }

    const updateTicketStatusUseCase = getUpdateTicketStatusUseCase()
    const request = new UpdateTicketStatusRequest(id, status)
    const response = await updateTicketStatusUseCase.execute(request)
    console.log(`✓ ${action} ticket ${response.id}: ${response.title}`)
  } catch (error) {
    console.error(
      `Failed to update ticket:`,
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

/**
 * List tickets by status with the given format
 */
export async function listTicketsByStatus(
  status: string,
  format: 'table' | 'json' | 'compact'
): Promise<void> {
  try {
    if (!isValidTicketStatus(status)) {
      console.error(
        `Invalid status: ${status}. Valid statuses are: pending, in_progress, completed, archived`
      )
      process.exit(1)
    }

    const searchTicketsUseCase = getSearchTicketsUseCase()
    const request = new SearchTicketsRequest({ status })
    const response = await searchTicketsUseCase.execute(request)

    const output = formatTicketSummaryList(response.tickets, { format })
    console.log(output)
    console.log(`\n${response.tickets.length} ${status} tickets`)
  } catch (error) {
    console.error('Failed to list tickets:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

/**
 * List all tickets with the given format
 */
export async function listAllTicketsAction(options: { compact?: boolean }): Promise<void> {
  try {
    const getAllTicketsUseCase = getGetAllTicketsUseCase()
    const request = new GetAllTicketsRequest()
    const response = await getAllTicketsUseCase.execute(request)

    const output = formatTicketSummaryList(response.tickets, {
      format: options.compact ? 'compact' : 'table',
    })
    console.log(output)
    console.log(`\nTotal: ${response.tickets.length} tickets`)
  } catch (error) {
    console.error('Failed to list tickets:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
