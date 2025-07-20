import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  type EnvironmentMode,
  getEnvironmentDisplayName,
  isDevelopmentLike,
  shouldLogVerbose,
} from '@project-manager/base'
import { NodeEnvironmentDetectionService } from '@project-manager/infrastructure'
import { createProjectManagerSDK } from '@project-manager/sdk'
import packageJson from '../../package.json' with { type: 'json' }
import { createMcpServer } from '../index.ts'

/**
 * Helper function to parse request body as JSON
 */
async function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body)
        resolve(requestData)
      } catch (parseError) {
        reject(parseError)
      }
    })
    req.on('error', (error: Error) => {
      reject(error)
    })
  })
}

/**
 * Helper function to send JSON-RPC parse error response
 */
function sendParseErrorResponse(res: ServerResponse, error: unknown): void {
  console.error('Error parsing request body:', error)
  if (!res.headersSent) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      })
    )
  }
}

async function main() {
  // Detect environment early - outside try block so it's available in catch
  const environmentService = new NodeEnvironmentDetectionService()
  const environment: EnvironmentMode = environmentService.detectEnvironment()

  try {
    // Handle command line arguments
    const args = process.argv.slice(2)
    const isHttpMode = args.includes('--http')
    const isStateless = args.includes('--stateless')
    const portArg = args.find((_, i) => args[i - 1] === '--port') || '3000'
    const parsedPort = parseInt(portArg, 10)

    // Validate port range (1-65535) and handle invalid values
    let port: number
    if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      console.error(
        `Invalid port: ${portArg}. Port must be a number between 1 and 65535. Using default port 3000.`
      )
      port = 3000
    } else {
      port = parsedPort
    }

    if (args.includes('--help') || args.includes('-h')) {
      console.log('project-manager MCP Server')
      console.log('Usage: pm-mcp-server [options]')
      console.log('Options:')
      console.log('  --help, -h        Show help')
      console.log('  --version, -v     Show version')
      console.log('  --http            Start as HTTP server (default: stdio)')
      console.log('  --port <number>   HTTP port (default: 3000)')
      console.log('  --stateless       Use stateless mode (default: stateful)')
      process.exit(0)
    }

    if (args.includes('--version') || args.includes('-v')) {
      console.log(packageJson.version)
      process.exit(0)
    }

    console.error('Starting MCP server...')

    // Initialize SDK for MCP server
    const sdk = await createProjectManagerSDK({ environment: 'auto' })

    // Setup development environment using SDK services
    if (isDevelopmentLike(environment)) {
      if (sdk.development.isAvailable()) {
        const processService = sdk.development.getProcessService()
        await processService.registerProcess(process.pid)

        if (shouldLogVerbose(environment)) {
          const environmentDisplayName = getEnvironmentDisplayName(environment)
          console.error(`[DEV] MCP Server started in ${environmentDisplayName} environment`)
          console.error(`[DEV] Process ID: ${process.pid}`)
          console.error(`[DEV] Node version: ${process.version}`)
          console.error(`[DEV] Working directory: ${process.cwd()}`)
          console.error(`[DEV] Hot reload enabled - make changes to see them applied automatically`)
        }
      }
    }

    const server = await createMcpServer(sdk)

    if (isHttpMode) {
      // Store transports by session ID for stateful mode
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}

      // Create HTTP server
      const httpServer = createServer(async (req, res) => {
        // Enable CORS for development
        if (isDevelopmentLike(environment)) {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id')
          res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')

          if (req.method === 'OPTIONS') {
            res.writeHead(200)
            res.end()
            return
          }
        }

        try {
          if (req.method === 'POST') {
            // Handle main MCP communication
            if (isStateless) {
              // Stateless mode: reuse server instance, create new transport for each request
              const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined, // Disable sessions for stateless mode
              })

              // Clean up transport when response is finished
              res.on('close', () => {
                transport.close()
              })

              await server.connect(transport)

              // Parse request body and handle request
              try {
                const requestData = await parseRequestBody(req)
                await transport.handleRequest(req, res, requestData)
              } catch (parseError) {
                sendParseErrorResponse(res, parseError)
              }
            } else {
              // Stateful mode: reuse or create transport by session ID
              const sessionId = req.headers['mcp-session-id'] as string
              let transport: StreamableHTTPServerTransport

              if (sessionId && transports[sessionId]) {
                // Reuse existing transport
                transport = transports[sessionId]
              } else {
                // Create new transport for initialization
                transport = new StreamableHTTPServerTransport({
                  sessionIdGenerator: () => randomUUID(),
                  onsessioninitialized: sessionId => {
                    transports[sessionId] = transport
                  },
                })

                // Clean up transport when closed
                transport.onclose = () => {
                  if (transport.sessionId) {
                    delete transports[transport.sessionId]
                  }
                }

                await server.connect(transport)
              }

              // Parse request body and handle request
              try {
                const requestData = await parseRequestBody(req)
                await transport.handleRequest(req, res, requestData)
              } catch (parseError) {
                sendParseErrorResponse(res, parseError)
              }
            }
          } else if (req.method === 'GET') {
            // Handle SSE notifications for stateful mode
            if (isStateless) {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(
                JSON.stringify({
                  jsonrpc: '2.0',
                  error: {
                    code: -32000,
                    message: 'SSE notifications not supported in stateless mode',
                  },
                  id: null,
                })
              )
              return
            }

            const sessionId = req.headers['mcp-session-id'] as string
            if (!sessionId || !transports[sessionId]) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Invalid or missing session ID' }))
              return
            }

            const transport = transports[sessionId]
            await transport.handleRequest(req, res)
          } else if (req.method === 'DELETE') {
            // Handle session termination for stateful mode
            if (isStateless) {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(
                JSON.stringify({
                  jsonrpc: '2.0',
                  error: {
                    code: -32000,
                    message: 'Session termination not needed in stateless mode',
                  },
                  id: null,
                })
              )
              return
            }

            const sessionId = req.headers['mcp-session-id'] as string
            if (!sessionId || !transports[sessionId]) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Invalid or missing session ID' }))
              return
            }

            const transport = transports[sessionId]
            await transport.handleRequest(req, res)
          } else {
            res.writeHead(405, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Method not allowed' }))
          }
        } catch (error) {
          console.error('Error handling HTTP request:', error)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Internal server error' },
                id: null,
              })
            )
          }
        }
      })

      // Start HTTP server
      httpServer.listen(port, '127.0.0.1', () => {
        const environmentDisplayName = getEnvironmentDisplayName(environment)
        const statefulMode = isStateless ? 'stateless' : 'stateful'
        console.error(
          `MCP HTTP server started on http://127.0.0.1:${port} in ${environmentDisplayName} environment (${statefulMode})`
        )

        if (isDevelopmentLike(environment)) {
          console.error('[DEV] Server is ready to accept HTTP connections')
          console.error('[DEV] To restart the server, save any file in the src/ directory')
          console.error(
            `[DEV] Test endpoint: curl -X POST http://127.0.0.1:${port} -H "Content-Type: application/json"`
          )
        }
      })

      // Graceful shutdown
      process.on('SIGINT', () => {
        console.error('\nShutting down HTTP server...')
        httpServer.close(() => {
          process.exit(0)
        })
      })
    } else {
      // Default stdio mode
      const transport = new StdioServerTransport()
      await server.connect(transport)

      const environmentDisplayName = getEnvironmentDisplayName(environment)
      console.error(
        `MCP server started successfully in ${environmentDisplayName} environment (stdio)`
      )

      if (isDevelopmentLike(environment)) {
        console.error('[DEV] Server is ready to accept connections')
        console.error('[DEV] To restart the server, save any file in the src/ directory')
      }
    }
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    if (isDevelopmentLike(environment)) {
      console.error('[DEV] Check the error above and save a file to restart')
    }
    process.exit(1)
  }
}

main()
