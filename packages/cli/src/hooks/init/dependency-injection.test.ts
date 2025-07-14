import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

describe('dependency injection hook', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  test('should execute init hook', async () => {
    process.env.NODE_ENV = 'development'

    // Import the hook
    const hookModule = await import('./dependency-injection.ts')
    const hook = hookModule.default

    // Mock context object
    const mockContext = {
      debug: vi.fn(),
    }

    // Execute the hook
    await hook.call(mockContext as any, {} as any)

    expect(mockContext.debug).toHaveBeenCalledWith('Init hook executed')
  })

  test('should not log in production mode', async () => {
    process.env.NODE_ENV = 'production'

    const hookModule = await import('./dependency-injection.ts')
    const hook = hookModule.default

    const mockContext = {
      debug: vi.fn(),
    }

    await hook.call(mockContext as any, {} as any)

    expect(mockContext.debug).not.toHaveBeenCalled()
  })

  test('should handle missing NODE_ENV', async () => {
    delete process.env.NODE_ENV

    const hookModule = await import('./dependency-injection.ts')
    const hook = hookModule.default

    const mockContext = {
      debug: vi.fn(),
    }

    await hook.call(mockContext as any, {} as any)

    expect(mockContext.debug).not.toHaveBeenCalled()
  })
})
