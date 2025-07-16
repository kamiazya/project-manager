import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

describe('cleanup hook', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  test('should execute postrun hook with command info', async () => {
    process.env.NODE_ENV = 'development'

    const hookModule = await import('./cleanup.ts')
    const hook = hookModule.default

    const mockContext = {
      debug: vi.fn(),
    }

    const mockOpts = {
      Command: {
        id: 'test-command',
      },
    }

    await hook.call(mockContext as any, mockOpts as any)

    expect(mockContext.debug).toHaveBeenCalledWith('Command test-command completed successfully')
  })

  test('should not log in production mode', async () => {
    process.env.NODE_ENV = 'production'

    const hookModule = await import('./cleanup.ts')
    const hook = hookModule.default

    const mockContext = {
      debug: vi.fn(),
    }

    const mockOpts = {
      Command: {
        id: 'test-command',
      },
    }

    await hook.call(mockContext as any, mockOpts as any)

    expect(mockContext.debug).not.toHaveBeenCalled()
  })

  test('should handle missing NODE_ENV', async () => {
    delete process.env.NODE_ENV

    const hookModule = await import('./cleanup.ts')
    const hook = hookModule.default

    const mockContext = {
      debug: vi.fn(),
    }

    const mockOpts = {
      Command: {
        id: 'test-command',
      },
    }

    await hook.call(mockContext as any, mockOpts as any)

    expect(mockContext.debug).not.toHaveBeenCalled()
  })

  test('should handle missing command id', async () => {
    process.env.NODE_ENV = 'development'

    const hookModule = await import('./cleanup.ts')
    const hook = hookModule.default

    const mockContext = {
      debug: vi.fn(),
    }

    const mockOpts = {
      Command: {},
    }

    await hook.call(mockContext as any, mockOpts as any)

    expect(mockContext.debug).toHaveBeenCalledWith('Command unknown completed successfully')
  })
})
