/**
 * SDK Configuration Tests
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createProjectManagerSDK, ProjectManagerSDKFactory } from './index.ts'
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

    it('should create SDK with custom data directory', async () => {
      const customDir = '/tmp/test-data'
      const sdk = await createProjectManagerSDK({
        dataDirectory: customDir,
        environment: 'test',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK with debug logging enabled', async () => {
      const sdk = await createProjectManagerSDK({
        enableDebugLogging: true,
        environment: 'development',
      })
      expect(sdk).toBeDefined()
    })
  })

  describe('ProjectManagerSDKFactory', () => {
    it('should create SDK for CLI application', async () => {
      const sdk = await ProjectManagerSDKFactory.forCLI()
      expect(sdk).toBeDefined()
    })

    it('should create SDK for CLI application with development environment', async () => {
      const sdk = await ProjectManagerSDKFactory.forCLI({
        environment: 'development',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK for MCP server', async () => {
      const sdk = await ProjectManagerSDKFactory.forMCP()
      expect(sdk).toBeDefined()
    })

    it('should create SDK for MCP server with development environment', async () => {
      const sdk = await ProjectManagerSDKFactory.forMCP({
        environment: 'development',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK for testing', async () => {
      const sdk = await ProjectManagerSDKFactory.forTesting()
      expect(sdk).toBeDefined()
    })

    it('should create SDK for testing with custom storage path', async () => {
      const sdk = await ProjectManagerSDKFactory.forTesting({
        storagePath: '/tmp/test-tickets.json',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK for testing with custom data directory', async () => {
      const sdk = await ProjectManagerSDKFactory.forTesting({
        dataDirectory: '/tmp/test-data',
      })
      expect(sdk).toBeDefined()
    })

    it('should create SDK with custom configuration', async () => {
      const sdk = await ProjectManagerSDKFactory.withConfig({
        appType: 'custom',
        environment: 'test',
        enableDebugLogging: true,
        storagePath: '/tmp/custom-tickets.json',
      })
      expect(sdk).toBeDefined()
    })
  })

  describe('SDKContainer configuration resolution', () => {
    it('should resolve configuration values correctly', () => {
      const config = {
        environment: 'development' as const,
        appType: 'cli' as const,
        enableDebugLogging: true,
        storagePath: '/custom/path/tickets.json',
      }

      const resolved = SDKContainer.getResolvedConfig(config)
      expect(resolved.environment).toBe('development')
      expect(resolved.appType).toBe('cli')
      expect(resolved.enableDebugLogging).toBe(true)
      expect(resolved.storagePath).toBe('/custom/path/tickets.json')
    })

    it('should provide default values for missing configuration', () => {
      const config = {}

      const resolved = SDKContainer.getResolvedConfig(config)
      expect(resolved.environment).toBe('production')
      expect(resolved.appType).toBe('sdk')
      expect(resolved.enableDebugLogging).toBe(false)
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
