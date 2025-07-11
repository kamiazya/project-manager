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
  getConfig,
  isValidTicketPriority,
  isValidTicketStatus,
  SUCCESS_MESSAGES,
  TicketNotFoundError,
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
 * Higher-order function that wraps command actions with standardized error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof TicketNotFoundError) {
        console.error(`Ticket not found: ${error.ticketId}`)
        process.exit(1)
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Failed to ${operation}:`, errorMessage)
      process.exit(1)
    }
  }
}

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
 * Internal implementation for creating a simple ticket
 */
async function createTicketImpl(
  title: string,
  options: {
    description?: string
    priority?: string
    type?: string
  }
): Promise<void> {
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
}

/**
 * Create a new ticket with the given parameters
 */
export const createTicketAction = withErrorHandling('create ticket', createTicketImpl)

/**
 * Internal implementation for updating ticket status
 */
async function updateTicketStatusImpl(id: string, status: string, action: string): Promise<void> {
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
}

/**
 * Update ticket status with the given parameters
 */
export const updateTicketStatus = withErrorHandling('update ticket status', updateTicketStatusImpl)

/**
 * Internal implementation for listing tickets by status
 */
async function listTicketsByStatusImpl(
  status: string,
  format: 'table' | 'json' | 'compact'
): Promise<void> {
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
}

/**
 * List tickets by status with the given format
 */
export const listTicketsByStatus = withErrorHandling(
  'list tickets by status',
  listTicketsByStatusImpl
)

/**
 * Internal implementation for listing all tickets
 */
async function listAllTicketsImpl(options: { compact?: boolean }): Promise<void> {
  const getAllTicketsUseCase = getGetAllTicketsUseCase()
  const request = new GetAllTicketsRequest()
  const response = await getAllTicketsUseCase.execute(request)

  const output = formatTicketSummaryList(response.tickets, {
    format: options.compact ? 'compact' : 'table',
  })
  console.log(output)
  console.log(`\nTotal: ${response.tickets.length} tickets`)
}

/**
 * List all tickets with the given format
 */
export const listAllTicketsAction = withErrorHandling('list all tickets', listAllTicketsImpl)

/**
 * Internal implementation for creating a detailed ticket
 */
async function createDetailedTicketImpl(
  title: string,
  description: string,
  options: {
    priority?: TicketPriority
    type?: TicketType
    privacy?: TicketPrivacy
    json?: boolean
  }
): Promise<void> {
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
}

/**
 * Create a detailed ticket with all options
 */
export const createDetailedTicketAction = withErrorHandling(
  'create ticket',
  createDetailedTicketImpl
)

/**
 * Internal implementation for searching tickets
 */
async function searchTicketsImpl(
  criteria: TicketSearchCriteria,
  options: {
    format?: 'table' | 'json' | 'compact'
  }
): Promise<void> {
  const searchTicketsUseCase = getSearchTicketsUseCase()
  const request = new SearchTicketsRequest(criteria)
  const response = await searchTicketsUseCase.execute(request)

  const output = formatTicketSummaryList(response.tickets, { format: options.format || 'table' })
  console.log(output)

  if (response.tickets.length > 0) {
    console.log(`\n${SUCCESS_MESSAGES.TICKETS_FOUND(response.tickets.length)}`)
  }
}

/**
 * Search tickets with criteria
 */
export const searchTicketsAction = withErrorHandling('search tickets', searchTicketsImpl)

/**
 * Internal implementation for showing a ticket
 */
async function showTicketImpl(id: string, options: { json?: boolean }): Promise<void> {
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
}

/**
 * Show ticket by ID
 */
export const showTicketAction = withErrorHandling('show ticket', showTicketImpl)

/**
 * Internal implementation for deleting a ticket
 */
async function deleteTicketImpl(id: string, options: { force?: boolean }): Promise<void> {
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
}

/**
 * Delete ticket by ID
 */
export const deleteTicketAction = withErrorHandling('delete ticket', deleteTicketImpl)

/**
 * Internal implementation for updating a ticket
 */
async function updateTicketImpl(
  id: string,
  options: {
    status?: string
    priority?: string
    json?: boolean
  }
): Promise<void> {
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
}

/**
 * Update ticket properties
 */
export const updateTicketAction = withErrorHandling('update ticket', updateTicketImpl)

/**
 * Internal implementation for showing stats
 */
async function showStatsImpl(options: { json?: boolean }): Promise<void> {
  const getTicketStatsUseCase = getGetTicketStatsUseCase()
  const request = new GetTicketStatsRequest()
  const response = await getTicketStatsUseCase.execute(request)

  if (options.json) {
    console.log(JSON.stringify(response.stats, null, 2))
  } else {
    console.log(formatStats(response.stats))
  }
}

/**
 * Show ticket statistics
 */
export const showStatsAction = withErrorHandling('get stats', showStatsImpl)
