/**
 * Tests for Branded Types
 */

import { describe, expect, it } from 'vitest'
import {
  type ConfigurationId,
  createConfigurationId,
  createEnvironmentName,
  createFilePath,
  createSemanticVersion,
  createTimestamp,
  type EnvironmentName,
  type FilePath,
  isFilePath,
  isSemanticVersion,
  type SemanticVersion,
  type Timestamp,
} from './branded-types.ts'

describe('Branded Types', () => {
  describe('SemanticVersion', () => {
    it('should create valid semantic versions', () => {
      const version = createSemanticVersion('1.0.0')
      expect(version).toBe('1.0.0')

      const versionWithPrerelease = createSemanticVersion('1.0.0-alpha.1')
      expect(versionWithPrerelease).toBe('1.0.0-alpha.1')

      const versionWithBuild = createSemanticVersion('1.0.0+build.123')
      expect(versionWithBuild).toBe('1.0.0+build.123')
    })

    it('should reject invalid semantic versions', () => {
      expect(() => createSemanticVersion('invalid')).toThrow('Invalid semantic version')
      expect(() => createSemanticVersion('1.0')).toThrow('Invalid semantic version')
      expect(() => createSemanticVersion('1.0.0.0')).toThrow('Invalid semantic version')
      expect(() => createSemanticVersion('')).toThrow('Invalid semantic version')
    })

    it('should validate semantic versions', () => {
      expect(isSemanticVersion('1.0.0')).toBe(true)
      expect(isSemanticVersion('1.0.0-alpha.1')).toBe(true)
      expect(isSemanticVersion('1.0.0+build.123')).toBe(true)
      expect(isSemanticVersion('invalid')).toBe(false)
      expect(isSemanticVersion('1.0')).toBe(false)
    })
  })

  describe('FilePath', () => {
    it('should create valid file paths', () => {
      const path = createFilePath('/path/to/file.txt')
      expect(path).toBe('/path/to/file.txt')

      const relativePath = createFilePath('./relative/path.txt')
      expect(relativePath).toBe('./relative/path.txt')
    })

    it('should reject invalid file paths', () => {
      expect(() => createFilePath('')).toThrow('Invalid file path')
    })

    it('should validate file paths', () => {
      expect(isFilePath('/path/to/file.txt')).toBe(true)
      expect(isFilePath('./relative/path.txt')).toBe(true)
      expect(isFilePath('file.txt')).toBe(true)
      expect(isFilePath('')).toBe(false)
    })
  })

  describe('Timestamp', () => {
    it('should create valid timestamps', () => {
      const timestamp = createTimestamp(1234567890)
      expect(timestamp).toBe(1234567890)

      const now = createTimestamp()
      expect(typeof now).toBe('number')
      expect(now).toBeGreaterThan(0)
    })

    it('should reject invalid timestamps', () => {
      expect(() => createTimestamp(-1)).toThrow('Invalid timestamp')
      expect(() => createTimestamp(NaN)).toThrow('Invalid timestamp')
    })
  })

  describe('ConfigurationId', () => {
    it('should create valid configuration IDs', () => {
      const id = createConfigurationId('config-123')
      expect(id).toBe('config-123')
    })

    it('should reject invalid configuration IDs', () => {
      expect(() => createConfigurationId('')).toThrow('Invalid configuration ID')
    })
  })

  describe('EnvironmentName', () => {
    it('should create valid environment names', () => {
      const env = createEnvironmentName('development')
      expect(env).toBe('development')
    })

    it('should reject invalid environment names', () => {
      expect(() => createEnvironmentName('')).toThrow('Invalid environment name')
    })
  })

  describe('Type Safety', () => {
    it('should enforce type safety with branded types', () => {
      const version = createSemanticVersion('1.0.0')
      const path = createFilePath('/path/to/file.txt')

      // This should compile without errors
      function processVersion(v: SemanticVersion): string {
        return v
      }

      function processPath(p: FilePath): string {
        return p
      }

      expect(processVersion(version)).toBe('1.0.0')
      expect(processPath(path)).toBe('/path/to/file.txt')

      // These would cause TypeScript errors if uncommented:
      // processVersion(path) // Error: Argument of type 'FilePath' is not assignable to parameter of type 'SemanticVersion'
      // processPath(version) // Error: Argument of type 'SemanticVersion' is not assignable to parameter of type 'FilePath'
    })
  })
})
