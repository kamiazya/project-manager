#!/bin/bash

# MCP Server HTTP Mode Development Script
# Convenience script for starting MCP server in HTTP mode during development
#
# Usage:
#   ./pm-mcp-http.sh [PORT] [ADDITIONAL_OPTIONS...]
#
# Arguments:
#   PORT               Optional port number (default: 3000)
#   ADDITIONAL_OPTIONS Any additional arguments to pass to the MCP server
#
# Examples:
#   ./pm-mcp-http.sh                    # Start on default port 3000
#   ./pm-mcp-http.sh 8080               # Start on port 8080
#   ./pm-mcp-http.sh 3001 --stateless   # Start on port 3001 with stateless mode
#   ./pm-mcp-http.sh --stateless        # Start on default port with stateless mode

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

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm is not installed or not in PATH"
  echo "Please install pnpm: npm install -g pnpm"
  exit 1
fi

# Check if tsx is available
if ! pnpm exec tsx --version &> /dev/null; then
  echo "Error: tsx is not available"
  echo "Please install dependencies: pnpm install"
  exit 1
fi

# Check if MCP server file exists
if [ ! -f "packages/mcp-server/src/bin/mcp-server.ts" ]; then
  echo "Error: MCP server file not found at packages/mcp-server/src/bin/mcp-server.ts"
  echo "Please ensure you are running this script from the project root directory"
  exit 1
fi

echo "Starting MCP server in HTTP mode on port $PORT..."
echo "Additional arguments: ${ARGS[*]}"
echo "Press Ctrl+C to stop the server"
echo ""

# Start with tsx for hot-reload
pnpm exec tsx packages/mcp-server/src/bin/mcp-server.ts --http --port "$PORT" "${ARGS[@]}"