#!/usr/bin/env tsx

/**
 * Development wrapper for the MCP server.
 * This script automatically sets NODE_ENV=development before executing the main MCP server.
 *
 * In production, this file is not included (see package.json publishConfig).
 * The production binary uses mcp-server.ts directly.
 */

// Force development environment
process.env.NODE_ENV = 'development'

// Import and execute the main MCP server
import './mcp-server.ts'
