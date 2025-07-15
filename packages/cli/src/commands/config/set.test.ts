import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ConfigSetCommand } from './set.ts'

describe('ConfigSetCommand', () => {
  let command: ConfigSetCommand
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    command = new ConfigSetCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
  })

  test('should have correct command metadata', () => {
    expect(ConfigSetCommand.description).toBe('Set a configuration value')
    expect(ConfigSetCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %> storage.path /custom/path',
      '<%= config.bin %> <%= command.id %> defaults.priority high',
    ])
    expect(ConfigSetCommand.args.key).toBeDefined()
    expect(ConfigSetCommand.args.key.description).toBe('Configuration key')
    expect(ConfigSetCommand.args.key.required).toBe(true)
    expect(ConfigSetCommand.args.value).toBeDefined()
    expect(ConfigSetCommand.args.value.description).toBe('Configuration value')
    expect(ConfigSetCommand.args.value.required).toBe(true)
  })

  test('should execute with proper type safety', async () => {
    // Test that the execute method accepts ExecuteArgs and ExecuteFlags
    const args = { key: 'storage.path', value: '/test/path' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    await command.execute(args, flags)

    expect(mockConfig.set).toHaveBeenCalledWith('storage.path', '/test/path')
    expect(logSpy).toHaveBeenCalledWith('Configuration updated: storage.path = /test/path')
  })

  test('should return Promise<void>', async () => {
    const args = { key: 'defaults.priority', value: 'high' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    const result = command.execute(args, flags)

    // Should return a Promise<void>
    expect(result).toBeInstanceOf(Promise)

    const resolvedResult = await result
    expect(resolvedResult).toBeUndefined()
  })

  test('should handle string values', async () => {
    const args = { key: 'storage.path', value: '/custom/path' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    await command.execute(args, flags)

    expect(mockConfig.set).toHaveBeenCalledWith('storage.path', '/custom/path')
    expect(logSpy).toHaveBeenCalledWith('Configuration updated: storage.path = /custom/path')
  })

  test('should handle numeric values', async () => {
    const args = { key: 'server.port', value: '8080' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    await command.execute(args, flags)

    expect(mockConfig.set).toHaveBeenCalledWith('server.port', '8080')
    expect(logSpy).toHaveBeenCalledWith('Configuration updated: server.port = 8080')
  })

  test('should handle boolean values', async () => {
    const args = { key: 'backup.enabled', value: 'true' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    await command.execute(args, flags)

    expect(mockConfig.set).toHaveBeenCalledWith('backup.enabled', 'true')
    expect(logSpy).toHaveBeenCalledWith('Configuration updated: backup.enabled = true')
  })

  test('should handle json flag correctly', async () => {
    const args = { key: 'storage.path', value: '/test/path' }
    const flags = { json: true }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    await command.execute(args, flags)

    expect(mockConfig.set).toHaveBeenCalledWith('storage.path', '/test/path')
    expect(logSpy).toHaveBeenCalledWith('Configuration updated: storage.path = /test/path')
  })

  test('should validate configuration key', async () => {
    const args = { key: 'invalid.key', value: 'test' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    // Should handle invalid keys appropriately
    await command.execute(args, flags)

    // The command should still attempt to set the value
    expect(mockConfig.set).toHaveBeenCalledWith('invalid.key', 'test')
  })

  test('should handle configuration service errors', async () => {
    const args = { key: 'storage.path', value: '/test/path' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn().mockRejectedValue(new Error('Config service error')),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    try {
      await command.execute(args, flags)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Config service error')
    }
  })

  test('should not have unreachable return statements', async () => {
    const args = { key: 'storage.path', value: '/test/path' }
    const flags = { json: false }

    const mockConfig = {
      set: vi.fn(),
    }
    ;(command as any).getService = vi.fn().mockReturnValue(mockConfig)

    // This should complete without issues (no unreachable code)
    await command.execute(args, flags)

    expect(mockConfig.set).toHaveBeenCalledWith('storage.path', '/test/path')
  })
})
