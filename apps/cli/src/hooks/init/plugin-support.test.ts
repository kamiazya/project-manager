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
    await pluginSupportHook.call(mockContext, {
      argv: [],
      id: undefined,
      config: {} as any,
      context: {} as any,
    })

    // Assert
    expect((globalThis as any).projectManagerPlugins).toBeInstanceOf(Map)
    expect((globalThis as any).projectManagerExtensions).toBeInstanceOf(Map)
    expect(mockContext.debug).toHaveBeenCalledWith('Plugin architecture initialized')
  })

  it('should register built-in extension points', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(false)

    // Act
    await pluginSupportHook.call(mockContext, {
      argv: [],
      id: undefined,
      config: {} as any,
      context: {} as any,
    })

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
    await pluginSupportHook.call(mockContext, {
      argv: [],
      id: undefined,
      config: {} as any,
      context: {} as any,
    })

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
    await pluginSupportHook.call(mockContext, {
      argv: [],
      id: undefined,
      config: {} as any,
      context: {} as any,
    })

    // Assert
    expect(mockContext.warn).not.toHaveBeenCalled()
  })

  it('should handle invalid plugin configuration', async () => {
    // Arrange
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('invalid json')

    // Act
    await pluginSupportHook.call(mockContext, {
      argv: [],
      id: undefined,
      config: {} as any,
      context: {} as any,
    })

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
    await pluginSupportHook.call(mockContext, {
      argv: [],
      id: undefined,
      config: {} as any,
      context: {} as any,
    })

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
    await pluginSupportHook.call(mockContext, {
      argv: [],
      id: undefined,
      config: {} as any,
      context: {} as any,
    })

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

  it('should initialize plugin registry when getPluginRegistry is called without hook execution', async () => {
    // Arrange - clear global registry
    delete (globalThis as any).projectManagerPlugins

    // Import utility function
    const { getPluginRegistry } = await import('./plugin-support.ts')

    // Act
    const registry = getPluginRegistry()

    // Assert
    expect(registry).toBeInstanceOf(Map)
    expect(registry.size).toBe(0)
    expect(globalThis.projectManagerPlugins).toBe(registry)
  })

  it('should initialize extension points when getExtensionPoints is called without hook execution', async () => {
    // Arrange - clear global registry
    delete (globalThis as any).projectManagerExtensions

    // Import utility function
    const { getExtensionPoints } = await import('./plugin-support.ts')

    // Act
    const extensions = getExtensionPoints()

    // Assert
    expect(extensions).toBeInstanceOf(Map)
    expect(extensions.size).toBe(0)
    expect(globalThis.projectManagerExtensions).toBe(extensions)
  })

  it('should return existing plugin registry when already initialized', async () => {
    // Arrange - manually initialize with test data
    const testMap = new Map()
    testMap.set('test-plugin', { name: 'test' })
    ;(globalThis as any).projectManagerPlugins = testMap

    // Import utility function
    const { getPluginRegistry } = await import('./plugin-support.ts')

    // Act
    const registry = getPluginRegistry()

    // Assert
    expect(registry).toBe(testMap)
    expect(registry.has('test-plugin')).toBe(true)
  })

  it('should return existing extension points when already initialized', async () => {
    // Arrange - manually initialize with test data
    const testMap = new Map()
    testMap.set('test:event', ['handler1', 'handler2'])
    ;(globalThis as any).projectManagerExtensions = testMap

    // Import utility function
    const { getExtensionPoints } = await import('./plugin-support.ts')

    // Act
    const extensions = getExtensionPoints()

    // Assert
    expect(extensions).toBe(testMap)
    expect(extensions.has('test:event')).toBe(true)
    expect(extensions.get('test:event')).toEqual(['handler1', 'handler2'])
  })
})
