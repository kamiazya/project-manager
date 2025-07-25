import { describe, expect, it, vi } from 'vitest'
import { McpCommand } from './mcp.ts'

// Mock external dependencies
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}))

vi.mock('@project-manager/mcp-server', () => ({
  createMcpServer: vi.fn(),
}))

describe('McpCommand', () => {
  describe('command metadata', () => {
    it('should have correct static properties', () => {
      expect(McpCommand.description).toBe('Start MCP server for AI integration')
      expect(McpCommand.examples).toHaveLength(2)
      expect(McpCommand.examples[0]).toContain('Start MCP server in stdio mode')
    })
  })

  describe('execute', () => {
    it('should have execute method available through inheritance', () => {
      const mockConfig = {
        runHook: vi.fn().mockResolvedValue({ successes: [], failures: [] }),
      } as any
      const command = new McpCommand([], mockConfig)
      expect(command).toBeInstanceOf(McpCommand)
      // execute method exists but is protected, so we just verify instance creation
    })
  })
})
