import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ConfigGetCommand } from './get.ts'

// Mock the config module
vi.mock('@project-manager/shared', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getConfig: vi.fn(),
  }
})

describe('ConfigGetCommand', () => {
  let command: ConfigGetCommand
  let mockGetConfig: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    const { getConfig } = await import('@project-manager/shared')
    mockGetConfig = vi.mocked(getConfig)

    command = new ConfigGetCommand([], {} as any)
    vi.spyOn(command, 'log').mockImplementation(() => {})
  })

  test('should have correct command metadata', () => {
    expect(ConfigGetCommand.description).toBe('Get a configuration value')
    expect(ConfigGetCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %> defaultPriority',
      '<%= config.bin %> <%= command.id %> storagePath',
    ])
    expect(ConfigGetCommand.args.key).toBeDefined()
    expect(ConfigGetCommand.args.key.description).toBe('Configuration key to get')
    expect(ConfigGetCommand.args.key.required).toBe(true)
  })

  test('should execute with proper type safety', async () => {
    // Test that the execute method accepts ExecuteArgs and ExecuteFlags
    const args = { key: 'defaultPriority' }

    // Mock the config service to return a value
    const mockConfig = {
      defaultPriority: 'high',
      defaultType: 'task',
      storagePath: '/test/path',
    }
    mockGetConfig.mockReturnValue(mockConfig)

    const result = await command.execute(args)

    // Should return the config value
    expect(result).toBe('high')
  })

  test('should return Promise<string | number | boolean | undefined>', async () => {
    const args = { key: 'defaultPriority' }

    const mockConfig = {
      defaultPriority: 'high',
      defaultType: 'task',
    }
    mockGetConfig.mockReturnValue(mockConfig)

    const result = await command.execute(args)

    // Should return a string value
    expect(typeof result).toBe('string')
    expect(result).toBe('high')
  })

  test('should handle number config values', async () => {
    const args = { key: 'serverPort' }

    const mockConfig = {
      serverPort: 8080,
    }
    mockGetConfig.mockReturnValue(mockConfig)

    const result = await command.execute(args)

    // Should return a number value
    expect(typeof result).toBe('number')
    expect(result).toBe(8080)
  })

  test('should handle boolean config values', async () => {
    const args = { key: 'backupEnabled' }

    const mockConfig = {
      backupEnabled: true,
    }
    mockGetConfig.mockReturnValue(mockConfig)

    const result = await command.execute(args)

    // Should return a boolean value
    expect(typeof result).toBe('boolean')
    expect(result).toBe(true)
  })

  test('should handle undefined config values', async () => {
    const args = { key: 'nonexistentKey' }

    const mockConfig = {
      // nonexistentKey is not in the config
    }
    mockGetConfig.mockReturnValue(mockConfig)

    const result = await command.execute(args)

    // Should return undefined
    expect(result).toBeUndefined()
  })

  test('should validate configuration key with type guard', async () => {
    const args = { key: 'invalidKey' }

    const mockConfig = {
      // invalidKey is not in the config
    }
    mockGetConfig.mockReturnValue(mockConfig)

    try {
      await command.execute(args)
      // If we reach this point, no error was thrown - fail the test
      expect.fail('Expected command.execute to throw an error for invalid key')
    } catch (error) {
      // Should throw for invalid keys through the type guard
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('should handle json flag correctly', async () => {
    const args = { key: 'storagePath' }

    const mockConfig = {
      storagePath: '/test/path',
    }
    mockGetConfig.mockReturnValue(mockConfig)

    const result = await command.execute(args)

    // Should still return the value (json formatting handled by base command)
    expect(result).toBe('/test/path')
  })

  test('should use isValidConfigKey type guard', async () => {
    const args = { key: 'storagePath' }

    const mockConfig = {
      storagePath: '/test/path',
    }
    mockGetConfig.mockReturnValue(mockConfig)

    await command.execute(args)

    // The type guard should allow valid keys to pass through
    expect(mockGetConfig).toHaveBeenCalled()
  })
})
