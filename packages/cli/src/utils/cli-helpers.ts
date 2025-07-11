import {
  CreateTicketRequest,
  DeleteTicketRequest,
  GetAllTicketsRequest,
  GetTicketByIdRequest,
  GetTicketStatsRequest,
  SearchTicketsRequest,
  UpdateTicketPriorityRequest,
  UpdateTicketStatusRequest,
} from '@project-manager/core'
import type {
  TicketPriority,
  TicketPrivacy,
  TicketSearchCriteria,
  TicketType,
} from '@project-manager/shared'
import {
  ERROR_MESSAGES,
  getConfig,
  isValidTicketPriority,
  isValidTicketStatus,
  SUCCESS_MESSAGES,
} from '@project-manager/shared'
import { formatStats, formatTicketResponse, formatTicketSummaryList } from './output.js'
import {
  getCreateTicketUseCase,
  getDeleteTicketUseCase,
  getGetAllTicketsUseCase,
  getGetTicketByIdUseCase,
  getGetTicketStatsUseCase,
  getSearchTicketsUseCase,
  getUpdateTicketPriorityUseCase,
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

/**
 * Create a detailed ticket with all options
 */
export async function createDetailedTicketAction(
  title: string,
  description: string,
  options: {
    priority?: TicketPriority
    type?: TicketType
    privacy?: TicketPrivacy
    json?: boolean
  }
): Promise<void> {
  try {
    const createTicketUseCase = getCreateTicketUseCase()
    const config = getConfig()

    const request = new CreateTicketRequest(
      title.trim(),
      description.trim(),
      options.priority || config.defaultPriority,
      options.type || config.defaultType,
      options.privacy || config.defaultPrivacy
    )

    const response = await createTicketUseCase.execute(request)

    const output = formatTicketResponse(response, {
      format: options.json ? 'json' : config.defaultOutputFormat,
    })

    console.log(output)
    console.log(`\n${SUCCESS_MESSAGES.TICKET_CREATED(response.id)}`)
  } catch (error) {
    console.error(
      ERROR_MESSAGES.OPERATION_FAILED.CREATE,
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

/**
 * Search tickets with criteria
 */
export async function searchTicketsAction(
  criteria: TicketSearchCriteria,
  options: {
    format?: 'table' | 'json' | 'compact'
  }
): Promise<void> {
  try {
    const searchTicketsUseCase = getSearchTicketsUseCase()
    const request = new SearchTicketsRequest(criteria)
    const response = await searchTicketsUseCase.execute(request)

    const output = formatTicketSummaryList(response.tickets, { format: options.format || 'table' })
    console.log(output)

    if (response.tickets.length > 0) {
      console.log(`\n${SUCCESS_MESSAGES.TICKETS_FOUND(response.tickets.length)}`)
    }
  } catch (error) {
    console.error(
      ERROR_MESSAGES.OPERATION_FAILED.LIST,
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

/**
 * Show ticket by ID
 */
export async function showTicketAction(id: string, options: { json?: boolean }): Promise<void> {
  try {
    const getTicketByIdUseCase = getGetTicketByIdUseCase()
    const request = new GetTicketByIdRequest(id)
    const response = await getTicketByIdUseCase.execute(request)

    if (!response) {
      console.error(`Ticket not found: ${id}`)
      process.exit(1)
    }

    const output = formatTicketResponse(response, {
      format: options.json ? 'json' : 'table',
    })

    console.log(output)
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.error(`Ticket not found: ${id}`)
      process.exit(1)
    }

    console.error('Failed to show ticket:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

/**
 * Delete ticket by ID
 */
export async function deleteTicketAction(id: string, options: { force?: boolean }): Promise<void> {
  try {
    const getTicketByIdUseCase = getGetTicketByIdUseCase()
    const deleteTicketUseCase = getDeleteTicketUseCase()

    // Verify ticket exists
    const getRequest = new GetTicketByIdRequest(id)
    const response = await getTicketByIdUseCase.execute(getRequest)
    if (!response) {
      console.error(`Ticket not found: ${id}`)
      process.exit(1)
    }

    // Show confirmation unless force flag is used
    if (!options.force) {
      console.log(`About to delete ticket: ${response.title}`)
      console.log('Use --force flag to skip this confirmation.')
      process.exit(0)
    }

    const deleteRequest = new DeleteTicketRequest(id)
    await deleteTicketUseCase.execute(deleteRequest)
    console.log(`Ticket ${id} deleted successfully.`)
  } catch (error) {
    console.error(
      'Failed to delete ticket:',
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

/**
 * Update ticket properties
 */
export async function updateTicketAction(
  id: string,
  options: {
    status?: string
    priority?: string
    json?: boolean
  }
): Promise<void> {
  try {
    const getTicketByIdUseCase = getGetTicketByIdUseCase()
    const updateTicketStatusUseCase = getUpdateTicketStatusUseCase()
    const updateTicketPriorityUseCase = getUpdateTicketPriorityUseCase()

    // Check if ticket exists
    const getRequest = new GetTicketByIdRequest(id)
    let response = await getTicketByIdUseCase.execute(getRequest)

    if (!response) {
      console.error(`Ticket not found: ${id}`)
      process.exit(1)
    }

    // Track what was updated
    const updates: string[] = []

    // Update status if provided
    if (options.status) {
      if (!isValidTicketStatus(options.status)) {
        console.error(
          `Invalid status: ${options.status}. Valid statuses are: pending, in_progress, completed, archived`
        )
        process.exit(1)
      }
      const statusRequest = new UpdateTicketStatusRequest(id, options.status)
      response = await updateTicketStatusUseCase.execute(statusRequest)
      updates.push(`status to ${options.status}`)
    }

    // Update priority if provided
    if (options.priority) {
      if (!isValidTicketPriority(options.priority)) {
        console.error(
          `Invalid priority: ${options.priority}. Valid priorities are: high, medium, low`
        )
        process.exit(1)
      }
      const priorityRequest = new UpdateTicketPriorityRequest(id, options.priority)
      response = await updateTicketPriorityUseCase.execute(priorityRequest)
      updates.push(`priority to ${options.priority}`)
    }

    if (updates.length === 0) {
      console.error('No updates specified. Use --status or --priority to update ticket.')
      process.exit(1)
    }

    const output = formatTicketResponse(response, {
      format: options.json ? 'json' : 'table',
    })

    console.log(output)
    console.log(`\nUpdated ${updates.join(' and ')}.`)
  } catch (error) {
    console.error(
      'Failed to update ticket:',
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

/**
 * Show ticket statistics
 */
export async function showStatsAction(options: { json?: boolean }): Promise<void> {
  try {
    const getTicketStatsUseCase = getGetTicketStatsUseCase()
    const request = new GetTicketStatsRequest()
    const response = await getTicketStatsUseCase.execute(request)

    if (options.json) {
      console.log(JSON.stringify(response.stats, null, 2))
    } else {
      console.log(formatStats(response.stats))
    }
  } catch (error) {
    console.error('Failed to get stats:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
