#!/bin/bash

# MCP Server HTTP Mode Development Script
# Convenience script for starting MCP server in HTTP mode during development

# Set development environment
export NODE_ENV=development

# Parse arguments
PORT=3000
ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    [0-9]*)
      PORT=$1
      shift
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

echo "Starting MCP server in HTTP mode on port $PORT..."
echo "Additional arguments: ${ARGS[*]}"
echo "Press Ctrl+C to stop the server"
echo ""

# Start with tsx for hot-reload
pnpm exec tsx packages/mcp-server/src/bin/mcp-server.ts --http --port "$PORT" "${ARGS[@]}"