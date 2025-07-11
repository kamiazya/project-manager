import { describe, expect, it } from 'vitest'
import { expandPriority, expandType } from './cli-helpers.js'

describe('CLI Helper Functions', () => {
  describe('expandPriority', () => {
    it('should expand short forms to full priority values', () => {
      expect(expandPriority('h')).toBe('high')
      expect(expandPriority('m')).toBe('medium')
      expect(expandPriority('l')).toBe('low')
    })

    it('should handle full priority names', () => {
      expect(expandPriority('high')).toBe('high')
      expect(expandPriority('medium')).toBe('medium')
      expect(expandPriority('low')).toBe('low')
    })

    it('should be case insensitive', () => {
      expect(expandPriority('H')).toBe('high')
      expect(expandPriority('HIGH')).toBe('high')
      expect(expandPriority('Medium')).toBe('medium')
      expect(expandPriority('LOW')).toBe('low')
    })

    it('should default to medium for invalid input', () => {
      expect(expandPriority('invalid')).toBe('medium')
      expect(expandPriority('')).toBe('medium')
      expect(expandPriority('x')).toBe('medium')
    })
  })

  describe('expandType', () => {
    it('should expand short forms to full type values', () => {
      expect(expandType('f')).toBe('feature')
      expect(expandType('b')).toBe('bug')
      expect(expandType('t')).toBe('task')
    })

    it('should handle full type names', () => {
      expect(expandType('feature')).toBe('feature')
      expect(expandType('bug')).toBe('bug')
      expect(expandType('task')).toBe('task')
    })

    it('should be case insensitive', () => {
      expect(expandType('F')).toBe('feature')
      expect(expandType('FEATURE')).toBe('feature')
      expect(expandType('Bug')).toBe('bug')
      expect(expandType('TASK')).toBe('task')
    })

    it('should default to task for invalid input', () => {
      expect(expandType('invalid')).toBe('task')
      expect(expandType('')).toBe('task')
      expect(expandType('x')).toBe('task')
    })
  })
})
