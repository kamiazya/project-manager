/**
 * Utility functions for consistent MCP tool response formatting
 */

export interface McpResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}

/**
 * Format a successful response for MCP tools
 */
export function formatSuccessResponse(data: any): McpResponse {
  if (typeof data === 'string') {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ success: true, value: data }, null, 2),
        },
      ],
    }
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ ...data, success: true }),
      },
    ],
  }
}

/**
 * Format an error response for MCP tools
 */
export function formatErrorResponse(error: any, isError = true): McpResponse {
  let errorDetails: any

  if (error instanceof Error) {
    errorDetails = { message: error.message, name: error.name, stack: error.stack }
  } else if (typeof error === 'string') {
    errorDetails = { message: error }
  } else {
    errorDetails = error
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ ...errorDetails, success: false }, null, 2),
      },
    ],
    isError,
  }
}
