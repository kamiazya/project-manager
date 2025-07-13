import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDefaultStoragePath, getStoragePath } from './config.js'

describe('config', () => {
  let tempDir: string
  let originalEnv: typeof process.env

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDir = await mkdtemp(join(tmpdir(), 'pm-config-test-'))

    // Save original environment
    originalEnv = { ...process.env }
  })

  afterEach(async () => {
    // Restore environment
    process.env = originalEnv

    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('getDefaultStoragePath', () => {
    it('should return path in XDG_CONFIG_HOME when set', () => {
      const configHome = join(tempDir, '.config')
      process.env.XDG_CONFIG_HOME = configHome

      const path = getDefaultStoragePath()

      expect(path).toBe(join(configHome, 'project-manager', 'tickets.json'))
    })

    it('should return path in home/.config when XDG_CONFIG_HOME not set', () => {
      delete process.env.XDG_CONFIG_HOME

      const path = getDefaultStoragePath()

      // Should use os.homedir() directly
      expect(path).toContain('.config')
      expect(path).toContain('project-manager')
      expect(path).toContain('tickets.json')
      expect(path).toMatch(/\/.+\.config\/project-manager\/tickets\.json$/)
    })

    it('should use project-manager-dev directory when NODE_ENV=development', () => {
      const configHome = join(tempDir, '.config')
      process.env.XDG_CONFIG_HOME = configHome
      process.env.NODE_ENV = 'development'

      const path = getDefaultStoragePath()

      expect(path).toBe(join(configHome, 'project-manager-dev', 'tickets.json'))
      expect(path).toContain('project-manager-dev')
      expect(path).not.toMatch(/\/project-manager\//)
    })

    it('should use regular project-manager directory when NODE_ENV is not development', () => {
      const configHome = join(tempDir, '.config')
      process.env.XDG_CONFIG_HOME = configHome
      process.env.NODE_ENV = 'production'

      const path = getDefaultStoragePath()

      expect(path).toBe(join(configHome, 'project-manager', 'tickets.json'))
      expect(path).not.toContain('project-manager-dev')
    })

    it('should use regular project-manager directory when NODE_ENV is not set', () => {
      const configHome = join(tempDir, '.config')
      process.env.XDG_CONFIG_HOME = configHome
      delete process.env.NODE_ENV

      const path = getDefaultStoragePath()

      expect(path).toBe(join(configHome, 'project-manager', 'tickets.json'))
      expect(path).not.toContain('project-manager-dev')
    })
  })

  describe('getStoragePath', () => {
    it('should return PM_STORAGE_PATH when set', () => {
      const customPath = join(tempDir, 'custom-tickets.json')
      process.env.PM_STORAGE_PATH = customPath

      const path = getStoragePath()

      expect(path).toBe(customPath)
    })

    it('should return default path when PM_STORAGE_PATH not set', () => {
      delete process.env.PM_STORAGE_PATH
      process.env.XDG_CONFIG_HOME = join(tempDir, '.config')

      const path = getStoragePath()

      expect(path).toBe(join(tempDir, '.config', 'project-manager', 'tickets.json'))
    })

    it('should handle empty PM_STORAGE_PATH', () => {
      process.env.PM_STORAGE_PATH = ''
      process.env.XDG_CONFIG_HOME = join(tempDir, '.config')

      const path = getStoragePath()

      expect(path).toBe(join(tempDir, '.config', 'project-manager', 'tickets.json'))
    })

    it('should handle whitespace-only PM_STORAGE_PATH', () => {
      process.env.PM_STORAGE_PATH = '   \n\t  '
      process.env.XDG_CONFIG_HOME = join(tempDir, '.config')

      const path = getStoragePath()

      expect(path).toBe(join(tempDir, '.config', 'project-manager', 'tickets.json'))
    })

    it('should use project-manager-dev when NODE_ENV=development and PM_STORAGE_PATH not set', () => {
      delete process.env.PM_STORAGE_PATH
      process.env.XDG_CONFIG_HOME = join(tempDir, '.config')
      process.env.NODE_ENV = 'development'

      const path = getStoragePath()

      expect(path).toBe(join(tempDir, '.config', 'project-manager-dev', 'tickets.json'))
      expect(path).toContain('project-manager-dev')
    })

    it('should ignore NODE_ENV when PM_STORAGE_PATH is set', () => {
      const customPath = join(tempDir, 'custom-tickets.json')
      process.env.PM_STORAGE_PATH = customPath
      process.env.NODE_ENV = 'development'

      const path = getStoragePath()

      expect(path).toBe(customPath)
      expect(path).not.toContain('project-manager-dev')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle missing environment variables gracefully', () => {
      delete process.env.XDG_CONFIG_HOME
      delete process.env.HOME
      delete process.env.PM_STORAGE_PATH

      // Should not throw and return a valid path using os.homedir()
      expect(() => getDefaultStoragePath()).not.toThrow()
      expect(() => getStoragePath()).not.toThrow()

      const path = getStoragePath()
      expect(path).toContain('project-manager')
      expect(path).toContain('tickets.json')
      // Should use os.homedir() as fallback
      expect(path).toMatch(/^\//)
    })

    it('should handle special characters in paths', () => {
      const specialPath = join(tempDir, 'path with spaces & special chars @#$%', 'tickets.json')
      process.env.PM_STORAGE_PATH = specialPath

      const path = getStoragePath()

      expect(path).toBe(specialPath)
    })

    it('should handle relative paths in PM_STORAGE_PATH', () => {
      process.env.PM_STORAGE_PATH = './relative/path/tickets.json'

      const path = getStoragePath()

      expect(path).toBe('./relative/path/tickets.json')
    })

    it('should handle absolute paths with different file extensions', () => {
      const customPath = join(tempDir, 'data.db')
      process.env.PM_STORAGE_PATH = customPath

      const path = getStoragePath()

      expect(path).toBe(customPath)
    })

    it('should handle very long paths', () => {
      const longPath = join(tempDir, 'a'.repeat(100), 'b'.repeat(100), 'tickets.json')
      process.env.PM_STORAGE_PATH = longPath

      const path = getStoragePath()

      expect(path).toBe(longPath)
    })

    it('should handle unicode characters in paths', () => {
      const unicodePath = join(tempDir, '中文目录', 'émojis🚀', 'tickets.json')
      process.env.PM_STORAGE_PATH = unicodePath

      const path = getStoragePath()

      expect(path).toBe(unicodePath)
    })

    it('should handle XDG_CONFIG_HOME with special characters', () => {
      const configHome = join(tempDir, 'config with spaces & émojis 🚀')
      process.env.XDG_CONFIG_HOME = configHome
      delete process.env.PM_STORAGE_PATH

      const path = getDefaultStoragePath()

      expect(path).toBe(join(configHome, 'project-manager', 'tickets.json'))
    })

    it('should handle multiple slashes in paths', () => {
      process.env.PM_STORAGE_PATH = join(tempDir, '//multiple//slashes//tickets.json')

      const path = getStoragePath()

      expect(path).toBe(join(tempDir, '//multiple//slashes//tickets.json'))
    })

    it('should handle null and undefined environment variables gracefully', () => {
      // Explicitly set to undefined (which deletes the property)
      delete process.env.XDG_CONFIG_HOME
      delete process.env.HOME
      delete process.env.PM_STORAGE_PATH

      expect(() => getDefaultStoragePath()).not.toThrow()
      expect(() => getStoragePath()).not.toThrow()
    })

    it('should prioritize PM_STORAGE_PATH over all other configurations', () => {
      const customPath = join(tempDir, 'custom.json')
      const configHome = join(tempDir, '.config')

      process.env.PM_STORAGE_PATH = customPath
      process.env.XDG_CONFIG_HOME = configHome
      process.env.HOME = tempDir

      const path = getStoragePath()

      expect(path).toBe(customPath)
      expect(path).not.toContain('.config')
    })
  })
})
