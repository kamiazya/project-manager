/**
 * MCP Server specific error types
 */

/**
 * Base class for all MCP server errors
 */
export abstract class McpError extends Error {
  public readonly name: string
  public readonly timestamp: Date

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    // Chain the original error if provided
    if (cause) {
      this.cause = cause
    }
  }
}

/**
 * Error thrown when MCP tool operations are invalid
 */
export class McpToolError extends McpError {
  public readonly toolName: string

  constructor(toolName: string, message: string, cause?: Error) {
    super(`Tool '${toolName}': ${message}`, cause)
    this.toolName = toolName
  }
}
