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

    mockOptions = {
      Command: {
        id: 'test-command',
      },
    }

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.NODE_ENV
  })

  it('should pass validation when storage directory exists and file is valid', async () => {
    // Arrange
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
        // Simulate successful exit
        if (event === 'exit') {
          callback(0) // Success exit code
        }
      }),
    }

    const mockSpawn = vi.fn().mockReturnValue(mockChild)

    // Mock dynamic import
    vi.doMock('node:child_process', () => ({
      spawn: mockSpawn,
    }))

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockSpawn).toHaveBeenCalledWith('tsx', ['--version'], { stdio: 'ignore' })
    expect(mockContext.warn).not.toHaveBeenCalledWith(expect.stringContaining('tsx'))
  })

  it('should handle validation errors gracefully', async () => {
    // Arrange
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
        // Simulate failed exit
        if (event === 'exit') {
          callback(1) // Non-zero exit code
        }
      }),
    }

    const mockSpawn = vi.fn().mockReturnValue(mockChild)

    // Mock dynamic import
    vi.doMock('node:child_process', () => ({
      spawn: mockSpawn,
    }))

    // Act
    await configValidationHook.call(mockContext, mockOptions)

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
        // Simulate process error
        if (event === 'error') {
          callback(new Error('tsx command not found'))
        }
      }),
    }

    const mockSpawn = vi.fn().mockReturnValue(mockChild)

    // Mock dynamic import
    vi.doMock('node:child_process', () => ({
      spawn: mockSpawn,
    }))

    // Act
    await configValidationHook.call(mockContext, mockOptions)

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

    let timeoutCallback: Function | undefined

    const mockChild = {
      kill: vi.fn(),
      on: vi.fn(), // No callbacks called - simulates hanging process
    }

    const mockSpawn = vi.fn().mockReturnValue(mockChild)

    // Mock dynamic import
    vi.doMock('node:child_process', () => ({
      spawn: mockSpawn,
    }))

    // Mock setTimeout to capture the timeout callback
    const originalSetTimeout = global.setTimeout
    global.setTimeout = vi.fn((callback, ms) => {
      if (ms === 3000) {
        timeoutCallback = callback
        return 123 as any // Mock timer id
      }
      return originalSetTimeout(callback, ms)
    }) as any

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Manually trigger timeout
    timeoutCallback?.()

    // Assert
    expect(mockChild.kill).toHaveBeenCalledWith('SIGKILL')
    expect(mockContext.warn).toHaveBeenCalledWith(
      'tsx availability check timed out. MCP hot reload may not work properly.'
    )
    expect(mockContext.warn).toHaveBeenCalledWith('Install tsx globally: npm install -g tsx')

    // Cleanup
    global.setTimeout = originalSetTimeout
  })

  it('should prevent duplicate warnings when both error and exit events occur', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    mockOptions.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    const callbacks: { [key: string]: Function } = {}

    const mockChild = {
      kill: vi.fn(),
      on: vi.fn((event, callback) => {
        callbacks[event] = callback
      }),
    }

    const mockSpawn = vi.fn().mockReturnValue(mockChild)

    // Mock dynamic import
    vi.doMock('node:child_process', () => ({
      spawn: mockSpawn,
    }))

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Simulate error event firing first (which should set hasCompleted = true)
    callbacks.error?.(new Error('tsx command not found'))

    // Then simulate exit event (which should be ignored)
    callbacks.exit?.(1)

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
