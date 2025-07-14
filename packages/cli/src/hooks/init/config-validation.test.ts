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
    mockOptions.Command.id = 'mcp'

    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{"tickets": []}')

    const mockSpawn = vi.fn().mockReturnValue({
      on: vi.fn((event, callback) => {
        if (event === 'error') {
          callback(new Error('tsx not found'))
        }
      }),
    })

    // Mock dynamic import
    vi.doMock('node:child_process', () => ({
      spawn: mockSpawn,
    }))

    // Act
    await configValidationHook.call(mockContext, mockOptions)

    // Assert
    expect(mockSpawn).toHaveBeenCalledWith('tsx', ['--version'], { stdio: 'ignore' })
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

  it('should skip tsx check in CI environment', async () => {
    // Arrange
    process.env.NODE_ENV = 'development'
    process.env.CI = 'true'
    mockOptions.Command.id = 'mcp'

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
})
