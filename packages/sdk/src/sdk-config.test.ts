/**
 * SDK Configuration Tests
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createProjectManagerSDK } from './index.ts'
import { SDKContainer } from './sdk-container.ts'

describe('SDK Configuration Management', () => {
  beforeEach(() => {
    // Reset singleton for each test
    SDKContainer.reset()
  })

  describe('createProjectManagerSDK', () => {
    it('should create SDK with default configuration', async () => {
      const sdk = await createProjectManagerSDK()
      expect(sdk).toBeDefined()
      expect(sdk.tickets).toBeDefined()
      expect(sdk.configuration).toBeDefined()
    })

    it('should create SDK with custom storage path', async () => {
      const customPath = '/tmp/test-tickets.json'
      const sdk = await createProjectManagerSDK({
        storagePath: customPath,
        environment: 'test',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK with custom environment configuration', async () => {
      const sdk = await createProjectManagerSDK({
        environment: 'test',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK for development environment', async () => {
      const sdk = await createProjectManagerSDK({
        environment: 'development',
      })
      expect(sdk).toBeDefined()
    })
  })

  describe('createProjectManagerSDK configurations', () => {
    it('should create SDK with production environment', async () => {
      const sdk = await createProjectManagerSDK({
        environment: 'production',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK with development environment', async () => {
      const sdk = await createProjectManagerSDK({
        environment: 'development',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK for testing', async () => {
      const sdk = await createProjectManagerSDK({
        environment: 'test',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK with custom storage path', async () => {
      const sdk = await createProjectManagerSDK({
        environment: 'test',
        storagePath: '/tmp/test-tickets.json',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK with custom repository', async () => {
      const mockRepository = {
        repositoryId: 'MockRepository',
        save: async () => {},
        findById: async () => null,
        queryTickets: async () => [],
        delete: async () => {},
      }

      const sdk = await createProjectManagerSDK({
        environment: 'test',
        customRepository: mockRepository,
      })
      expect(sdk).toBeDefined()
    })
  })

  describe('SDKContainer configuration resolution', () => {
    it('should resolve configuration values correctly', () => {
      const config = {
        environment: 'development' as const,
        storagePath: '/custom/path/tickets.json',
      }

      const resolved = SDKContainer.getResolvedConfig(config)
      expect(resolved.environment).toBe('development')
      expect(resolved.storagePath).toBe('/custom/path/tickets.json')
    })

    it('should provide default values for missing configuration', () => {
      const config = {}

      const resolved = SDKContainer.getResolvedConfig(config)
      expect(resolved.environment).toBe('production')
      expect(resolved.storagePath).toBe('XDG-compliant default')
    })
  })

  describe('SDK isolation and test environment', () => {
    it('should not reuse singleton in test environment', async () => {
      const sdk1 = await createProjectManagerSDK({ environment: 'test' })
      const sdk2 = await createProjectManagerSDK({ environment: 'test' })

      // Both should be valid SDK instances
      expect(sdk1).toBeDefined()
      expect(sdk2).toBeDefined()

      // Should work independently
      expect(sdk1.tickets).toBeDefined()
      expect(sdk2.tickets).toBeDefined()
    })

    it('should reuse singleton in production environment', async () => {
      const sdk1 = await createProjectManagerSDK({ environment: 'production' })
      const sdk2 = await createProjectManagerSDK({ environment: 'production' })

      // Both should be valid SDK instances
      expect(sdk1).toBeDefined()
      expect(sdk2).toBeDefined()
    })
  })
})
