import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { McpConfig } from './pm.ts'
import { validateMcpMode } from './pm.ts'

// Mock console methods to capture output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit() called')
})

// Helper function to test MCP mode validation with expected exit
function expectValidationError(mcpMode: string, expectedError: string, expectedUsage?: string) {
  expect(() => validateMcpMode(mcpMode)).toThrow('process.exit() called')
  expect(mockConsoleError).toHaveBeenCalledWith(expectedError)
  if (expectedUsage) {
    expect(mockConsoleError).toHaveBeenCalledWith(expectedUsage)
  }
  expect(mockProcessExit).toHaveBeenCalledWith(1)
}

describe('MCP Mode Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Valid MCP modes', () => {
    it('should accept stdio mode', () => {
      const result = validateMcpMode('stdio')

      expect(result).toEqual({
        transportMode: 'stdio',
        httpPort: '3000',
        isStateless: false,
      })
      expect(mockProcessExit).not.toHaveBeenCalled()
    })

    it('should accept http mode with default port', () => {
      const result = validateMcpMode('http')

      expect(result).toEqual({
        transportMode: 'http',
        httpPort: '3000',
        isStateless: false,
      })
      expect(mockProcessExit).not.toHaveBeenCalled()
    })

    it('should accept http mode with custom port', () => {
      const result = validateMcpMode('http:8080')

      expect(result).toEqual({
        transportMode: 'http',
        httpPort: '8080',
        isStateless: false,
      })
      expect(mockProcessExit).not.toHaveBeenCalled()
    })

    it('should accept http mode with stateless flag', () => {
      const result = validateMcpMode('http:3000:stateless')

      expect(result).toEqual({
        transportMode: 'http',
        httpPort: '3000',
        isStateless: true,
      })
      expect(mockProcessExit).not.toHaveBeenCalled()
    })

    it('should accept http mode with custom port and stateless flag', () => {
      const result = validateMcpMode('http:9000:stateless')

      expect(result).toEqual({
        transportMode: 'http',
        httpPort: '9000',
        isStateless: true,
      })
      expect(mockProcessExit).not.toHaveBeenCalled()
    })

    it('should handle port boundary values correctly', () => {
      // Test minimum valid port
      const result1 = validateMcpMode('http:1')
      expect(result1.httpPort).toBe('1')
      expect(mockProcessExit).not.toHaveBeenCalled()

      // Test maximum valid port
      const result2 = validateMcpMode('http:65535')
      expect(result2.httpPort).toBe('65535')
      expect(mockProcessExit).not.toHaveBeenCalled()
    })
  })

  describe('Invalid MCP modes', () => {
    it('should reject invalid transport mode', () => {
      expectValidationError(
        'invalid-mode',
        "Error: Invalid MCP transport mode 'invalid-mode'. Allowed values: stdio, http",
        'Usage: --mcp stdio | --mcp http:port[:stateless]'
      )
    })

    it('should reject empty transport mode', () => {
      expectValidationError(
        '',
        "Error: Invalid MCP transport mode ''. Allowed values: stdio, http",
        'Usage: --mcp stdio | --mcp http:port[:stateless]'
      )
    })

    it('should reject invalid port numbers', () => {
      expectValidationError(
        'http:abc',
        "Error: Invalid port 'abc'. Port must be a number between 1 and 65535"
      )
    })

    it('should reject port 0', () => {
      expectValidationError(
        'http:0',
        "Error: Invalid port '0'. Port must be a number between 1 and 65535"
      )
    })

    it('should reject port above 65535', () => {
      expectValidationError(
        'http:99999',
        "Error: Invalid port '99999'. Port must be a number between 1 and 65535"
      )
    })

    it('should reject negative port numbers', () => {
      expectValidationError(
        'http:-1',
        "Error: Invalid port '-1'. Port must be a number between 1 and 65535"
      )
    })

    it('should reject float port numbers', () => {
      expectValidationError(
        'http:3000.5',
        "Error: Invalid port '3000.5'. Port must be a number between 1 and 65535"
      )
    })

    it('should reject invalid flags', () => {
      expectValidationError(
        'http:3000:invalid',
        "Error: Invalid flag 'invalid'. Only 'stateless' flag is supported",
        'Usage: --mcp http:port:stateless'
      )
    })

    it('should reject extra parameters for stdio mode', () => {
      expectValidationError(
        'stdio:extra',
        "Error: stdio mode does not accept additional parameters: 'stdio:extra'",
        'Usage: --mcp stdio'
      )
    })

    it('should reject too many parameters for http mode', () => {
      expectValidationError(
        'http:3000:stateless:extra',
        "Error: Too many parameters in MCP mode 'http:3000:stateless:extra'",
        'Usage: --mcp http:port[:stateless]'
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle typos in transport mode', () => {
      expectValidationError(
        'stido',
        "Error: Invalid MCP transport mode 'stido'. Allowed values: stdio, http"
      )

      expectValidationError(
        'htpp',
        "Error: Invalid MCP transport mode 'htpp'. Allowed values: stdio, http"
      )
    })

    it('should handle typos in stateless flag', () => {
      expectValidationError(
        'http:3000:stateles',
        "Error: Invalid flag 'stateles'. Only 'stateless' flag is supported"
      )

      expectValidationError(
        'http:3000:STATELESS',
        "Error: Invalid flag 'STATELESS'. Only 'stateless' flag is supported"
      )
    })

    it('should handle empty port', () => {
      expectValidationError(
        'http:',
        "Error: Invalid port ''. Port must be a number between 1 and 65535"
      )
    })

    it('should handle whitespace in parameters', () => {
      expectValidationError(
        'http: 3000',
        "Error: Invalid port ' 3000'. Port must be a number between 1 and 65535"
      )
    })

    it('should handle special characters in port', () => {
      expectValidationError(
        'http:30@0',
        "Error: Invalid port '30@0'. Port must be a number between 1 and 65535"
      )
    })

    it('should handle multiple colons without parameters', () => {
      expectValidationError(
        'http::',
        "Error: Invalid port ''. Port must be a number between 1 and 65535"
      )
    })

    it('should handle case sensitivity', () => {
      expectValidationError(
        'HTTP:3000',
        "Error: Invalid MCP transport mode 'HTTP'. Allowed values: stdio, http"
      )

      expectValidationError(
        'STDIO',
        "Error: Invalid MCP transport mode 'STDIO'. Allowed values: stdio, http"
      )
    })
  })

  describe('Return value validation', () => {
    it('should return correct type for McpConfig', () => {
      const result: McpConfig = validateMcpMode('stdio')

      expect(typeof result.transportMode).toBe('string')
      expect(typeof result.httpPort).toBe('string')
      expect(typeof result.isStateless).toBe('boolean')

      expect(['stdio', 'http']).toContain(result.transportMode)
    })

    it('should return consistent defaults for stdio', () => {
      const result = validateMcpMode('stdio')

      expect(result.transportMode).toBe('stdio')
      expect(result.httpPort).toBe('3000') // Default port even for stdio
      expect(result.isStateless).toBe(false)
    })

    it('should return consistent defaults for http without port', () => {
      const result = validateMcpMode('http')

      expect(result.transportMode).toBe('http')
      expect(result.httpPort).toBe('3000')
      expect(result.isStateless).toBe(false)
    })
  })
})
