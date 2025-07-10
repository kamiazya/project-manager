/**
 * Standardized messages for the project manager system.
 * This centralizes all user-facing messages to ensure consistency.
 */

export const ERROR_MESSAGES = {
  TICKET_NOT_FOUND: (id: string) => `Ticket not found: ${id}`,
  TITLE_REQUIRED: 'Title is required',
  TITLE_EMPTY: 'Title cannot be empty or whitespace only',
  TITLE_TOO_LONG: (maxLength: number) => `Title cannot exceed ${maxLength} characters`,
  DESCRIPTION_REQUIRED: 'Description is required',
  DESCRIPTION_EMPTY: 'Description cannot be empty or whitespace only',
  DESCRIPTION_TOO_LONG: (maxLength: number) => `Description cannot exceed ${maxLength} characters`,
  PRIORITY_REQUIRED: 'Priority is required',
  ID_REQUIRED: 'Ticket ID is required and must be a string',
  ID_EMPTY: 'Ticket ID cannot be empty',
  ID_TOO_SHORT: (minLength: number) => `Ticket ID must be at least ${minLength} characters long`,
  ID_TOO_LONG: (maxLength: number) => `Ticket ID cannot exceed ${maxLength} characters`,
  ID_INVALID_FORMAT: 'Ticket ID can only contain alphanumeric characters',
  INVALID_DATE_FORMAT: 'Invalid date format in JSON data',
  OPERATION_FAILED: {
    CREATE: 'Failed to create ticket:',
    LIST: 'Failed to list tickets:',
    UPDATE: 'Failed to update ticket:',
    DELETE: 'Failed to delete ticket:',
    READ: 'Failed to read ticket:',
    SHOW: 'Failed to show ticket:',
    STATS: 'Failed to get ticket statistics:',
  },
} as const

export const SUCCESS_MESSAGES = {
  TICKET_CREATED: (id: string) => `Ticket created successfully with ID: ${id}`,
  TICKET_UPDATED: (updates: string[]) => `Updated ${updates.join(' and ')}.`,
  TICKET_DELETED: (id: string) => `Ticket ${id} deleted successfully.`,
  TICKETS_FOUND: (count: number) => `Found ${count} ticket(s)`,
} as const

export const INFO_MESSAGES = {
  NO_TICKETS_FOUND: 'No tickets found.',
  TICKET_STATISTICS: 'Ticket Statistics',
} as const
