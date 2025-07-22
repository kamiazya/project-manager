/**
 * Tests for SDK index exports
 */

import { LoggingContextServiceImpl } from '@project-manager/application'
import { beforeEach, describe, expect, it } from 'vitest'
import { createProjectManagerSDK } from './index.ts'

describe('SDK Index', () => {
  beforeEach(() => {
    LoggingContextServiceImpl.reset()
  })

  it('should export createProjectManagerSDK factory function', () => {
    expect(typeof createProjectManagerSDK).toBe('function')
  })

  it('should create SDK instance using factory function', async () => {
    const sdk = await createProjectManagerSDK({
      environment: 'testing',
    })

    expect(sdk).toBeDefined()
    expect(sdk.tickets).toBeDefined()
    expect(typeof sdk.tickets.create).toBe('function')
    expect(typeof sdk.tickets.getById).toBe('function')
  })

  it('should create SDK with default configuration', async () => {
    const sdk = await createProjectManagerSDK()

    expect(sdk).toBeDefined()
    expect(sdk.tickets).toBeDefined()
  })
})
