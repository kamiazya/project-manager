/**
 * Tests for SDK index exports
 */

import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createProjectManagerSDK } from './index.ts'

describe('SDK Index', () => {
  let tempDir: string

  beforeEach(async () => {
    const { SDKContainer } = await import('./sdk-container.ts')
    SDKContainer.reset()

    // Create temporary directory for test data
    tempDir = await mkdtemp(join(tmpdir(), 'pm-sdk-test-'))
  })

  afterEach(async () => {
    // Clean up temporary directory
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('should export createProjectManagerSDK factory function', () => {
    expect(typeof createProjectManagerSDK).toBe('function')
  })

  it('should create SDK instance using factory function', async () => {
    const sdk = await createProjectManagerSDK({
      environment: 'test',
      storagePath: join(tempDir, 'tickets.json'),
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
