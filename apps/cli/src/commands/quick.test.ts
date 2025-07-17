import { beforeEach, describe, expect, test, vi } from 'vitest'
import { QuickCommand } from './quick.ts'

describe('QuickCommand', () => {
  let command: QuickCommand
  let mockConfig: any

  beforeEach(() => {
    mockConfig = {
      runCommand: vi.fn(),
    }
    command = new QuickCommand([], mockConfig)
  })

  test('should have correct command metadata', () => {
    expect(QuickCommand.description).toBe('Quick operations for common tasks')
    expect(QuickCommand.aliases).toEqual(['q'])
    expect(QuickCommand.examples).toEqual([
      '<%= config.bin %> <%= command.id %> # Show available quick operations',
      '<%= config.bin %> <%= command.id %>:new "Fix bug" # Quickly create a ticket',
      '<%= config.bin %> <%= command.id %>:start abc123 # Start working on a ticket',
      '<%= config.bin %> <%= command.id %>:done abc123 # Mark ticket as completed',
      '<%= config.bin %> <%= command.id %>:todo # List pending tickets',
      '<%= config.bin %> <%= command.id %>:wip # List work-in-progress tickets',
    ])
  })

  test('should execute with proper type safety', async () => {
    // Test that the execute method accepts ExecuteArgs and ExecuteFlags
    const args = {} // No args expected
    const flags = { json: false } // Should accept json flag

    await command.execute(args, flags)

    // Should run help command for quick
    expect(mockConfig.runCommand).toHaveBeenCalledWith('help', ['quick'])
  })

  test('should return Promise<void>', async () => {
    const args = {}
    const flags = { json: false }

    const result = command.execute(args, flags)

    // Should return a Promise<void>
    expect(result).toBeInstanceOf(Promise)

    const resolvedResult = await result
    expect(resolvedResult).toBeUndefined()
  })

  test('should handle json flag correctly', async () => {
    const args = {}
    const flags = { json: true }

    await command.execute(args, flags)

    // Should still run help command (json formatting would be handled by base command)
    expect(mockConfig.runCommand).toHaveBeenCalledWith('help', ['quick'])
  })

  test('should handle empty args correctly', async () => {
    const args = {}
    const flags = { json: false }

    await command.execute(args, flags)

    // Should run help command showing available quick operations
    expect(mockConfig.runCommand).toHaveBeenCalledWith('help', ['quick'])
  })

  test('should use proper interface types', async () => {
    // Test that ExecuteArgs interface works (empty object)
    const args = {}

    // Test that ExecuteFlags interface works with json flag
    const flags = { json: false }

    await command.execute(args, flags)

    expect(mockConfig.runCommand).toHaveBeenCalledWith('help', ['quick'])
  })

  test('should handle config.runCommand errors', async () => {
    const args = {}
    const flags = { json: false }

    mockConfig.runCommand.mockRejectedValue(new Error('Help command error'))

    try {
      await command.execute(args, flags)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Help command error')
    }
  })

  test('should have proper return type Promise<void>', async () => {
    const args = {}
    const flags = { json: false }

    const result = await command.execute(args, flags)

    // Should return void (undefined)
    expect(result).toBeUndefined()
  })
})
