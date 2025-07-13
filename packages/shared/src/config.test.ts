import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDefaultStorageDir, getDefaultStoragePath, getStoragePath } from './config.js'

describe('Shared Storage Path Functions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment to clean state
    process.env = { ...originalEnv }
    delete process.env.NODE_ENV
    delete process.env.PM_STORAGE_PATH
    delete process.env.XDG_CONFIG_HOME
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getDefaultStorageDir', () => {
    it('should return project-manager directory in production', () => {
      const dir = getDefaultStorageDir()
      expect(dir).toContain('project-manager')
      expect(dir).not.toContain('project-manager-dev')
    })

    it('should return project-manager-dev directory in development', () => {
      process.env.NODE_ENV = 'development'
      const dir = getDefaultStorageDir()
      expect(dir).toContain('project-manager-dev')
    })

    it('should respect XDG_CONFIG_HOME when set', () => {
      process.env.XDG_CONFIG_HOME = '/custom/config'
      const dir = getDefaultStorageDir()
      expect(dir).toMatch(/^\/custom\/config\/project-manager$/)
    })
  })

  describe('getDefaultStoragePath', () => {
    it('should return path ending with tickets.json', () => {
      const path = getDefaultStoragePath()
      expect(path).toMatch(/tickets\.json$/)
    })

    it('should use development directory when NODE_ENV=development', () => {
      process.env.NODE_ENV = 'development'
      const path = getDefaultStoragePath()
      expect(path).toContain('project-manager-dev')
      expect(path).toMatch(/tickets\.json$/)
    })
  })

  describe('getStoragePath', () => {
    it('should return PM_STORAGE_PATH when set', () => {
      const customPath = '/custom/tickets.json'
      process.env.PM_STORAGE_PATH = customPath
      const path = getStoragePath()
      expect(path).toBe(customPath)
    })

    it('should return default path when PM_STORAGE_PATH not set', () => {
      const path = getStoragePath()
      const defaultPath = getDefaultStoragePath()
      expect(path).toBe(defaultPath)
    })

    it('should handle empty PM_STORAGE_PATH', () => {
      process.env.PM_STORAGE_PATH = ''
      const path = getStoragePath()
      const defaultPath = getDefaultStoragePath()
      expect(path).toBe(defaultPath)
    })

    it('should handle whitespace-only PM_STORAGE_PATH', () => {
      process.env.PM_STORAGE_PATH = '   '
      const path = getStoragePath()
      const defaultPath = getDefaultStoragePath()
      expect(path).toBe(defaultPath)
    })

    it('should prioritize PM_STORAGE_PATH over NODE_ENV', () => {
      const customPath = '/custom/tickets.json'
      process.env.PM_STORAGE_PATH = customPath
      process.env.NODE_ENV = 'development'

      const path = getStoragePath()
      expect(path).toBe(customPath)
    })
  })

  describe('consistency across environments', () => {
    it('should maintain consistent behavior regardless of NODE_ENV when PM_STORAGE_PATH is set', () => {
      const customPath = '/custom/tickets.json'
      process.env.PM_STORAGE_PATH = customPath

      // Test in production
      process.env.NODE_ENV = 'production'
      const prodPath = getStoragePath()

      // Test in development
      process.env.NODE_ENV = 'development'
      const devPath = getStoragePath()

      expect(prodPath).toBe(customPath)
      expect(devPath).toBe(customPath)
      expect(prodPath).toBe(devPath)
    })

    it('should have different paths for development vs production when using defaults', () => {
      // Production path
      delete process.env.NODE_ENV
      const prodPath = getStoragePath()

      // Development path
      process.env.NODE_ENV = 'development'
      const devPath = getStoragePath()

      expect(prodPath).toContain('project-manager')
      expect(devPath).toContain('project-manager-dev')
      expect(prodPath).not.toBe(devPath)
    })
  })
})
