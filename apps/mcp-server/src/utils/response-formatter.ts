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
        text: JSON.stringify({ ...data, success: true }, null, 2),
      },
    ],
  }
}

/**
 * Format an error response for MCP tools
 */
export function formatErrorResponse(error: any, isError = true): McpResponse {
  const errorDetails =
    error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : error

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: false, ...errorDetails }, null, 2),
      },
    ],
    isError,
  }
}
