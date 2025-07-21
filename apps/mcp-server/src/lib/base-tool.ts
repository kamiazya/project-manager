import type { ProjectManagerSDK } from '@project-manager/sdk'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { formatErrorResponse, formatSuccessResponse } from '../utils/response-formatter.ts'

/**
 * Base class for MCP tools that provides error handling and execution logic.
 * Now receives SDK from external source for process consistency.
 */
export abstract class BaseTool<TInput extends z.ZodSchema> implements McpTool {
  // Abstract properties that concrete tools must define
  abstract readonly name: string
  abstract readonly title: string
  abstract readonly description: string
  abstract readonly inputSchema: any

  /**
   * MCP tool handler that receives SDK from external source
   * This ensures process-wide SDK consistency
   */
  handleWithSDK = async (input: z.infer<TInput>, sdk: ProjectManagerSDK) => {
    try {
      const result = await this.execute(input, sdk)
      return formatSuccessResponse(result)
    } catch (error) {
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
      }
      return formatErrorResponse(errorInfo)
    }
  }

  /**
   * Abstract method that concrete tools must implement.
   * Receives parsed input and SDK instance for operations.
   */
  protected abstract execute(input: z.infer<TInput>, sdk: ProjectManagerSDK): Promise<any>
}
