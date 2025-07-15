import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import packageJson from '../../package.json' with { type: 'json' }
import { McpCommand } from './mcp.ts'

// Mock the MCP server dependencies
vi.mock('@project-manager/mcp-server', () => ({
  createMcpServer: vi.fn().mockResolvedValue({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({})),
}))

describe('McpCommand', () => {
  let command: McpCommand
  let originalEnv: NodeJS.ProcessEnv
  let consoleErrorSpy: any
  let processExitSpy: any
  let logSpy: any

  beforeEach(() => {
    originalEnv = { ...process.env }
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    command = new McpCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
    vi.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('command.error called')
    })
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
    consoleErrorSpy.mockRestore()
    processExitSpy.mockRestore()
  })

  test('should show version with --version flag', async () => {
    await command.execute({ version: true })

    expect(logSpy).toHaveBeenCalledWith(packageJson.version)
  })

  test('should start MCP server in development mode', async () => {
    process.env.NODE_ENV = 'development'

    const { createMcpServer } = await import('@project-manager/mcp-server')
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)

    // Mock the signal listener to avoid infinite loop
    const mockProcessOn = vi.spyOn(process, 'on').mockImplementation(() => process)

    await command.execute({ version: false })

    expect(createMcpServer).toHaveBeenCalled()
    expect(mockServer.connect).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'MCP server started successfully in development mode (stdio)'
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith('[DEV] Server is ready to accept MCP connections')

    mockProcessOn.mockRestore()
  })

  test('should start MCP server in production mode', async () => {
    process.env.NODE_ENV = 'production'

    const { createMcpServer } = await import('@project-manager/mcp-server')
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)

    const mockProcessOn = vi.spyOn(process, 'on').mockImplementation(() => process)

    await command.execute({ version: false })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'MCP server started successfully in production mode (stdio)'
    )
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      '[DEV] Server is ready to accept MCP connections'
    )

    mockProcessOn.mockRestore()
  })

  test('should handle server creation error', async () => {
    const { createMcpServer } = await import('@project-manager/mcp-server')
    vi.mocked(createMcpServer).mockRejectedValue(new Error('Server creation failed'))

    try {
      await command.execute({ version: false })
    } catch (error) {
      expect(error).toEqual(new Error('command.error called'))
    }

    expect(createMcpServer).toHaveBeenCalled()
  })

  test('should handle server connection error', async () => {
    const { createMcpServer } = await import('@project-manager/mcp-server')
    const mockServer = {
      connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)

    try {
      await command.execute({ version: false })
    } catch (error) {
      expect(error).toEqual(new Error('command.error called'))
    }

    expect(createMcpServer).toHaveBeenCalled()
    expect(mockServer.connect).toHaveBeenCalled()
  })

  test('should have correct command metadata', () => {
    expect(McpCommand.description).toBe('Start MCP server for AI integration')
    expect(McpCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %> # Start MCP server in stdio mode',
      '<%= config.bin %> <%= command.id %> --help # Show available options',
    ])
    expect(McpCommand.flags.version).toBeDefined()
  })

  test('should use stdio transport', async () => {
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js')
    const { createMcpServer } = await import('@project-manager/mcp-server')

    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)
    const mockProcessOn = vi.spyOn(process, 'on').mockImplementation(() => process)

    await command.execute({ version: false })

    expect(StdioServerTransport).toHaveBeenCalled()
    expect(mockServer.connect).toHaveBeenCalled()

    mockProcessOn.mockRestore()
  })

  test('should properly close server on SIGINT signal', async () => {
    const { createMcpServer } = await import('@project-manager/mcp-server')

    // Mock server with both connect and close methods
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)

    // Create a non-throwing process.exit mock for this test
    const testProcessExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never
    })

    // Spy on process.on to capture the SIGINT handler
    let sigintHandler: (() => void) | undefined
    const mockProcessOn = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT' && typeof handler === 'function') {
        sigintHandler = handler
      }
      return process
    })

    // Execute the command
    await command.execute({ version: false })

    // Verify that SIGINT handler was registered
    expect(sigintHandler).toBeDefined()
    expect(mockServer.connect).toHaveBeenCalled()

    // Simulate SIGINT signal by invoking the captured handler
    if (sigintHandler) {
      sigintHandler()

      // Wait for the async gracefulShutdown to complete
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Assert that server's close method is called and process.exit is called with code 0
    expect(mockServer.close).toHaveBeenCalled()
    expect(testProcessExitSpy).toHaveBeenCalledWith(0)

    // Restore the mocked process.on and process.exit
    mockProcessOn.mockRestore()
    testProcessExitSpy.mockRestore()
  })

  test('should properly close server on SIGTERM signal', async () => {
    const { createMcpServer } = await import('@project-manager/mcp-server')

    // Mock server with both connect and close methods
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)

    // Create a non-throwing process.exit mock for this test
    const testProcessExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never
    })

    // Spy on process.on to capture the SIGTERM handler
    let sigtermHandler: (() => void) | undefined
    const mockProcessOn = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGTERM' && typeof handler === 'function') {
        sigtermHandler = handler
      }
      return process
    })

    // Execute the command
    await command.execute({ version: false })

    // Verify that SIGTERM handler was registered
    expect(sigtermHandler).toBeDefined()
    expect(mockServer.connect).toHaveBeenCalled()

    // Simulate SIGTERM signal by invoking the captured handler
    if (sigtermHandler) {
      sigtermHandler()

      // Wait for the async gracefulShutdown to complete
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Assert that server's close method is called and process.exit is called with code 0
    expect(mockServer.close).toHaveBeenCalled()
    expect(testProcessExitSpy).toHaveBeenCalledWith(0)

    // Restore the mocked process.on and process.exit
    mockProcessOn.mockRestore()
    testProcessExitSpy.mockRestore()
  })

  test('should handle server close errors during graceful shutdown', async () => {
    const { createMcpServer } = await import('@project-manager/mcp-server')

    // Mock server with close method that throws an error
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockRejectedValue(new Error('Close error')),
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)

    // Create a non-throwing process.exit mock for this test
    const testProcessExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never
    })

    // Spy on console.error to capture error messages
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Spy on process.on to capture the SIGINT handler
    let sigintHandler: (() => void) | undefined
    const mockProcessOn = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT' && typeof handler === 'function') {
        sigintHandler = handler
      }
      return process
    })

    // Execute the command
    await command.execute({ version: false })

    // Simulate SIGINT signal by invoking the captured handler
    if (sigintHandler) {
      sigintHandler()

      // Wait for the async gracefulShutdown to complete
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Assert that server's close method was called and error was logged
    expect(mockServer.close).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error during server shutdown:', expect.any(Error))
    expect(testProcessExitSpy).toHaveBeenCalledWith(0)

    // Restore all mocks
    mockProcessOn.mockRestore()
    testProcessExitSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  test('should handle server without close method during graceful shutdown', async () => {
    const { createMcpServer } = await import('@project-manager/mcp-server')

    // Mock server without close method
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
      // No close method
    }
    vi.mocked(createMcpServer).mockResolvedValue(mockServer as any)

    // Create a non-throwing process.exit mock for this test
    const testProcessExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never
    })

    // Spy on console.error to capture success message
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Spy on process.on to capture the SIGINT handler
    let sigintHandler: (() => void) | undefined
    const mockProcessOn = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT' && typeof handler === 'function') {
        sigintHandler = handler
      }
      return process
    })

    // Execute the command
    await command.execute({ version: false })

    // Simulate SIGINT signal by invoking the captured handler
    if (sigintHandler) {
      sigintHandler()

      // Wait for the async gracefulShutdown to complete
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Assert that graceful shutdown was attempted and process.exit was called
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Received SIGINT'))
    expect(testProcessExitSpy).toHaveBeenCalledWith(0)

    // Restore all mocks
    mockProcessOn.mockRestore()
    testProcessExitSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
})
