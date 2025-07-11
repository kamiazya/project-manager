import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, getConfig, loadConfig, resetConfig, validateConfig } from './config.js'

describe('Config Management', () => {
  const testConfigPath = join(process.cwd(), '.pmrc.json')

  beforeEach(() => {
    // Reset environment variables
    delete process.env.PM_DEFAULT_PRIORITY
    delete process.env.PM_DEFAULT_TYPE
    delete process.env.PM_CONFIRM_DELETION
    delete process.env.PM_MAX_TITLE_LENGTH

    // Remove test config file if it exists
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath)
    }

    // Reset cached config
    resetConfig()
  })

  afterEach(() => {
    // Clean up test config file
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath)
    }
    resetConfig()
  })

  describe('loadConfig', () => {
    it('should return default configuration when no overrides exist', () => {
      const config = loadConfig()
      expect(config).toEqual(DEFAULT_CONFIG)
    })

    it('should load configuration from environment variables', () => {
      process.env.PM_DEFAULT_PRIORITY = 'high'
      process.env.PM_DEFAULT_TYPE = 'bug'
      process.env.PM_CONFIRM_DELETION = 'false'
      process.env.PM_MAX_TITLE_LENGTH = '100'

      const config = loadConfig()

      expect(config.defaultPriority).toBe('high')
      expect(config.defaultType).toBe('bug')
      expect(config.confirmDeletion).toBe(false)
      expect(config.maxTitleLength).toBe(100)
    })

    it('should handle invalid environment variable values gracefully', () => {
      process.env.PM_DEFAULT_PRIORITY = 'invalid'
      process.env.PM_MAX_TITLE_LENGTH = 'not-a-number'

      const config = loadConfig()

      // Should fallback to default for invalid values
      expect(config.defaultPriority).toBe('invalid') // Environment takes precedence
      expect(config.maxTitleLength).toBe(DEFAULT_CONFIG.maxTitleLength) // Invalid number ignored
    })
  })

  describe('getConfig', () => {
    it('should return cached configuration on subsequent calls', () => {
      const config1 = getConfig()
      const config2 = getConfig()
      expect(config1).toBe(config2) // Same object reference
    })

    it('should reflect environment changes after reset', () => {
      const config1 = getConfig()
      expect(config1.defaultPriority).toBe('medium')

      process.env.PM_DEFAULT_PRIORITY = 'high'
      resetConfig()

      const config2 = getConfig()
      expect(config2.defaultPriority).toBe('high')
    })
  })

  describe('validateConfig', () => {
    it('should return no errors for valid configuration', () => {
      const config = {
        defaultPriority: 'high' as const,
        defaultType: 'feature' as const,
        maxTitleLength: 50,
      }

      const errors = validateConfig(config)
      expect(errors).toHaveLength(0)
    })

    it('should return errors for invalid priority', () => {
      const config = {
        defaultPriority: 'invalid' as any,
      }

      const errors = validateConfig(config)
      expect(errors).toContain('Invalid defaultPriority: invalid')
    })

    it('should return errors for invalid type', () => {
      const config = {
        defaultType: 'invalid' as any,
      }

      const errors = validateConfig(config)
      expect(errors).toContain('Invalid defaultType: invalid')
    })

    it('should return errors for invalid privacy', () => {
      const config = {
        defaultPrivacy: 'invalid' as any,
      }

      const errors = validateConfig(config)
      expect(errors).toContain('Invalid defaultPrivacy: invalid')
    })

    it('should return errors for invalid status', () => {
      const config = {
        defaultStatus: 'invalid' as any,
      }

      const errors = validateConfig(config)
      expect(errors).toContain('Invalid defaultStatus: invalid')
    })

    it('should return errors for invalid output format', () => {
      const config = {
        defaultOutputFormat: 'invalid' as any,
      }

      const errors = validateConfig(config)
      expect(errors).toContain('Invalid defaultOutputFormat: invalid')
    })

    it('should return errors for invalid date format', () => {
      const config = {
        dateFormat: 'invalid' as any,
      }

      const errors = validateConfig(config)
      expect(errors).toContain('Invalid dateFormat: invalid')
    })

    it('should return errors for invalid max title length', () => {
      const config = {
        maxTitleLength: 0,
      }

      const errors = validateConfig(config)
      expect(errors).toContain('Invalid maxTitleLength: 0 (must be between 1 and 200)')
    })

    it('should return multiple errors for multiple invalid values', () => {
      const config = {
        defaultPriority: 'invalid' as any,
        defaultType: 'invalid' as any,
        maxTitleLength: 300,
      }

      const errors = validateConfig(config)
      expect(errors).toHaveLength(3)
    })
  })
})
