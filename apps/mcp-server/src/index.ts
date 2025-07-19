import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ProjectManagerSDK } from '@project-manager/sdk'
import packageJson from '../package.json' with { type: 'json' }
import { createTicketTool } from './tools/create-ticket.ts'
import { getTicketByIdTool } from './tools/get-ticket-by-id.ts'
import { listTicketsTool } from './tools/list-tickets.ts'
import { searchTicketsTool } from './tools/search-tickets.ts'
import { updateTicketStatusTool } from './tools/update-ticket-status.ts'
import type { McpTool } from './types/mcp-tool.ts'

// Define all tools in a central registry
const tools: McpTool[] = [
  createTicketTool,
  getTicketByIdTool,
  listTicketsTool,
  updateTicketStatusTool,
  searchTicketsTool,
]

export async function createMcpServer(sdk: ProjectManagerSDK) {
  const server = new McpServer({
    name: 'project-manager-mcp',
    version: packageJson.version,
  })

  // Register all tools with SDK injection
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (input: any) => {
        // Use injected SDK instead of tool's internal SDK
        return await tool.handleWithSDK(input, sdk)
      }
    )
  }

  return server
}
