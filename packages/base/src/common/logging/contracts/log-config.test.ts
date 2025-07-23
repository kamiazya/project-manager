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
        transport: {
          type: 'console',
        },
      })
    })

    it('should merge single config with defaults', () => {
      const config: Partial<LogConfig> = {
        level: 'debug',
      }

      const result = LogConfigUtils.mergeConfigs(config)
      expect(result.level).toBe('debug')
      expect(result.environment).toBe('production') // Default
      expect(result.transport.type).toBe('console') // Default
      // logFile is not handled by mergeConfigs - it only handles nested objects
      expect(result.logFile).toBeUndefined()
    })

    it('should merge multiple configs with later configs overriding earlier ones', () => {
      const config1: Partial<LogConfig> = {
        level: 'debug',
        environment: 'development',
        transport: {
          type: 'file',
        },
      }

      const config2: Partial<LogConfig> = {
        level: 'info',
        transport: {
          type: 'console',
          colorize: true,
        },
      }

      const result = LogConfigUtils.mergeConfigs(config1, config2)
      expect(result.level).toBe('info') // From config2
      expect(result.environment).toBe('development') // From config1
      expect(result.transport.type).toBe('console') // From config2
      expect(result.transport.colorize).toBe(true) // From config2
    })

    it('should deep merge nested properties', () => {
      const config1: Partial<LogConfig> = {
        rotation: {
          maxSize: '50MB',
          maxFiles: 5,
        },
      }

      const config2: Partial<LogConfig> = {
        rotation: {
          maxSize: '100MB', // Required property
          maxFiles: 10,
          interval: 'daily',
        },
      }

      const result = LogConfigUtils.mergeConfigs(config1, config2)
      expect(result.rotation).toEqual({
        maxSize: '100MB', // From config2 (overrides config1)
        maxFiles: 10, // From config2
        interval: 'daily', // From config2
      })
    })

    it('should handle undefined and null values correctly', () => {
      const config1: Partial<LogConfig> = {
        level: 'debug',
        transport: {
          type: 'file',
          colorize: true,
        },
      }

      const config2: Partial<LogConfig> = {
        transport: {
          type: 'console',
          // colorize undefined - should not override
        },
      }

      const result = LogConfigUtils.mergeConfigs(config1, config2)
      expect(result.level).toBe('debug')
      expect(result.transport.type).toBe('console') // Overridden
      expect(result.transport.colorize).toBe(true) // Preserved from config1
    })
  })

  describe('LogConfigUtils.validateConfig', () => {
    it('should return empty array for valid config', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        logFile: '/var/log/app.log',
        transport: {
          type: 'file',
        },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toEqual([])
    })

    it('should validate log level', () => {
      const config: LogConfig = {
        level: 'invalid' as LogLevel,
        environment: 'production',
        transport: { type: 'console' },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Invalid log level: invalid')
    })

    it('should validate environment', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'invalid' as EnvironmentMode,
        transport: { type: 'console' },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Invalid environment: invalid')
    })

    it('should validate transport type', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        transport: { type: 'invalid' as TransportType },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Invalid transport type: invalid')
    })

    it('should require log file path for file transport', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        transport: { type: 'file' },
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
        transport: { type: 'file' },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Log file path cannot be empty')
    })

    it('should reject whitespace-only log file path', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        logFile: '   \t\n  ',
        transport: { type: 'file' },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Log file path cannot be empty')
    })

    it('should reject empty audit file path', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        auditFile: '',
        transport: { type: 'console' },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Audit file path cannot be empty')
    })

    it('should validate rotation configuration', () => {
      const config: LogConfig = {
        level: 'info',
        environment: 'production',
        transport: { type: 'file' },
        logFile: '/var/log/app.log',
        rotation: {
          maxSize: 'invalid',
          maxFiles: 0,
        },
      }

      const errors = LogConfigUtils.validateConfig(config)
      expect(errors).toContain('Maximum files must be at least 1')
      expect(errors).toContain('Invalid max size format (use format like "100MB")')
    })

    it('should accept valid rotation sizes', () => {
      const validSizes = ['1KB', '100MB', '10GB', '5TB']

      validSizes.forEach(size => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          transport: { type: 'file' },
          logFile: '/var/log/app.log',
          rotation: {
            maxSize: size,
            maxFiles: 10,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        const sizeErrors = errors.filter(e => e.includes('max size format'))
        expect(sizeErrors).toHaveLength(0)
      })
    })

    it('should validate sampling configuration', () => {
      const invalidRates = [-0.1, 1.1, 2.0]

      invalidRates.forEach(rate => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          transport: { type: 'console' },
          sampling: {
            enabled: true,
            rate,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toContain('Sampling rate must be between 0.0 and 1.0')
      })
    })

    it('should accept valid sampling rates', () => {
      const validRates = [0.0, 0.1, 0.5, 0.99, 1.0]

      validRates.forEach(rate => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          transport: { type: 'console' },
          sampling: {
            enabled: true,
            rate,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        const rateErrors = errors.filter(e => e.includes('Sampling rate'))
        expect(rateErrors).toHaveLength(0)
      })
    })

    it('should return multiple errors for multiple issues', () => {
      const config: LogConfig = {
        level: 'invalid' as LogLevel,
        environment: 'invalid' as EnvironmentMode,
        transport: { type: 'invalid' as TransportType },
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
      expect(config.transport.type).toBe('console')
      expect(config.transport.colorize).toBe(true)
    })

    it('should provide valid test preset', () => {
      const config = LogConfigPresets.test
      const errors = LogConfigUtils.validateConfig(config)

      expect(errors).toEqual([])
      expect(config.level).toBe('warn')
      expect(config.environment).toBe('testing')
      expect(config.transport.type).toBe('memory')
      expect(config.transport.maxEntries).toBe(1000)
    })

    it('should provide valid production preset', () => {
      const config = LogConfigPresets.production
      const errors = LogConfigUtils.validateConfig(config)

      expect(errors).toEqual([])
      expect(config.level).toBe('info')
      expect(config.environment).toBe('production')
      expect(config.transport.type).toBe('file')
      expect(config.logFile).toBeDefined()
      expect(config.auditFile).toBeDefined()
      expect(config.rotation).toBeDefined()
      expect(config.rotation?.maxSize).toBe('100MB')
      expect(config.rotation?.maxFiles).toBe(10)
      expect(config.rotation?.interval).toBe('daily')
    })

    it('should allow merging presets with custom config', () => {
      const customConfig: Partial<LogConfig> = {
        level: 'error',
        transport: {
          type: 'console',
        },
      }

      const merged = LogConfigUtils.mergeConfigs(LogConfigPresets.production, customConfig)

      expect(merged.level).toBe('error') // Overridden
      expect(merged.environment).toBe('production') // From preset
      expect(merged.transport.type).toBe('console') // Overridden
      // Note: mergeConfigs doesn't handle logFile - it only handles nested objects
      expect(merged.logFile).toBeUndefined()
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
          transport: { type: 'file' },
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
            transport: { type: 'file' },
          }

          const errors = LogConfigUtils.validateConfig(config)
          expect(errors).toEqual([])
        })
      })
    })

    describe('Rotation values', () => {
      it('should handle minimum rotation values', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          logFile: '/var/log/app.log',
          transport: { type: 'file' },
          rotation: {
            maxSize: '1KB',
            maxFiles: 1,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toEqual([])
      })

      it('should handle maximum rotation values', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          logFile: '/var/log/app.log',
          transport: { type: 'file' },
          rotation: {
            maxSize: '999TB',
            maxFiles: 999999,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toEqual([])
      })

      it('should reject zero max files', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          logFile: '/var/log/app.log',
          transport: { type: 'file' },
          rotation: {
            maxSize: '100MB',
            maxFiles: 0,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toContain('Maximum files must be at least 1')
      })

      it('should reject negative max files', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'production',
          logFile: '/var/log/app.log',
          transport: { type: 'file' },
          rotation: {
            maxSize: '100MB',
            maxFiles: -1,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toContain('Maximum files must be at least 1')
      })
    })

    describe('Memory transport limits', () => {
      it('should handle memory transport with max entries', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'development', // Use 'development' which is valid
          transport: {
            type: 'memory',
            maxEntries: 10000,
          },
        }

        const errors = LogConfigUtils.validateConfig(config)
        expect(errors).toEqual([])
      })

      it('should handle memory transport without max entries', () => {
        const config: LogConfig = {
          level: 'info',
          environment: 'development', // Use 'development' which is valid
          transport: {
            type: 'memory',
          },
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
          transport: { type: 'console' },
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
          transport: { type: 'console' },
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
          transport: { type },
        }

        expect(config.transport.type).toBe(type)
      })
    })
  })
})
