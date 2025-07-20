/**
 * Debug test to investigate repositoryId property issue
 */

import { describe, expect, it } from 'vitest'

describe('JsonTicketRepository repositoryId debugging', () => {
  it('should investigate repositoryId property access', async () => {
    // Import required modules
    const infrastructureModule = await import('./packages/infrastructure/src/index.ts')

    // Create instance
    const storagePath = '/tmp/debug-test.json'
    const repository = new infrastructureModule.JsonTicketRepository(storagePath)

    // Debug output
    console.log('=== Repository Debug Information ===')
    console.log('repository:', repository)
    console.log('repository.constructor.name:', repository.constructor.name)
    console.log('repository.repositoryId:', repository.repositoryId)
    console.log('typeof repository.repositoryId:', typeof repository.repositoryId)
    console.log('repository.repositoryId === undefined:', repository.repositoryId === undefined)
    console.log('repository.repositoryId === null:', repository.repositoryId === null)
    console.log('"repositoryId" in repository:', 'repositoryId' in repository)
    console.log(
      'Object.hasOwn(repository, "repositoryId"):',
      Object.hasOwn(repository, 'repositoryId')
    )
    console.log(
      'Object.getOwnPropertyDescriptor(repository, "repositoryId"):',
      Object.getOwnPropertyDescriptor(repository, 'repositoryId')
    )
    console.log(
      'Object.getOwnPropertyDescriptor(repository.constructor.prototype, "repositoryId"):',
      Object.getOwnPropertyDescriptor(repository.constructor.prototype, 'repositoryId')
    )
    console.log('Object.keys(repository):', Object.keys(repository))
    console.log('Object.getOwnPropertyNames(repository):', Object.getOwnPropertyNames(repository))
    console.log('=== End Debug Information ===')

    // This should pass if the getter is working
    expect(repository.repositoryId).toBe('JsonTicketRepository')
  })
})
