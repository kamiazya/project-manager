import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createTicketTool } from './tools/create-ticket.js'
import { getProjectConfigTool } from './tools/get-project-config.js'
import { getProjectInfoTool } from './tools/get-project-info.js'
import { getTicketByIdTool } from './tools/get-ticket-by-id.js'
import { getTicketStatsTool } from './tools/get-ticket-stats.js'
import { listTicketsTool } from './tools/list-tickets.js'
import { searchTicketsTool } from './tools/search-tickets.js'
import { setProjectConfigTool } from './tools/set-project-config.js'
import { updateTicketStatusTool } from './tools/update-ticket-status.js'

// Define tool interface for type safety
interface McpTool {
  name: string
  title: string
  description: string
  inputSchema: any
  handler: (input: any) => Promise<any>
}

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
    version: '0.0.0',
  })

  // Register all tools using the helper function
  registerTools(server, tools)

  return server
}

// Start server if run directly
createMcpServer().then(async server => {
  const transport = new StdioServerTransport()
  await server.connect(transport)
})
