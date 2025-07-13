import { describe, expect, it } from 'vitest'
import { createMcpServer } from './index.js'

describe('MCP Server', () => {
  describe('createMcpServer', () => {
    it('should create MCP server with correct configuration', async () => {
      const server = await createMcpServer()

      expect(server).toBeDefined()
      expect(server.name).toBe('project-manager-mcp')
      expect(server.version).toBe('0.0.0')
    })

    it('should handle tools/list request', async () => {
      const server = await createMcpServer()

      // Simulate tools/list request
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: '1',
        method: 'tools/list',
        params: {},
      })

      expect(response.result).toBeDefined()
      expect(response.result.tools).toBeDefined()
      expect(response.result.tools.length).toBe(6)

      const toolNames = response.result.tools.map((tool: any) => tool.name)
      expect(toolNames).toContain('create_ticket')
      expect(toolNames).toContain('get_ticket')
      expect(toolNames).toContain('list_tickets')
      expect(toolNames).toContain('update_ticket_status')
      expect(toolNames).toContain('search_tickets')
      expect(toolNames).toContain('get_ticket_stats')
    })
  })
})
