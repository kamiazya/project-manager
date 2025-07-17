import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import configValidationHook from './config-validation.ts'

// Mock Node.js fs functions
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

// Mock config utility
vi.mock('../../utils/config.ts', () => ({
  getStoragePath: vi.fn(() => '/mock/storage/path/tickets.json'),
}))

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}))

describe('configValidationHook', () => {
  let mockContext: any
  let mockOptions: any

  beforeEach(() => {
    mockContext = {
      warn: vi.fn(),
    }

    mockOptions = {}

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.NODE_ENV
    delete process.env.CI
  })

  it('should pass validation when storage directory exists and file is valid', async () => {
    // Arrange
    mockOptions.id = 'test-command'
    vi.mocked(existsSync)
      .mockReturnValueOnce(true) // storageDir exists
      .mockReturnValueOnce(true) // storageFile exists

    vi.mocked(readFileSync).mockReturnValue('{"tickets": [], "epics": []}')

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it('should warn when storage directory does not exist', async () => {
    // Arrange
    mockOptions.id = 'test-command'
    vi.mocked(existsSync).mockReturnValue(false) // storageDir does not exist

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Storage directory does not exist: /mock/storage/path'
    )
  })

  it('should handle corrupted storage file', async () => {
    // Arrange
    mockOptions.id = 'test-command'
    vi.mocked(existsSync)
      .mockReturnValueOnce(true) // storageDir exists
      .mockReturnValueOnce(true) // storageFile exists

    vi.mocked(readFileSync)
      .mockReturnValueOnce('invalid json content') // corrupted file
      .mockReturnValueOnce('invalid json content') // for backup

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Storage file is corrupted or invalid JSON: /mock/storage/path/tickets.json'
    )
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Creating backup and initializing fresh storage...'
    )
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.backup.'),
      'invalid json content'
    )
    expect(writeFileSync).toHaveBeenCalledWith(
      '/mock/storage/path/tickets.json',
      '{\n  "tickets": [],\n  "epics": []\n}'
    )
  })

  it('should handle backup creation failure with error details', async () => {
    // Arrange
    mockOptions.id = 'test-command'
    vi.mocked(existsSync)
      .mockReturnValueOnce(true) // storageDir exists
      .mockReturnValueOnce(true) // storageFile exists

    vi.mocked(readFileSync)
      .mockReturnValueOnce('invalid json content') // corrupted file
      .mockImplementationOnce(() => {
        throw new Error('Permission denied: cannot read file')
      }) // backup creation fails

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Storage file is corrupted or invalid JSON: /mock/storage/path/tickets.json'
    )
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Creating backup and initializing fresh storage...'
    )
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Failed to create backup of corrupted file: Permission denied: cannot read file'
    )
    // Should still attempt to reset the storage file
    expect(writeFileSync).toHaveBeenCalledWith(
      '/mock/storage/path/tickets.json',
      '{\n  "tickets": [],\n  "epics": []\n}'
    )
  })

  it('should handle backup write failure with error details', async () => {
    // Arrange
    mockOptions.id = 'test-command'
    vi.mocked(existsSync)
      .mockReturnValueOnce(true) // storageDir exists
      .mockReturnValueOnce(true) // storageFile exists

    vi.mocked(readFileSync).mockReturnValue('invalid json content') // corrupted file

    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw new Error('Disk full: cannot write backup file')
    }) // backup write fails

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Storage file is corrupted or invalid JSON: /mock/storage/path/tickets.json'
    )
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Creating backup and initializing fresh storage...'
    )
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Failed to create backup of corrupted file: Disk full: cannot write backup file'
    )
    // Should still attempt to reset the storage file (second writeFileSync call)
    expect(writeFileSync).toHaveBeenCalledTimes(2)
  })

  it('should handle empty storage file', async () => {
    // Arrange
    mockOptions.id = 'test-command'
    vi.mocked(existsSync)
      .mockReturnValueOnce(true) // storageDir exists
      .mockReturnValueOnce(true) // storageFile exists

    vi.mocked(readFileSync).mockReturnValue('   ') // empty/whitespace file

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it('should warn for unknown NODE_ENV values', async () => {
    // Arrange
    process.env.NODE_ENV = 'unknown'
    mockOptions.id = 'test-command'
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Unknown NODE_ENV value: unknown. Expected: development, production, or test'
    )
  })

  it('should check tsx availability for MCP command in development', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    mockOptions.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    const mockChild = {
      kill: vi.fn(),
      on: vi.fn((event, callback) => {
        // Simulate successful exit immediately
        if (event === 'exit') {
          setImmediate(() => callback(0)) // Success exit code
        }
      }),
    }

    // Configure the existing spawn mock
    vi.mocked(spawn).mockReturnValue(mockChild as any)

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Wait for the next tick to ensure async callbacks have executed
    await new Promise(resolve => setImmediate(resolve))

    // Assert
    expect(spawn).toHaveBeenCalledWith('tsx', ['--version'], { stdio: 'ignore' })
    expect(mockContext.warn).not.toHaveBeenCalledWith(expect.stringContaining('tsx'))
  })

  it('should handle validation errors gracefully', async () => {
    // Arrange
    mockOptions.id = 'test-command'
    vi.mocked(existsSync).mockImplementation(() => {
      throw new Error('File system error')
    })

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'Configuration validation failed: File system error'
    )
  })

  it('should warn when tsx command fails with non-zero exit code', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    mockOptions.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    const mockChild = {
      kill: vi.fn(),
      on: vi.fn((event, callback) => {
        // Simulate failed exit immediately
        if (event === 'exit') {
          setImmediate(() => callback(1)) // Non-zero exit code
        }
      }),
    }

    // Configure the existing spawn mock
    vi.mocked(spawn).mockReturnValue(mockChild as any)

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Wait for the next tick to ensure async callbacks have executed
    await new Promise(resolve => setImmediate(resolve))

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'tsx command failed with exit code 1. MCP hot reload may not work properly.'
    )
    expect(mockContext.warn).toHaveBeenCalledWith('Install tsx globally: npm install -g tsx')
  })

  it('should warn when tsx command errors', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    mockOptions.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    const mockChild = {
      kill: vi.fn(),
      on: vi.fn((event, callback) => {
        // Simulate process error immediately
        if (event === 'error') {
          setImmediate(() => callback(new Error('tsx command not found')))
        }
      }),
    }

    // Configure the existing spawn mock
    vi.mocked(spawn).mockReturnValue(mockChild as any)

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Wait for the next tick to ensure async callbacks have executed
    await new Promise(resolve => setImmediate(resolve))

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      'tsx is not available: tsx command not found. MCP hot reload may not work properly.'
    )
    expect(mockContext.warn).toHaveBeenCalledWith('Install tsx globally: npm install -g tsx')
  })

  it('should handle tsx availability check timeout', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    mockOptions.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    const mockChild = {
      kill: vi.fn(),
      on: vi.fn((event, _callback) => {
        // Store the timeout callback for manual triggering
        if (event === 'exit' || event === 'error') {
          // Don't call the callback - simulate hanging process
        }
      }),
    }

    // Configure the existing spawn mock
    vi.mocked(spawn).mockReturnValue(mockChild as any)

    // Mock setTimeout to immediately call the timeout callback
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
      if (delay === 3000) {
        // This is our timeout - trigger it immediately
        setImmediate(() => {
          if (typeof callback === 'function') {
            callback()
          }
        })
        return 123 as any // fake timeout ID
      }
      return setTimeout(callback as any, delay) // use original for other timeouts
    })

    try {
      // Act
      await configValidationHook.call(mockContext, mockOptions)

      // Wait for async operations
      await new Promise(resolve => setImmediate(resolve))

      // Assert
      expect(mockChild.kill).toHaveBeenCalledWith('SIGKILL')
      expect(mockContext.warn).toHaveBeenCalledWith(
        'tsx availability check timed out. MCP hot reload may not work properly.'
      )
      expect(mockContext.warn).toHaveBeenCalledWith('Install tsx globally: npm install -g tsx')
    } finally {
      // Cleanup
      setTimeoutSpy.mockRestore()
    }
  })

  it('should prevent duplicate warnings when both error and exit events occur', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    mockOptions.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    const mockChild = {
      kill: vi.fn(),
      on: vi.fn((event, callback) => {
        // Simulate both error and exit events occurring in sequence
        if (event === 'error') {
          // Trigger error first
          setImmediate(() => {
            callback(new Error('tsx command not found'))
            // Then immediately trigger exit - this should be ignored
            if (exitHandlers.length > 0) {
              exitHandlers[0](1)
            }
          })
        } else if (event === 'exit') {
          // Store exit handlers for later use
          exitHandlers.push(callback)
        }
      }),
    }

    const exitHandlers: any[] = []

    // Configure the existing spawn mock
    vi.mocked(spawn).mockReturnValue(mockChild as any)

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Wait for async operations to complete
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))

    // Assert - only one set of warnings should be shown (from error event)
    expect(mockContext.warn).toHaveBeenCalledWith(
      'tsx is not available: tsx command not found. MCP hot reload may not work properly.'
    )
    expect(mockContext.warn).toHaveBeenCalledWith('Install tsx globally: npm install -g tsx')
    // Should not have duplicate warnings for exit event
    expect(mockContext.warn).not.toHaveBeenCalledWith(
      'tsx command failed with exit code 1. MCP hot reload may not work properly.'
    )
    // Should have been called exactly twice (once for each warning from error event)
    expect(mockContext.warn).toHaveBeenCalledTimes(2)
  })

  it('should skip tsx check in CI environment', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    process.env.CI = 'true'
    mockOptions.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    // Should not attempt to check tsx in CI environment
    expect(mockContext.warn).not.toHaveBeenCalledWith(expect.stringContaining('tsx'))

    // Cleanup
    delete process.env.CI
  })

  it('should skip tsx check for non-MCP commands', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    mockOptions.id = 'create' // Not MCP command

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert - should not attempt tsx check for non-MCP commands
    expect(mockContext.warn).not.toHaveBeenCalledWith(expect.stringContaining('tsx'))
  })
})
