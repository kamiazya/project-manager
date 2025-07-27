import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from '@project-manager/mcp-server'
import { createProjectManagerSDK } from '@project-manager/sdk'
import { BaseCommand } from '../lib/base-command'

/**
 * Start MCP server for AI integration
 */
export class McpCommand extends BaseCommand {
  static description = 'Start MCP server for AI integration'

  static examples = [
    '<%= config.bin %> <%= command.id %> # Start MCP server in stdio mode',
    '<%= config.bin %> <%= command.id %> --help # Show available options',
  ]

  protected async execute(
    _args: Record<string, unknown>,
    _flags: Record<string, unknown>
  ): Promise<void> {
    // Create MCP server using the SDK from CLI for process consistency
    try {
      const sdk = await createProjectManagerSDK()
      const logger = sdk.createLogger('mpc-server')
      const server = await createMcpServer(sdk)

      // Use stdio transport for mcp.json compatibility
      const transport = new StdioServerTransport()
      await server.connect(transport)

      // Log to stderr so it doesn't interfere with MCP protocol on stdout
      const environment = sdk.environment.getEnvironment()
      logger.debug(`MCP server started successfully in ${environment} environment (stdio)`)

      // Graceful shutdown function
      const gracefulShutdown = async (signal: string) => {
        logger.debug(`Received ${signal}, shutting down MCP server gracefully...`)
        try {
          if (server && typeof server.close === 'function') {
            await server.close()
            logger.debug('MCP server closed successfully')
          }
        } catch (error) {
          logger.error('Error during server shutdown:', {
            error: error instanceof Error ? error.message : String(error),
          })
        } finally {
          process.exit(0)
        }
      }

      // Keep the process alive and handle signals
      process.on('SIGINT', () => gracefulShutdown('SIGINT'))
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    } catch (error) {
      this.error(`Failed to start MCP server: ${error}`, { exit: 1 })
    }
  }
}
