import { TicketError } from '@project-manager/shared'

export function handleError(error: unknown): { error: string; details?: unknown } {
  if (error instanceof TicketError) {
    return {
      error: error.message,
      details: { code: error.code },
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
    }
  }

  return {
    error: 'An unknown error occurred',
    details: error,
  }
}
