import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { McpCommand } from './mcp.ts'

// Mock external dependencies
vi.mock('@project-manager/mcp-server', () => ({
  createMcpServer: vi.fn(),
}))

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
  })),
}))

describe('McpCommand', () => {
  let command: McpCommand
  let mockCreateMcpServer: any
  let consoleErrorSpy: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Import and setup mocks
    const { createMcpServer } = await import('@project-manager/mcp-server')
    mockCreateMcpServer = vi.mocked(createMcpServer)

    // Mock console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Create command instance with minimal config
    command = new McpCommand([], { bin: 'pm' } as any)

    // Mock command methods
    vi.spyOn(command, 'log').mockImplementation(() => {})
    vi.spyOn(command, 'error').mockImplementation((input: string | Error) => {
      const msg = typeof input === 'string' ? input : input.message
      throw new Error(`Command error: ${msg}`)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('server startup', () => {
    it('should start MCP server successfully', async () => {
      const mockServer = {
        connect: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      }
      mockCreateMcpServer.mockResolvedValue(mockServer)

      // Mock process.on to avoid infinite loop
      const processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process)

      await command.execute({}, {})

      expect(mockCreateMcpServer).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('MCP server started successfully')
      )

      processOnSpy.mockRestore()
    })

    it('should handle server creation failure', async () => {
      const error = new Error('Failed to create server')
      mockCreateMcpServer.mockRejectedValue(error)

      await expect(command.execute({}, {})).rejects.toThrow('Command error:')
      expect(mockCreateMcpServer).toHaveBeenCalled()
    })
  })

  describe('command metadata', () => {
    it('should have correct static properties', () => {
      expect(McpCommand.description).toBe('Start MCP server for AI integration')
      expect(McpCommand.examples).toEqual([
        '<%= config.bin %> <%= command.id %> # Start MCP server in stdio mode',
        '<%= config.bin %> <%= command.id %> --help # Show available options',
      ])
    })
  })
})
