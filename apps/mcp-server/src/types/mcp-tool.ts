import type { ProjectManagerSDK } from '@project-manager/sdk'

/**
 * Interface definition for MCP tools to ensure type safety across all tool implementations
 */
export interface McpTool {
  name: string
  title: string
  description: string
  inputSchema: any
  handler: (input: any) => Promise<any>
  handleWithSDK: (input: any, sdk: ProjectManagerSDK) => Promise<any>
}
