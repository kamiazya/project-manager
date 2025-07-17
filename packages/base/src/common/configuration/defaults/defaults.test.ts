/**
 * Tests for Configuration Defaults
 */

import { describe, expect, it } from 'vitest'
import { AppConfigDefaults } from './app-defaults.ts'
import { StorageConfigDefaults } from './storage-defaults.ts'
import { TicketConfigDefaults } from './ticket-defaults.ts'
import { UIConfigDefaults } from './ui-defaults.ts'

describe('Configuration Defaults', () => {
  describe('AppConfigDefaults', () => {
    it('should provide base defaults', () => {
      const defaults = AppConfigDefaults.getDefaults()

      expect(defaults.version).toBe('0.0.0')
      expect(defaults.environment).toBe('development')
      expect(defaults.debug).toBe(false)
      expect(defaults.telemetryEnabled).toBe(false)
      expect(defaults.extensions).toEqual({})
    })

    it('should provide environment-specific defaults', () => {
      const devDefaults = AppConfigDefaults.getEnvironmentDefaults('development')
      const prodDefaults = AppConfigDefaults.getEnvironmentDefaults('production')

      expect(devDefaults.debug).toBe(true)
      expect(devDefaults.telemetryEnabled).toBe(false)

      expect(prodDefaults.debug).toBe(false)
      expect(prodDefaults.telemetryEnabled).toBe(true)
    })

    it('should merge user config with defaults', () => {
      const userConfig = {
        version: '1.0.0',
        debug: true,
        extensions: { custom: 'value' },
      }

      const merged = AppConfigDefaults.mergeWithDefaults(userConfig)

      expect(merged.version).toBe('1.0.0')
      expect(merged.debug).toBe(true)
      expect(merged.extensions.custom).toBe('value')
      expect(merged.environment).toBe('development') // Should preserve defaults
    })

    it('should get feature flag defaults', () => {
      const flags = AppConfigDefaults.getFeatureFlagDefaults()

      expect(flags.debug).toBe(false)
      expect(flags.telemetryEnabled).toBe(false)
      expect(flags.autoUpdateEnabled).toBe(true)
    })
  })

  describe('TicketConfigDefaults', () => {
    it('should provide base defaults', () => {
      const defaults = TicketConfigDefaults.getDefaults()

      expect(defaults.defaultPriority).toBe('medium')
      expect(defaults.defaultType).toBe('task')
      expect(defaults.defaultStatus).toBe('pending')
      expect(defaults.maxTitleLength).toBe(200)
      expect(defaults.enableComments).toBe(true)
    })

    it('should provide project type-specific defaults', () => {
      const softwareDefaults = TicketConfigDefaults.getProjectTypeDefaults('software')
      const designDefaults = TicketConfigDefaults.getProjectTypeDefaults('design')

      expect(softwareDefaults.defaultType).toBe('task')
      expect(softwareDefaults.requireAssigneeForProgress).toBe(false) // Solo team size overrides to false

      expect(designDefaults.defaultType).toBe('task')
      expect(designDefaults.enableAttachments).toBe(true)
    })

    it('should provide team size-specific defaults', () => {
      const soloDefaults = TicketConfigDefaults.getTeamSizeDefaults('solo')
      const largeDefaults = TicketConfigDefaults.getTeamSizeDefaults('large')

      expect(soloDefaults.requireAssigneeForProgress).toBe(false)
      expect(soloDefaults.allowMultipleAssignees).toBe(false)

      expect(largeDefaults.requireAssigneeForProgress).toBe(true)
      expect(largeDefaults.allowMultipleAssignees).toBe(true)
    })

    it('should merge user config with defaults', () => {
      const userConfig = {
        defaultPriority: 'high' as const,
        maxTitleLength: 150,
        enableComments: false,
      }

      const merged = TicketConfigDefaults.mergeWithDefaults(userConfig, 'software', 'small')

      expect(merged.defaultPriority).toBe('high')
      expect(merged.maxTitleLength).toBe(150)
      expect(merged.enableComments).toBe(false)
      expect(merged.defaultType).toBe('task') // From software project type
    })

    it('should get workflow defaults', () => {
      const workflow = TicketConfigDefaults.getWorkflowDefaults()

      expect(workflow.allowStatusTransitions).toBeDefined()
      expect(workflow.allowStatusTransitions.pending).toContain('in_progress')
      expect(workflow.requireAssigneeForProgress).toBe(false)
    })

    it('should get feature flag defaults', () => {
      const flags = TicketConfigDefaults.getFeatureFlagDefaults()

      expect(flags.enableComments).toBe(true)
      expect(flags.enableAttachments).toBe(true)
      expect(flags.enableTasks).toBe(true)
      expect(flags.enableLabels).toBe(true)
      expect(flags.enableRelationships).toBe(true)
    })
  })

  describe('UIConfigDefaults', () => {
    it('should provide base defaults', () => {
      const defaults = UIConfigDefaults.getDefaults()

      expect(defaults.outputFormat).toBe('table')
      expect(defaults.enableColorOutput).toBe(true)
      expect(defaults.theme).toBe('default')
      expect(defaults.language).toBe('en')
    })

    it('should provide terminal capability-specific defaults', () => {
      const basicDefaults = UIConfigDefaults.getTerminalCapabilityDefaults('basic')
      const advancedDefaults = UIConfigDefaults.getTerminalCapabilityDefaults('advanced')

      expect(basicDefaults.enableColorOutput).toBe(false)
      expect(basicDefaults.enableInteractiveMode).toBe(false)

      expect(advancedDefaults.enableColorOutput).toBe(true)
      expect(advancedDefaults.enableSoundNotifications).toBe(true)
    })

    it('should provide user role-specific defaults', () => {
      const developerDefaults = UIConfigDefaults.getUserRoleDefaults('developer')
      const managerDefaults = UIConfigDefaults.getUserRoleDefaults('manager')

      expect(developerDefaults.outputFormat).toBe('json')
      expect(developerDefaults.dateFormat).toBe('iso')

      expect(managerDefaults.outputFormat).toBe('table')
      expect(managerDefaults.dateFormat).toBe('absolute')
    })

    it('should merge user config with defaults', () => {
      const userConfig = {
        outputFormat: 'yaml' as const,
        enableColorOutput: false,
        theme: 'dark' as const,
      }

      const merged = UIConfigDefaults.mergeWithDefaults(userConfig, 'standard', 'developer')

      expect(merged.outputFormat).toBe('yaml')
      expect(merged.enableColorOutput).toBe(false)
      expect(merged.theme).toBe('dark')
      expect(merged.language).toBe('en') // Should preserve defaults
    })

    it('should get output format-specific defaults', () => {
      const jsonDefaults = UIConfigDefaults.getOutputFormatDefaults('json')
      const tableDefaults = UIConfigDefaults.getOutputFormatDefaults('table')

      expect(jsonDefaults.enableColorOutput).toBe(false)
      expect(jsonDefaults.enableInteractiveMode).toBe(false)

      expect(tableDefaults.enableColorOutput).toBe(true)
      expect(tableDefaults.showProgressBars).toBe(true)
    })

    it('should get terminal-aware defaults', () => {
      const defaults = UIConfigDefaults.getTerminalAwareDefaults()

      expect(defaults.outputFormat).toBeDefined()
      expect(defaults.enableColorOutput).toBeDefined()
      expect(defaults.enableInteractiveMode).toBeDefined()
    })
  })

  describe('StorageConfigDefaults', () => {
    it('should provide base defaults', () => {
      const defaults = StorageConfigDefaults.getDefaults()

      expect(defaults.dataPath).toBe('')
      expect(defaults.backupEnabled).toBe(true)
      expect(defaults.xdgCompliant).toBe(true)
      expect(defaults.fileEncoding).toBe('utf8')
    })

    it('should provide environment-specific defaults', () => {
      const devDefaults = StorageConfigDefaults.getEnvironmentDefaults('development')
      const prodDefaults = StorageConfigDefaults.getEnvironmentDefaults('production')

      expect(devDefaults.backupEnabled).toBe(false)
      expect(devDefaults.compressionEnabled).toBe(false)

      expect(prodDefaults.backupEnabled).toBe(true)
      expect(prodDefaults.compressionEnabled).toBe(true)
    })

    it('should provide platform-specific defaults', () => {
      const windowsDefaults = StorageConfigDefaults.getPlatformDefaults('win32')
      const linuxDefaults = StorageConfigDefaults.getPlatformDefaults('linux')

      expect(windowsDefaults.xdgCompliant).toBe(false)
      expect(linuxDefaults.xdgCompliant).toBe(true)
    })

    it('should provide performance profile-specific defaults', () => {
      const fastDefaults = StorageConfigDefaults.getPerformanceDefaults('fast')
      const safeDefaults = StorageConfigDefaults.getPerformanceDefaults('safe')

      expect(fastDefaults.compressionEnabled).toBe(false)
      expect(fastDefaults.syncToDisk).toBe(false)

      expect(safeDefaults.compressionEnabled).toBe(true)
      expect(safeDefaults.syncToDisk).toBe(true)
    })

    it('should merge user config with defaults', () => {
      const userConfig = {
        dataPath: '/custom/path',
        backupEnabled: false,
        compressionEnabled: true,
      }

      const merged = StorageConfigDefaults.mergeWithDefaults(userConfig)

      expect(merged.dataPath).toBe('/custom/path')
      expect(merged.backupEnabled).toBe(false)
      expect(merged.compressionEnabled).toBe(true)
      expect(merged.xdgCompliant).toBe(true) // Should preserve defaults
    })

    it('should get recommended configuration for use cases', () => {
      const devConfig = StorageConfigDefaults.getRecommendedConfig('development')
      const prodConfig = StorageConfigDefaults.getRecommendedConfig('production')
      const testConfig = StorageConfigDefaults.getRecommendedConfig('testing')

      expect(devConfig.backupEnabled).toBe(false)
      expect(prodConfig.backupEnabled).toBe(true)
      expect(testConfig.backupEnabled).toBe(false)
    })

    it('should get specific defaults', () => {
      const backupDefaults = StorageConfigDefaults.getBackupDefaults()
      const performanceDefaults = StorageConfigDefaults.getPerformanceDefaults('balanced')
      const reliabilityDefaults = StorageConfigDefaults.getReliabilityDefaults()

      expect(backupDefaults.backupEnabled).toBe(true)
      expect(performanceDefaults.compressionEnabled).toBe(true)
      expect(reliabilityDefaults.fileLockingEnabled).toBe(true)
    })
  })
})
