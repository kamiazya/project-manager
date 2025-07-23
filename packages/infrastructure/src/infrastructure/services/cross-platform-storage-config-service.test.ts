/**
 * TDD Test for CrossPlatformStorageConfigService
 *
 * Tests cross-platform directory path resolution using env-paths library.
 * Following t-wada TDD methodology: Red → Green → Refactor
 */

import type { StorageConfigService } from '@project-manager/application'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CrossPlatformStorageConfigService } from './cross-platform-storage-config-service.ts'

// Environment variable constants (matching implementation)
const ENV_VARS = {
  STORAGE_PATH: 'PM_STORAGE_PATH',
} as const

describe('CrossPlatformStorageConfigService', () => {
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
    // Clean up test environment variables
    delete process.env[ENV_VARS.STORAGE_PATH]
  })

  describe('environment-specific app naming', () => {
    it('should use project-manager-dev for development environment', () => {
      process.env.NODE_ENV = 'development'
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // Should contain development app name
      expect(storageDir).toContain('project-manager-dev')
      expect(storageDir).not.toContain('nodejs')
      expect(logsPath).toContain('project-manager-dev')
      expect(logsPath).not.toContain('nodejs')
      expect(logsPath).toMatch(/logs$/)
    })

    it('should use project-manager for production environment', () => {
      process.env.NODE_ENV = 'production'
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // Should contain base app name without suffix
      expect(storageDir).toContain('project-manager')
      expect(storageDir).not.toContain('dev')
      expect(storageDir).not.toContain('nodejs')
      expect(logsPath).toContain('project-manager')
      expect(logsPath).not.toContain('dev')
      expect(logsPath).not.toContain('nodejs')
      expect(logsPath).toMatch(/logs$/)
    })

    it('should use project-manager-test for test environment', () => {
      process.env.NODE_ENV = 'test'
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // Should contain test app name
      expect(storageDir).toContain('project-manager-test')
      expect(storageDir).not.toContain('nodejs')
      expect(logsPath).toContain('project-manager-test')
      expect(logsPath).not.toContain('nodejs')
      expect(logsPath).toMatch(/logs$/)
    })

    it('should default to project-manager-dev when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // Should default to development
      expect(storageDir).toContain('project-manager-dev')
      expect(logsPath).toContain('project-manager-dev')
      expect(logsPath).toMatch(/logs$/)
    })

    it('should handle custom environment names', () => {
      process.env.NODE_ENV = 'staging'
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // Should use custom environment name as suffix
      expect(storageDir).toContain('project-manager-staging')
      expect(logsPath).toContain('project-manager-staging')
      expect(logsPath).toMatch(/logs$/)
    })
  })

  describe('platform-specific paths (integration test)', () => {
    it('should use env-paths for platform-appropriate directories', () => {
      process.env.NODE_ENV = 'development'
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // env-paths should provide valid absolute paths
      expect(storageDir).toMatch(/^\//) // Should be absolute path on Unix systems
      expect(logsPath).toMatch(/^\//) // Should be absolute path on Unix systems

      // Should contain our app name with dev suffix
      expect(storageDir).toContain('project-manager-dev')
      expect(logsPath).toContain('project-manager-dev')
    })

    it('should follow platform conventions for current platform', () => {
      process.env.NODE_ENV = 'development'
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // On current platform (Linux in CodeSpace), should use XDG-style paths
      if (process.platform === 'linux') {
        expect(storageDir).toContain('.config')
        expect(logsPath).toContain('.local/state')
      }

      // Paths should be valid and absolute
      expect(storageDir).toMatch(/^\//)
      expect(logsPath).toMatch(/^\//)
    })
  })

  describe('environment variables integration', () => {
    it('should handle custom storage path via environment variable', () => {
      process.env.NODE_ENV = 'development'
      const service = new CrossPlatformStorageConfigService()

      const customPath = '/custom/storage/tickets.json'
      process.env[ENV_VARS.STORAGE_PATH] = customPath

      const resolvedPath = service.resolveStoragePath()
      expect(resolvedPath).toBe(customPath)
    })

    it('should respect env-paths behavior for platform directories', () => {
      process.env.NODE_ENV = 'development'
      const service = new CrossPlatformStorageConfigService()

      const storageDir = service.getDefaultStorageDir()
      const logsPath = service.getLogsPath()

      // Should be using the directories provided by env-paths
      expect(storageDir).toBeDefined()
      expect(logsPath).toBeDefined()
      expect(storageDir).toContain('project-manager-dev')
      expect(logsPath).toContain('project-manager-dev')
    })
  })

  describe('StorageConfigService interface compliance', () => {
    it('should implement getDefaultStoragePath method', () => {
      process.env.NODE_ENV = 'development'
      const service: StorageConfigService = new CrossPlatformStorageConfigService()

      const storagePath = service.getDefaultStoragePath()
      expect(storagePath).toBeDefined()
      expect(storagePath).toMatch(/tickets\.json$/)
      expect(storagePath).toContain('project-manager-dev')
    })

    it('should implement resolveStoragePath method', () => {
      process.env.NODE_ENV = 'development'
      const service: StorageConfigService = new CrossPlatformStorageConfigService()

      const customPath = '/path/to/custom.json'
      const resolvedPath = service.resolveStoragePath(customPath)

      expect(resolvedPath).toBe(customPath)
    })

    it('should fall back to default path when custom path is empty', () => {
      process.env.NODE_ENV = 'development'
      const service: StorageConfigService = new CrossPlatformStorageConfigService()

      const defaultPath = service.getDefaultStoragePath()
      const resolvedPath = service.resolveStoragePath('')

      expect(resolvedPath).toBe(defaultPath)
    })

    it('should provide consistent behavior across instances', () => {
      process.env.NODE_ENV = 'development'

      // Create two instances to verify consistent behavior
      const service1 = new CrossPlatformStorageConfigService()
      const service2 = new CrossPlatformStorageConfigService()

      expect(service1.getDefaultStorageDir()).toBe(service2.getDefaultStorageDir())
      expect(service1.getLogsPath()).toBe(service2.getLogsPath())
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle missing environment variables gracefully', () => {
      // Clear all environment variables
      delete process.env.NODE_ENV
      delete process.env[ENV_VARS.STORAGE_PATH]

      const service = new CrossPlatformStorageConfigService()

      // Should not throw errors
      expect(() => service.getDefaultStorageDir()).not.toThrow()
      expect(() => service.getLogsPath()).not.toThrow()
      expect(() => service.getDefaultStoragePath()).not.toThrow()
      expect(() => service.resolveStoragePath()).not.toThrow()
    })

    it('should create consistent paths across multiple calls', () => {
      process.env.NODE_ENV = 'development'
      const service = new CrossPlatformStorageConfigService()

      // Multiple calls should return the same paths
      const storageDir1 = service.getDefaultStorageDir()
      const storageDir2 = service.getDefaultStorageDir()
      const logsPath1 = service.getLogsPath()
      const logsPath2 = service.getLogsPath()

      expect(storageDir1).toBe(storageDir2)
      expect(logsPath1).toBe(logsPath2)
    })

    it('should handle whitespace in custom paths', () => {
      process.env.NODE_ENV = 'development'
      const service = new CrossPlatformStorageConfigService()

      const pathWithWhitespace = '  /path/with/whitespace  '
      const resolved = service.resolveStoragePath(pathWithWhitespace)

      // Should trim whitespace
      expect(resolved).toBe('/path/with/whitespace')
    })
  })
})
