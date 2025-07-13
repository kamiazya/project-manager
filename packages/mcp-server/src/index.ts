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

export async function createMcpServer() {
  const server = new McpServer({
    name: 'project-manager-mcp',
    version: '0.0.0',
  })

  // Register ticket management tools
  server.registerTool(
    createTicketTool.name,
    {
      title: createTicketTool.title,
      description: createTicketTool.description,
      inputSchema: createTicketTool.inputSchema,
    },
    createTicketTool.handler
  )

  server.registerTool(
    getTicketByIdTool.name,
    {
      title: getTicketByIdTool.title,
      description: getTicketByIdTool.description,
      inputSchema: getTicketByIdTool.inputSchema,
    },
    getTicketByIdTool.handler
  )

  server.registerTool(
    listTicketsTool.name,
    {
      title: listTicketsTool.title,
      description: listTicketsTool.description,
      inputSchema: listTicketsTool.inputSchema,
    },
    listTicketsTool.handler
  )

  server.registerTool(
    updateTicketStatusTool.name,
    {
      title: updateTicketStatusTool.title,
      description: updateTicketStatusTool.description,
      inputSchema: updateTicketStatusTool.inputSchema,
    },
    updateTicketStatusTool.handler
  )

  server.registerTool(
    searchTicketsTool.name,
    {
      title: searchTicketsTool.title,
      description: searchTicketsTool.description,
      inputSchema: searchTicketsTool.inputSchema,
    },
    searchTicketsTool.handler
  )

  server.registerTool(
    getTicketStatsTool.name,
    {
      title: getTicketStatsTool.title,
      description: getTicketStatsTool.description,
      inputSchema: getTicketStatsTool.inputSchema,
    },
    getTicketStatsTool.handler
  )

  // Register project management tools
  server.registerTool(
    getProjectConfigTool.name,
    {
      title: getProjectConfigTool.title,
      description: getProjectConfigTool.description,
      inputSchema: getProjectConfigTool.inputSchema,
    },
    getProjectConfigTool.handler
  )

  server.registerTool(
    setProjectConfigTool.name,
    {
      title: setProjectConfigTool.title,
      description: setProjectConfigTool.description,
      inputSchema: setProjectConfigTool.inputSchema,
    },
    setProjectConfigTool.handler
  )

  server.registerTool(
    getProjectInfoTool.name,
    {
      title: getProjectInfoTool.title,
      description: getProjectInfoTool.description,
      inputSchema: getProjectInfoTool.inputSchema,
    },
    getProjectInfoTool.handler
  )

  return server
}

// Start server if run directly
createMcpServer().then(async server => {
  const transport = new StdioServerTransport()
  await server.connect(transport)
})
