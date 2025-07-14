import { existsSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import pluginSupportHook, { getExtensionPoints, getPluginRegistry } from './plugin-support.ts'

// Mock Node.js fs functions
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

describe('pluginSupportHook', () => {
  let mockContext: any

  beforeEach(() => {
    mockContext = {
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Reset global registries
    ;(globalThis as any).projectManagerPlugins = undefined
    ;(globalThis as any).projectManagerExtensions = undefined

    // Reset mocks
    vi.clearAllMocks()
  })

  it('should initialize plugin and extension registries', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(false)

    // Act
    await pluginSupportHook.call(mockContext)

    // Assert
    expect((globalThis as any).projectManagerPlugins).toBeInstanceOf(Map)
    expect((globalThis as any).projectManagerExtensions).toBeInstanceOf(Map)
    expect(mockContext.debug).toHaveBeenCalledWith('Plugin architecture initialized')
  })

  it('should register built-in extension points', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(false)

    // Act
    await pluginSupportHook.call(mockContext)

    // Assert
    const extensions = getExtensionPoints()
    expect(extensions.has('command:before')).toBe(true)
    expect(extensions.has('command:after')).toBe(true)
    expect(extensions.has('ticket:created')).toBe(true)
    expect(extensions.has('ticket:updated')).toBe(true)
    expect(extensions.has('ticket:deleted')).toBe(true)
  })

  it('should discover plugins from configuration file', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        plugins: [
          { name: 'test-plugin', enabled: true },
          { name: 'disabled-plugin', enabled: false },
          'simple-plugin',
        ],
      })
    )

    // Act
    await pluginSupportHook.call(mockContext)

    // Assert
    expect(mockContext.debug).toHaveBeenCalledWith('Found 3 plugins in configuration')
    expect(mockContext.debug).toHaveBeenCalledWith('Plugin available: test-plugin')
    expect(mockContext.debug).toHaveBeenCalledWith('Plugin available: simple-plugin')
    // disabled-plugin should not be logged as available
    expect(mockContext.debug).not.toHaveBeenCalledWith('Plugin available: disabled-plugin')
  })

  it('should handle missing plugin configuration file gracefully', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(false)

    // Act
    await pluginSupportHook.call(mockContext)

    // Assert
    expect(mockContext.warn).not.toHaveBeenCalled()
  })

  it('should handle invalid plugin configuration', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('invalid json')

    // Act
    await pluginSupportHook.call(mockContext)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load plugin configuration')
    )
  })

  it('should handle plugin configuration without plugins array', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        someOtherConfig: 'value',
      })
    )

    // Act
    await pluginSupportHook.call(mockContext)

    // Assert
    expect(mockContext.warn).not.toHaveBeenCalled()
    expect(mockContext.debug).toHaveBeenCalledWith('Plugin architecture initialized')
  })

  it('should handle hook initialization errors gracefully', async () => {
    // Arrange
    vi.mocked(existsSync).mockImplementation(() => {
      throw new Error('File system error')
    })

    // Act
    await pluginSupportHook.call(mockContext)

    // Assert
    expect(mockContext.warn).toHaveBeenCalledWith('Plugin initialization failed: File system error')
  })

  it('should provide utility functions for accessing registries', () => {
    // Arrange & Act
    const pluginRegistry = getPluginRegistry()
    const extensionPoints = getExtensionPoints()

    // Assert
    expect(pluginRegistry).toBeInstanceOf(Map)
    expect(extensionPoints).toBeInstanceOf(Map)
  })
})
