/**
 * Tests for Configuration Factory
 */

import { describe, expect, it } from 'vitest'
import { ConfigurationFactory, ConfigurationUtils } from './configuration-factory.ts'

describe('Configuration Factory', () => {
  describe('ConfigurationFactory', () => {
    it('should create complete configuration with defaults', () => {
      const config = ConfigurationFactory.createConfiguration()

      expect(config.app).toBeDefined()
      expect(config.ticket).toBeDefined()
      expect(config.ui).toBeDefined()
      expect(config.storage).toBeDefined()

      expect(config.app.environment).toBe('development')
      expect(config.ticket.defaultPriority).toBe('medium')
      expect(config.ui.outputFormat).toBe('table')
      expect(config.storage.xdgCompliant).toBe(true)
    })

    it('should create configuration with context overrides', () => {
      const context = {
        environment: 'production',
        projectType: 'design',
        teamSize: 'large',
        userRole: 'manager',
      }

      const config = ConfigurationFactory.createConfiguration(context)

      expect(config.app.environment).toBe('production')
      expect(config.ticket.defaultType).toBe('task') // Design project type
      expect(config.ticket.allowMultipleAssignees).toBe(true) // Large team
      expect(config.ui.outputFormat).toBe('table') // Manager role
    })

    it('should merge user input with defaults', () => {
      const userInput = {
        app: {
          name: 'Custom Project',
          enableDebugMode: true,
        },
        ticket: {
          defaultPriority: 'high' as const,
          maxTitleLength: 150,
        },
        ui: {
          outputFormat: 'json' as const,
          enableColorOutput: false,
        },
        storage: {
          backupEnabled: false,
          compressionEnabled: true,
        },
      }

      const config = ConfigurationFactory.createConfiguration({}, userInput)

      expect(config.app.name).toBe('Custom Project')
      expect(config.app.enableDebugMode).toBe(true)
      expect(config.ticket.defaultPriority).toBe('high')
      expect(config.ticket.maxTitleLength).toBe(150)
      expect(config.ui.outputFormat).toBe('json')
      expect(config.ui.enableColorOutput).toBe(false)
      expect(config.storage.backupEnabled).toBe(false)
      expect(config.storage.compressionEnabled).toBe(true)
    })

    it('should apply CI overrides', () => {
      const context = {
        isCI: true,
        isInteractive: false,
      }

      const config = ConfigurationFactory.createConfiguration(context)

      expect(config.ui.enableInteractiveMode).toBe(false)
      expect(config.ui.enableSoundNotifications).toBe(false)
      expect(config.ui.enableDesktopNotifications).toBe(false)
      expect(config.ui.outputFormat).toBe('plain')
      expect(config.ui.enableColorOutput).toBe(false)
    })

    it('should create development configuration', () => {
      const config = ConfigurationFactory.createDevelopmentConfiguration()

      expect(config.app.environment).toBe('development')
      expect(config.app.enableDebugMode).toBe(true)
      expect(config.storage.backupEnabled).toBe(false)
    })

    it('should create production configuration', () => {
      const config = ConfigurationFactory.createProductionConfiguration()

      expect(config.app.environment).toBe('production')
      expect(config.app.enableDebugMode).toBe(false)
      expect(config.storage.backupEnabled).toBe(true)
      expect(config.storage.syncToDisk).toBe(true)
    })

    it('should create test configuration', () => {
      const config = ConfigurationFactory.createTestConfiguration()

      expect(config.app.environment).toBe('test')
      expect(config.app.enableTelemetry).toBe(false)
      expect(config.storage.backupEnabled).toBe(false)
      expect(config.ui.enableInteractiveMode).toBe(false)
    })

    it('should create CI configuration', () => {
      const config = ConfigurationFactory.createCIConfiguration()

      expect(config.app.environment).toBe('test')
      expect(config.ui.enableInteractiveMode).toBe(false)
      expect(config.ui.outputFormat).toBe('plain')
      expect(config.ui.enableColorOutput).toBe(false)
    })

    it('should create detected configuration', () => {
      const config = ConfigurationFactory.createDetectedConfiguration()

      expect(config.app.environment).toBeDefined()
      expect(config.ui.enableInteractiveMode).toBeDefined()
      expect(config.storage.xdgCompliant).toBeDefined()
    })

    it('should get use case configurations', () => {
      const soloDevConfig = ConfigurationFactory.getUseCase('solo-developer')
      const teamLeadConfig = ConfigurationFactory.getUseCase('team-lead')
      const designTeamConfig = ConfigurationFactory.getUseCase('design-team')

      expect(soloDevConfig.ticket.requireAssigneeForProgress).toBe(false)
      expect(teamLeadConfig.ticket.requireAssigneeForProgress).toBe(true)
      expect(designTeamConfig.ticket.defaultType).toBe('task')
    })

    it('should throw error for unknown use case', () => {
      expect(() => {
        ConfigurationFactory.getUseCase('unknown-use-case')
      }).toThrow('Unknown use case: unknown-use-case')
    })

    it('should validate configuration', () => {
      const validConfig = ConfigurationFactory.createConfiguration()
      const errors = ConfigurationFactory.validateConfiguration(validConfig)

      expect(errors).toHaveLength(0)
    })

    it('should detect configuration validation errors', () => {
      const config = ConfigurationFactory.createConfiguration()

      // Introduce invalid values using type assertion to bypass readonly
      ;(config.app as any).environment = 'production'
      ;(config.app as any).enableDebugMode = true
      ;(config.ticket as any).maxTitleLength = 5
      ;(config.ui as any).itemsPerPage = -1
      ;(config.storage as any).backupCount = 0

      const errors = ConfigurationFactory.validateConfiguration(config)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain('Debug mode should not be enabled in production')
      expect(errors).toContain('Title length must be at least 10 characters')
      expect(errors).toContain('Items per page must be between 1 and 1000')
      expect(errors).toContain('Backup count must be between 1 and 100')
    })

    it('should apply consistency rules', () => {
      const userInput = {
        app: {
          enableDebugMode: true,
        },
      }

      const config = ConfigurationFactory.createConfiguration({}, userInput)

      // Debug mode should enable verbose logging
      expect(config.app.enableVerboseLogging).toBe(true)
    })

    it('should apply test environment consistency rules', () => {
      const config = ConfigurationFactory.createTestConfiguration()

      expect(config.app.enableTelemetry).toBe(false)
      expect(config.app.enableCrashReporting).toBe(false)
      expect(config.app.enableUpdateCheck).toBe(false)
      expect(config.storage.backupEnabled).toBe(false)
      expect(config.storage.autoCleanupEnabled).toBe(false)
    })
  })

  describe('ConfigurationUtils', () => {
    it('should merge configurations', () => {
      const base = ConfigurationFactory.createConfiguration()
      const override = {
        app: {
          name: 'Overridden Name',
          enableDebugMode: true,
        },
        ui: {
          outputFormat: 'json' as const,
        },
      }

      const merged = ConfigurationUtils.mergeConfigurations(base, override)

      expect(merged.app.name).toBe('Overridden Name')
      expect(merged.app.enableDebugMode).toBe(true)
      expect(merged.ui.outputFormat).toBe('json')
      expect(merged.ticket.defaultPriority).toBe(base.ticket.defaultPriority)
    })

    it('should convert configuration to environment variables', () => {
      const config = ConfigurationFactory.createConfiguration()
      const envVars = ConfigurationUtils.toEnvironmentVariables(config)

      expect(envVars.PM_APP_NAME).toBe('Project Manager')
      expect(envVars.PM_APP_ENVIRONMENT).toBe('development')
      expect(envVars.PM_TICKET_DEFAULTPRIORITY).toBe('medium')
      expect(envVars.PM_UI_OUTPUTFORMAT).toBe('table')
      expect(envVars.PM_STORAGE_XDGCOMPLIANT).toBe('true')
    })

    it('should generate configuration summary', () => {
      const config = ConfigurationFactory.createConfiguration()
      const summary = ConfigurationUtils.getSummary(config)

      expect(summary).toContain('Configuration Summary:')
      expect(summary).toContain('Environment: development')
      expect(summary).toContain('Project Type: task')
      expect(summary).toContain('UI Theme: default')
      expect(summary).toContain('Storage: XDG Compliant')
    })
  })
})
