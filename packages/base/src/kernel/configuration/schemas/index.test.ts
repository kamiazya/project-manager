import { describe, expect, it } from 'vitest'
import {
  AppConfigValidation,
  StorageConfigValidation,
  TicketConfigValidation,
  UIConfigValidation,
} from './index.ts'

describe('Configuration Schemas', () => {
  describe('TicketConfigValidation', () => {
    it('should validate valid priority values', () => {
      expect(TicketConfigValidation.isValidPriority('high')).toBe(true)
      expect(TicketConfigValidation.isValidPriority('medium')).toBe(true)
      expect(TicketConfigValidation.isValidPriority('low')).toBe(true)
      expect(TicketConfigValidation.isValidPriority('invalid')).toBe(false)
    })

    it('should validate valid type values', () => {
      expect(TicketConfigValidation.isValidType('feature')).toBe(true)
      expect(TicketConfigValidation.isValidType('bug')).toBe(true)
      expect(TicketConfigValidation.isValidType('task')).toBe(true)
      expect(TicketConfigValidation.isValidType('invalid')).toBe(false)
    })

    it('should validate valid status values', () => {
      expect(TicketConfigValidation.isValidStatus('pending')).toBe(true)
      expect(TicketConfigValidation.isValidStatus('in_progress')).toBe(true)
      expect(TicketConfigValidation.isValidStatus('completed')).toBe(true)
      expect(TicketConfigValidation.isValidStatus('archived')).toBe(true)
      expect(TicketConfigValidation.isValidStatus('invalid')).toBe(false)
    })

    it('should validate complete ticket configuration', () => {
      const validConfig = {
        defaultPriority: 'medium',
        defaultType: 'task',
        defaultStatus: 'pending',
        defaultPrivacy: 'local-only',
        maxTitleLength: 100,
        maxDescriptionLength: 1000,
        autoGenerateIds: true,
        idFormat: 'hex',
        idLength: 8,
      }

      expect(TicketConfigValidation.isValidConfig(validConfig)).toBe(true)
      expect(TicketConfigValidation.isValidConfig(null)).toBe(false)
      expect(TicketConfigValidation.isValidConfig({})).toBe(false)
    })
  })

  describe('UIConfigValidation', () => {
    it('should validate valid output format values', () => {
      expect(UIConfigValidation.isValidOutputFormat('table')).toBe(true)
      expect(UIConfigValidation.isValidOutputFormat('json')).toBe(true)
      expect(UIConfigValidation.isValidOutputFormat('yaml')).toBe(true)
      expect(UIConfigValidation.isValidOutputFormat('plain')).toBe(true)
      expect(UIConfigValidation.isValidOutputFormat('invalid')).toBe(false)
    })

    it('should validate valid date format values', () => {
      expect(UIConfigValidation.isValidDateFormat('absolute')).toBe(true)
      expect(UIConfigValidation.isValidDateFormat('relative')).toBe(true)
      expect(UIConfigValidation.isValidDateFormat('iso')).toBe(true)
      expect(UIConfigValidation.isValidDateFormat('invalid')).toBe(false)
    })

    it('should validate complete UI configuration', () => {
      const validConfig = {
        outputFormat: 'table',
        enableColorOutput: true,
        enableInteractiveMode: true,
        showHelpOnError: true,
        maxTitleLength: 50,
        dateFormat: 'relative',
        showProgressBars: true,
        itemsPerPage: 20,
        enableSoundNotifications: false,
        enableDesktopNotifications: true,
        theme: 'default',
        language: 'en',
      }

      expect(UIConfigValidation.isValidConfig(validConfig)).toBe(true)
      expect(UIConfigValidation.isValidConfig(null)).toBe(false)
      expect(UIConfigValidation.isValidConfig({})).toBe(false)
    })
  })

  describe('StorageConfigValidation', () => {
    it('should validate valid file encoding values', () => {
      expect(StorageConfigValidation.isValidFileEncoding('utf8')).toBe(true)
      expect(StorageConfigValidation.isValidFileEncoding('utf16le')).toBe(true)
      expect(StorageConfigValidation.isValidFileEncoding('latin1')).toBe(true)
      expect(StorageConfigValidation.isValidFileEncoding('ascii')).toBe(true)
      expect(StorageConfigValidation.isValidFileEncoding('invalid')).toBe(false)
    })

    it('should validate path values', () => {
      expect(StorageConfigValidation.isValidPath('')).toBe(true) // Empty allowed
      expect(StorageConfigValidation.isValidPath('/valid/path')).toBe(true)
      expect(StorageConfigValidation.isValidPath('relative/path')).toBe(true)
      expect(StorageConfigValidation.isValidPath('path\0with\0null')).toBe(false)
    })

    it('should validate complete storage configuration', () => {
      const validConfig = {
        dataPath: '',
        backupEnabled: true,
        backupCount: 5,
        xdgCompliant: true,
        fileEncoding: 'utf8',
        compressionEnabled: false,
        compressionThreshold: 1024,
        fileLockingEnabled: true,
        fileOperationTimeout: 30000,
        autoCleanupEnabled: true,
        cleanupThresholdDays: 30,
        integrityChecksEnabled: true,
        syncToDisk: false,
      }

      expect(StorageConfigValidation.isValidConfig(validConfig)).toBe(true)
      expect(StorageConfigValidation.isValidConfig(null)).toBe(false)
      expect(StorageConfigValidation.isValidConfig({})).toBe(false)
    })
  })

  describe('AppConfigValidation', () => {
    it('should validate valid environment values', () => {
      expect(AppConfigValidation.isValidEnvironment('development')).toBe(true)
      expect(AppConfigValidation.isValidEnvironment('production')).toBe(true)
      expect(AppConfigValidation.isValidEnvironment('test')).toBe(true)
      expect(AppConfigValidation.isValidEnvironment('invalid')).toBe(false)
    })

    it('should validate version strings', () => {
      expect(AppConfigValidation.isValidVersion('1.0.0')).toBe(true)
      expect(AppConfigValidation.isValidVersion('1.0.0-beta')).toBe(true)
      expect(AppConfigValidation.isValidVersion('1.0.0+build')).toBe(true)
      expect(AppConfigValidation.isValidVersion('1.0.0-beta+build')).toBe(true)
      expect(AppConfigValidation.isValidVersion('invalid')).toBe(false)
      expect(AppConfigValidation.isValidVersion('1.0')).toBe(false)
    })

    it('should validate update check intervals', () => {
      expect(AppConfigValidation.isValidUpdateInterval(1)).toBe(true)
      expect(AppConfigValidation.isValidUpdateInterval(24)).toBe(true)
      expect(AppConfigValidation.isValidUpdateInterval(24 * 7)).toBe(true)
      expect(AppConfigValidation.isValidUpdateInterval(0)).toBe(false)
      expect(AppConfigValidation.isValidUpdateInterval(24 * 8)).toBe(false)
    })

    it('should validate extensions object', () => {
      expect(AppConfigValidation.isValidExtensions({})).toBe(true)
      expect(AppConfigValidation.isValidExtensions({ key: 'value' })).toBe(true)
      expect(AppConfigValidation.isValidExtensions(null)).toBe(false)
      expect(AppConfigValidation.isValidExtensions([])).toBe(false)
      expect(AppConfigValidation.isValidExtensions('string')).toBe(false)
    })
  })
})
