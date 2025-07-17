import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import packageJson from '../package.json' with { type: 'json' }
import { createTicketTool } from './tools/create-ticket.ts'
import { getProjectConfigTool } from './tools/get-project-config.ts'
import { getProjectInfoTool } from './tools/get-project-info.ts'
import { getTicketByIdTool } from './tools/get-ticket-by-id.ts'
import { getTicketStatsTool } from './tools/get-ticket-stats.ts'
import { listTicketsTool } from './tools/list-tickets.ts'
import { searchTicketsTool } from './tools/search-tickets.ts'
import { setProjectConfigTool } from './tools/set-project-config.ts'
import { updateTicketStatusTool } from './tools/update-ticket-status.ts'
import type { McpTool } from './types/mcp-tool.ts'

// Define all tools in a central registry
const tools: McpTool[] = [
  createTicketTool,
  getTicketByIdTool,
  listTicketsTool,
  updateTicketStatusTool,
  searchTicketsTool,
  getTicketStatsTool,
  getProjectConfigTool,
  setProjectConfigTool,
  getProjectInfoTool,
]

// Helper function to register multiple tools
function registerTools(server: McpServer, tools: McpTool[]) {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      tool.handler
    )
  }
}

export async function createMcpServer() {
  const server = new McpServer({
    name: 'project-manager-mcp',
    version: packageJson.version,
  })

  // Register all tools using the helper function
  registerTools(server, tools)

  return server
}
