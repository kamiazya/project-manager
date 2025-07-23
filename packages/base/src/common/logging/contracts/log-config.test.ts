import { describe, expect, it } from 'vitest'
import { type EnvironmentMode } from '../../environment/environment-mode.ts'
import { type LogLevel, LogLevelValues } from '../types/log-level.ts'
import {
  type LogConfig,
  LogConfigPresets,
  LogConfigUtils,
  type TransportType,
} from './log-config.ts'

describe('LogConfig', () => {
  describe('LogLevelValues', () => {
    it('should define correct log level hierarchy', () => {
      expect(LogLevelValues.debug).toBe(0)
      expect(LogLevelValues.info).toBe(1)
      expect(LogLevelValues.warn).toBe(2)
      expect(LogLevelValues.error).toBe(3)
      expect(LogLevelValues.fatal).toBe(4)

      // Verify hierarchy
      expect(LogLevelValues.debug).toBeLessThan(LogLevelValues.info)
      expect(LogLevelValues.info).toBeLessThan(LogLevelValues.warn)
      expect(LogLevelValues.warn).toBeLessThan(LogLevelValues.error)
      expect(LogLevelValues.error).toBeLessThan(LogLevelValues.fatal)
    })
  })

  describe('LogConfigUtils.shouldLog', () => {
    it('should allow logging when current level is equal to configured level', () => {
      expect(LogConfigUtils.shouldLog('info', 'info')).toBe(true)
      expect(LogConfigUtils.shouldLog('debug', 'debug')).toBe(true)
      expect(LogConfigUtils.shouldLog('error', 'error')).toBe(true)
    })

    it('should allow logging when current level is higher than configured level', () => {
      expect(LogConfigUtils.shouldLog('error', 'info')).toBe(true)
      expect(LogConfigUtils.shouldLog('fatal', 'debug')).toBe(true)
      expect(LogConfigUtils.shouldLog('warn', 'info')).toBe(true)
    })

    it('should prevent logging when current level is lower than configured level', () => {
      expect(LogConfigUtils.shouldLog('debug', 'info')).toBe(false)
      expect(LogConfigUtils.shouldLog('info', 'warn')).toBe(false)
      expect(LogConfigUtils.shouldLog('warn', 'error')).toBe(false)
    })

    it('should handle all log level combinations correctly', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']

      levels.forEach((currentLevel, currentIndex) => {
        levels.forEach((configuredLevel, configuredIndex) => {
          const shouldLog = LogConfigUtils.shouldLog(currentLevel, configuredLevel)
          const expected = currentIndex >= configuredIndex
          expect(shouldLog).toBe(expected)
        })
      })
    })
  })

  describe('LogConfigUtils.mergeConfigs', () => {
    it('should return default config when no configs provided', () => {
      const result = LogConfigUtils.mergeConfigs()
      expect(result).toEqual({
        level: 'info',
        environment: 'production',
        transportType: 'console',
      })
    })

    it('should merge single config with defaults', () => {
      const config: Partial<LogConfig> = {
        level: 'debug',
      }

      const result = LogConfigUtils.mergeConfigs(config)
      expect(result.level).toBe('debug')
      expect(result.environment).toBe('production') // Default
      expect(result.transportType).toBe('console') // Default
      expect(result.logFile).toBeUndefined()
    })

    it('should merge multiple configs with later configs overriding earlier ones', () => {
      const config1: Partial<LogConfig> = {
        level: 'debug',
        environment: 'development',
        transportType: 'file',
      }

      const config2: Partial<LogConfig> = {
        level: 'info',
        transportType: 'console',
        colorize: true,
      }

      const result = LogConfigUtils.mergeConfigs(config1, config2)
      expect(result.level).toBe('info') // From config2
      expect(result.environment).toBe('development') // From config1
      expect(result.transportType).toBe('console') // From config2
      expect(result.colorize).toBe(true) // From config2
    })

    it('should handle maxEntries merging', () => {
      const config1: Partial<LogConfig> = {
        maxEntries: 500,
      }

      const config2: Partial<LogConfig> = {
        maxEntries: 1000,
      }

      const result = LogConfigUtils.mergeConfigs(config1, config2)
      expect(result.maxEntries).toBe(1000) // From config2 (overrides config1)
    })

    it('should handle undefined and null values correctly', () => {
      const config1: Partial<LogConfig> = {
        level: 'debug',
        transportType: 'file',
        colorize: true,
      }

      const config2: Partial<LogConfig> = {
        transportType: 'console',
        // colorize undefined - should not override
      }

      const result = LogConfigUtils.mergeConfigs(config1, config2)
      expect(result.level).toBe('debug')
      expect(result.transportType).toBe('console') // Overridden
      expect(result.colorize).toBe(true) // Preserved from config1
    })
  })

  describe('LogConfigUtils.validateConfig', () => {
    it('should return empty array for valid config', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        logFile: '/var/log/app.log',
        transportType: 'file',
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toEqual([])
    })

    it('should validate log level', () => {
      const config: LogConfig = {
        level: 'invalid' as LogLevel,
        environment: 'production',
        transportType: 'console',
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Invalid log level: invalid')
    })

    it('should validate environment', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'invalid' as EnvironmentMode,
        transportType: 'console',
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Invalid environment: invalid')
    })

    it('should validate transport type', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        transportType: 'invalid' as TransportType,
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Invalid transport type: invalid')
    })

    it('should require log file path for file transport', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        transportType: 'file',
        // logFile is missing
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Log file path required for file transport')
    })

    it('should reject empty log file path', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        logFile: '',
        transportType: 'file',
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Log file path cannot be empty')
    })

    it('should reject whitespace-only log file path', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        logFile: '   \t\n  ',
        transportType: 'file',
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Log file path cannot be empty')
    })

    it('should reject empty audit file path', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        auditFile: '',
        transportType: 'console',
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Audit file path cannot be empty')
    })

    it('should return multiple errors for multiple issues', () => {
      const config: LogConfig = {
        level: 'invalid' as LogLevel,
        environment: 'invalid' as EnvironmentMode,
        transportType: 'invalid' as TransportType,
        logFile: '',
        auditFile: '   ',
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors.length).toBeGreaterThanOrEqual(5)
      expect(errors).toContain('Invalid log level: invalid')
      expect(errors).toContain('Invalid environment: invalid')
      expect(errors).toContain('Invalid transport type: invalid')
      expect(errors).toContain('Log file path cannot be empty')
      expect(errors).toContain('Audit file path cannot be empty')
    })
  })

  describe('LogConfigPresets', () => {
    it('should provide valid development preset', () => {
      const config = LogConfigPresets.development
      const errors = LogConfigUtils.validateConfig(config)

      expect(errors).toEqual([])
      expect(config.level).toBe('debug')
      expect(config.environment).toBe('development')
      expect(config.transportType).toBe('console')
      expect(config.colorize).toBe(true)
    })

    it('should provide valid test preset', () => {
      const config = LogConfigPresets.test
      const errors = LogConfigUtils.validateConfig(config)

      expect(errors).toEqual([])
      expect(config.level).toBe('warn')
      expect(config.environment).toBe('testing')
      expect(config.transportType).toBe('memory')
      expect(config.maxEntries).toBe(1000)
    })

    it('should provide valid production preset', () => {
      const config = LogConfigPresets.production
      const errors = LogConfigUtils.validateConfig(config)

      expect(errors).toEqual([])
      expect(config.level).toBe('info')
      expect(config.environment).toBe('production')
      expect(config.transportType).toBe('file')
      expect(config.logFile).toBeDefined()
      expect(config.auditFile).toBeDefined()
    })

    it('should allow merging presets with custom config', () => {
      const customConfig: Partial<LogConfig> = {
        level: 'error',
        transportType: 'console',
      }

      const merged = LogConfigUtils.mergeConfigs(LogConfigPresets.production, customConfig)

      expect(merged.level).toBe('error') // Overridden
      expect(merged.environment).toBe('production') // From preset
      expect(merged.transportType).toBe('console') // Overridden
      expect(merged.logFile).toBe('~/.local/share/project-manager/logs/app.log') // From preset
    })
  })

  describe('Boundary Value Tests', () => {
    describe('File paths', () => {
      it('should handle very long file paths', () => {
        // Create a path that's close to common OS limits
        // Using 200 chars to stay within limits but test long paths
        const longPath = `/very/long/path/${'a'.repeat(150)}/log.log`

        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          logFile: longPath,
          transportType: 'file',
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toEqual([])
        expect(config.logFile).toBe(longPath)
      })

      it('should handle paths with special characters', () => {
        const specialPaths = [
          '/path/with spaces/log.log',
          '/path/with-dashes/log.log',
          '/path/with_underscores/log.log',
          '/path/with.dots/log.log',
          '/path/with@symbols/log.log',
        ]

        specialPaths.forEach(path => {
          const config: LogConfig = {
            level: 'info',
            environment: 'production',
            logFile: path,
            transportType: 'file',
          }

          const errors = LogConfigUtils.validateConfig(config)
          expect(errors).toEqual([])
        })
      })
    })

    describe('Memory transport limits', () => {
      it('should handle memory transport with max entries', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'development',
          transportType: 'memory',
          maxEntries: 10000,
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toEqual([])
      })

      it('should handle memory transport without max entries', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'development',
          transportType: 'memory',
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toEqual([])
      })
    })
  })

  describe('Type Safety', () => {
    it('should enforce correct log level types', () => {
      const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']

      validLevels.forEach(level => {
        const config: LogConfig = {
          level,
          environment: 'production',
          transportType: 'console',
        }

        expect(config.level).toBe(level)
      })
    })

    it('should enforce correct environment types', () => {
      const validEnvironments: EnvironmentMode[] = [
        'development',
        'testing',
        'production',
        'in-memory',
        'isolated',
      ]

      validEnvironments.forEach(env => {
        const config: LogConfig = {
          level: 'info',
          environment: env,
          transportType: 'console',
        }

        expect(config.environment).toBe(env)
      })
    })

    it('should enforce correct transport types', () => {
      const validTransports: TransportType[] = ['console', 'file', 'memory']

      validTransports.forEach(type => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          transportType: type,
        }

        expect(config.transportType).toBe(type)
      })
    })
  })
})
