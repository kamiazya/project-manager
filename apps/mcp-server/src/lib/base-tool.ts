import { ProjectManagerSDK, ProjectManagerSDKFactory } from '@project-manager/sdk'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { formatErrorResponse, formatSuccessResponse } from '../utils/response-formatter.ts'

/**
 * Base class for MCP tools that provides DI SDK access similar to CLI BaseCommand.
 * This ensures consistent architecture patterns between CLI and MCP server.
 */
export abstract class BaseTool<TInput extends z.ZodSchema> implements McpTool {
  private static sdkInstance: ProjectManagerSDK | null = null

  // Abstract properties that concrete tools must define
  abstract readonly name: string
  abstract readonly title: string
  abstract readonly description: string
  abstract readonly inputSchema: any

  /**
   * Get or initialize the ProjectManagerSDK instance
   * Follows singleton pattern for performance
   */
  private async getSDK(): Promise<ProjectManagerSDK> {
    if (!BaseTool.sdkInstance) {
      const environment = process.env.NODE_ENV === 'development' ? 'development' : 'production'
      BaseTool.sdkInstance = await ProjectManagerSDKFactory.forMCP({ environment })
    }
    return BaseTool.sdkInstance
  }

  /**
   * MCP tool handler that provides error handling and SDK injection
   */
  handler = async (input: z.infer<TInput>) => {
    try {
      const sdk = await this.getSDK()
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

  /**
   * Reset SDK instance (useful for testing)
   */
  static resetSDK(): void {
    BaseTool.sdkInstance = null
  }
}
