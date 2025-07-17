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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: true, ...data }, null, 2),
      },
    ],
  }
}

/**
 * Format an error response for MCP tools
 */
export function formatErrorResponse(error: any, isError = true): McpResponse {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: false, ...error }, null, 2),
      },
    ],
    isError,
  }
}
