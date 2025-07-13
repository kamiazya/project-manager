import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpServer } from '../index.js'
import {
  isDevelopment,
  logDevelopmentInfo,
  setupDevelopmentSignalHandlers,
  writePidFile,
} from '../utils/dev-helpers.js'

async function main() {
  try {
    // Handle command line arguments
    const args = process.argv.slice(2)
    const isHttpMode = args.includes('--http')
    const isStateless = args.includes('--stateless')
    const port = parseInt(args.find((arg, i) => args[i - 1] === '--port') || '3000')

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
      console.log('0.0.0')
      process.exit(0)
    }

    // Setup development environment
    if (isDevelopment()) {
      setupDevelopmentSignalHandlers()
      writePidFile()
      logDevelopmentInfo()
    }

    console.error('Starting MCP server...')
    const server = await createMcpServer()

    if (isHttpMode) {
      // Store transports by session ID for stateful mode
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}

      // Create HTTP server
      const httpServer = createServer(async (req, res) => {
        // Enable CORS for development
        if (isDevelopment()) {
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
              // Stateless mode: create new server and transport for each request
              const newServer = await createMcpServer()
              const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined, // Disable sessions for stateless mode
              })

              res.on('close', () => {
                transport.close()
                newServer.close()
              })

              await newServer.connect(transport)

              // Read request body
              let body = ''
              req.on('data', chunk => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const requestData = JSON.parse(body)
                  await transport.handleRequest(req, res, requestData)
                } catch (parseError) {
                  console.error('Error parsing request body:', parseError)
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
              })
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

              // Read request body
              let body = ''
              req.on('data', chunk => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const requestData = JSON.parse(body)
                  await transport.handleRequest(req, res, requestData)
                } catch (parseError) {
                  console.error('Error parsing request body:', parseError)
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
              })
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
        const mode = isDevelopment() ? 'development' : 'production'
        const statefulMode = isStateless ? 'stateless' : 'stateful'
        console.error(
          `MCP HTTP server started on http://127.0.0.1:${port} in ${mode} mode (${statefulMode})`
        )

        if (isDevelopment()) {
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

      const mode = isDevelopment() ? 'development' : 'production'
      console.error(`MCP server started successfully in ${mode} mode (stdio)`)

      if (isDevelopment()) {
        console.error('[DEV] Server is ready to accept connections')
        console.error('[DEV] To restart the server, save any file in the src/ directory')
      }
    }
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    if (isDevelopment()) {
      console.error('[DEV] Check the error above and save a file to restart')
    }
    process.exit(1)
  }
}

main()
