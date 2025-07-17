/**
 * Tests for SDK index exports
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createProjectManagerSDK } from './index.ts'

describe('SDK Index', () => {
  beforeEach(async () => {
    const { SDKContainer } = await import('./sdk-container.ts')
    SDKContainer.reset()
  })

  it('should export createProjectManagerSDK factory function', () => {
    expect(typeof createProjectManagerSDK).toBe('function')
  })

  it('should create SDK instance using factory function', async () => {
    const sdk = await createProjectManagerSDK({
      environment: 'test',
      storagePath: './test-data',
    })

    expect(sdk).toBeDefined()
    expect(sdk.tickets).toBeDefined()
    expect(sdk.configuration).toBeDefined()
    expect(sdk.repository).toBeDefined()
  })

  it('should create SDK with default configuration', async () => {
    const sdk = await createProjectManagerSDK()

    expect(sdk).toBeDefined()
    expect(sdk.tickets).toBeDefined()
  })
})
