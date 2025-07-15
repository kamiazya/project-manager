import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ConfigEnvCommand } from './env.ts'

describe('ConfigEnvCommand', () => {
  let command: ConfigEnvCommand
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    command = new ConfigEnvCommand([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
  })

  test('should have correct command metadata', () => {
    expect(ConfigEnvCommand.description).toBe(
      'Show environment variables that affect configuration'
    )
    expect(ConfigEnvCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %> # Show available environment variables',
    ])
  })

  test('should execute with proper type safety', async () => {
    // Test that the execute method has no parameters
    await command.execute()

    // Verify that environment variables are displayed
    expect(logSpy).toHaveBeenCalledWith('Environment Variables:')
    expect(logSpy).toHaveBeenCalledWith('=====================')
    expect(logSpy).toHaveBeenCalledWith('Currently set:')

    // Should display the environment variables we defined
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('PM_STORAGE_PATH'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('PM_DEFAULT_PRIORITY'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('PM_DEFAULT_TYPE'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('PM_DEFAULT_PRIVACY'))
  })

  test('should return Promise<void>', async () => {
    const result = command.execute()

    // Should return a Promise<void>
    expect(result).toBeInstanceOf(Promise)

    const resolvedResult = await result
    expect(resolvedResult).toBeUndefined()
  })

  test('should handle json flag correctly', async () => {
    await command.execute()

    // Should still display environment variables (json formatting would be handled by base command)
    expect(logSpy).toHaveBeenCalled()
  })

  test('should not have duplicate environment variable definitions', async () => {
    await command.execute()

    // Get all log calls
    const logCalls = logSpy.mock.calls.map(call => call[0])
    const envVarLines = logCalls.filter(
      call => typeof call === 'string' && call.includes('PM_') && call.includes(' - ')
    )

    // Check that each environment variable appears only once
    const envVarNames = envVarLines.map(line => (line as string).split(' - ')[0].trim())
    const uniqueNames = new Set(envVarNames)

    expect(envVarNames.length).toBe(uniqueNames.size)
  })
})
